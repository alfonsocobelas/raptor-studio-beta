# ADR-005: Tenancy como perfil seleccionable

**Estado:** Propuesto
**Fecha:** 2026-07-10
**Autor:** Alfonso Domínguez
**Relacionado:** ADR-001 (estrategias multi-tenant), ADR-004 (catálogo de adapters), ADR-006 (autorización)

---

## 1. Contexto

Según el cliente, la app puede necesitar ser **multi-tenant** o **single-tenant con user/admin simple**. Es una decisión **profunda** (toca el modelo de datos y la auth) y **difícil de revertir**, así que debe elegirse al crear la app, no improvisarse.

El espectro completo de tenancy va de *pool* (todo compartido) a *silo* (todo aislado): single-tenant dedicado, multi pooled (tenant_id), schema-per-tenant, DB-per-tenant, instancia-per-tenant. De todo ello, el acelerador soporta **solo dos perfiles** por decisión explícita; el resto añade complejidad de migración/operación que rara vez compensa y se deja fuera del catálogo salvo demanda concreta.

---

## 2. Decisión

**Dos perfiles seleccionables al crear la app:**

1. **Single-tenant** — una instancia = un cliente. Sin `tenant_id` en las entidades. Auth user/admin simple (ver ADR-006).
2. **Multi-tenant pooled** — una instancia = varios clientes, BD compartida con `tenant_id` + **RLS** de PostgreSQL. Recomendación del ADR-001 (opción A).

**Mecanismo unificador:** un puerto **`TenantContext`** que el código de negocio usa **siempre**. Los use-cases y repositorios nunca preguntan "¿multi o single?"; piden el tenant al contexto.

- Single: `TenantContext` devuelve un **tenant fijo** (null-object).
- Pooled: `TenantContext` **resuelve por request** (desde JWT/subdominio) y fija la variable de sesión para RLS.

**Es un perfil de _generación_, no de runtime.** La diferencia toca el esquema (presencia de la columna `tenant_id`), así que el CLI pregunta al crear la app y el generador emite entidades con o sin `tenant_id` y registra el adapter de `TenantContext` correspondiente. No se cambia de perfil en caliente.

---

## 3. RLS (Row-Level Security) en el perfil pooled

RLS hace que **PostgreSQL** —no el código— fuerce el aislamiento. Se define una política por tabla y la BD añade el filtro por tenant a toda consulta:

```sql
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON contracts
  USING (tenant_id = current_setting('app.current_tenant')::uuid);
-- por request:  SET app.current_tenant = '<tenant-del-usuario>'
```

Convierte el punto débil del pooled ("depende de que ningún filtro falle") en una **garantía a nivel de BD**: aunque un query olvide el `WHERE tenant_id`, no filtra datos de otros tenants.

---

## 4. Opciones consideradas

### Opción A — Perfil de generación (single | pooled), TenantContext siempre presente — elegida

**Pros:** cada app es tan simple como necesita (single no carga `tenant_id`); código de negocio idéntico entre perfiles (siempre vía `TenantContext`); pooled protegido por RLS.
**Cons:** dos caminos en las plantillas del generador; el perfil se fija al crear (migrar single→pooled después es costoso).

### Opción B — Siempre multi-tenant, correr como single (un tenant fijo)

**Pros:** un solo camino de código; migración a multi trivial (ya lo es).
**Cons:** apps single cargan complejidad que no necesitan (`tenant_id`, RLS, resolución). Over-engineering para un cliente que nunca será multi.

### Opción C — Runtime configurable (una misma app conmuta single/multi)

**Pros:** flexibilidad máxima.
**Cons:** el caso difícil y casi nunca necesario; `tenant_id` es estructural, no un flag de runtime. Complejidad injustificada.

---

## 5. Análisis de trade-offs y el hedge de crecimiento

El eje es **simplicidad de la app single vs. coste de migrar a multi después**. Como añadir `tenant_id` retroactivamente (backfill + RLS) es doloroso, la pregunta del CLI tiene peso:

- Cliente que **claramente nunca** será multi → perfil **single** (más simple).
- Cliente que **podría crecer** a multi → **construir pooled desde el principio y correrlo con un tenant** ("build for multi, run as single"). Es el hedge que evita la migración dolorosa.

Es una decisión **por cliente**, no un default global.

---

## 6. Consecuencias

**Más fácil**
- App single mínima; app pooled con aislamiento robusto (RLS).
- Código de dominio agnóstico a la tenancy (solo cambia cableado + esquema).

**Más difícil / a vigilar**
- Migrar single→pooled a posteriori es costoso → decidir bien al crear.
- Dos ramas en las plantillas del generador (con/sin `tenant_id`).
- Disciplina: **ningún use-case debe llevar `if (multiTenant)`**; si aparece, el diseño se rompió.

**A revisar**
- Si un cliente single crece hacia multi → aplicar el hedge o planificar migración.
- Perfiles intermedios (schema/DB-per-tenant) solo si un cliente los exige.

---

## 7. Action items

1. [ ] Definir el puerto `TenantContext` (usado por repos/use-cases siempre).
2. [ ] Adapter single (tenant fijo) y adapter pooled (resuelve por request + fija variable RLS).
3. [ ] Perfil de generación: plantillas de entidad con/sin `tenant_id`; políticas RLS en el perfil pooled.
4. [ ] Pregunta del CLI al crear app: single | pooled, con nota del hedge de crecimiento.
5. [ ] Regla: prohibir ramificaciones de tenancy en la capa de dominio/aplicación.
