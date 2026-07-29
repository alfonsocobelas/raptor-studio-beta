# ADR-006: Modelo de autorización

**Estado:** Propuesto
**Fecha:** 2026-07-10
**Autor:** Alfonso Domínguez
**Relacionado:** ADR-005 (tenancy), ADR-001 (arquitectura), `resource-schema-customers.md`

---

## 1. Contexto

El acelerador necesita control de accesos para ambos perfiles de tenancy (single y multi-pooled, ADR-005). La pregunta es si basta con **roles** o hace falta **mayor granularidad**.

Con solo roles (`if (user.role === 'admin')`) la política queda **cableada en el código**: cada regla o rol nuevo obliga a tocar y desplegar, y no permite concesiones parciales. Insuficiente en cuanto la app crece.

Además, el dominio tiene reglas a nivel de **registro**: un KAM debería ver/editar **solo sus clientes** (`customer.assignedKamId`), lo que no se expresa con roles de tipo.

---

## 2. Conceptos (referencia)

- **RBAC**: acceso por rol. El rol es la unidad de permiso. Simple, grueso.
- **RBAC con permisos**: permisos granulares `recurso:acción` agrupados en roles; **el código comprueba permisos, no roles**. Desacopla "cómo te llamas" de "qué puedes hacer".
- **ABAC**: decisión por atributos/condiciones del usuario y del **registro concreto** (ej. `assignedKamId === user.id`). Flexible, para reglas de propiedad/fila.

---

## 3. Decisión

**RBAC con permisos + scoping por propiedad puntual.** En concreto:

1. **Permisos granulares `recurso:acción`**: `customer:read`, `customer:update`, `contract:delete`, `license:export`…
2. **Roles = paquetes de permisos** (config por app): `viewer`, `manager`, `admin`… El usuario tiene roles.
3. **Checks por permiso, nunca por rol**: los endpoints exigen un permiso; un guard resuelve los permisos efectivos del usuario (unión de sus roles) y decide.
4. **Scoping por propiedad (ABAC ligero) solo donde el dominio lo pida**: además del permiso de tipo, una condición sobre el registro (KAM → sus clientes). Se aplica únicamente a los recursos que lo requieren, no globalmente.

```typescript
// check por permiso (no por rol)
@RequirePermissions('customer:update')
@Put(':id')
update(...) { ... }

// scoping por propiedad, solo en customer:
//   además de 'customer:update', exigir customer.assignedKamId === user.id
```

**Permisos derivados del resource-schema.** Como cada recurso generado tiene las mismas acciones (`view/edit/delete/export`, ya declaradas en el schema), el **generador emite el set de permisos y los guards** automáticamente. Los roles (qué permisos agrupan) se configuran por app; las reglas de propiedad son el hueco a mano / escape-hatch.

**Encaje con tenancy (ADR-005):**

```
Single-tenant:   permiso (recurso:acción)  [+ scoping por propiedad donde aplique]
Multi pooled:    tenant primero (RLS aísla datos)
                 + permiso dentro del tenant
                 + roles por tenant
                 [+ scoping por propiedad]  [+ opcional super-admin de plataforma]
```

Es el **mismo modelo de permisos**; en pooled solo se añade la capa de tenant (RLS) por encima.

---

## 4. Opciones consideradas

### Opción A — Solo RBAC (checks por rol)

**Pros:** trivial.
**Cons:** política cableada; roles proliferan; sin concesiones parciales; cambios requieren código. Se queda corto rápido.

### Opción B — RBAC con permisos + ABAC ligero (elegida)

**Pros:** granularidad sin cablear política; roles como config; permisos derivables del schema; ownership solo donde hace falta.
**Cons:** un poco más de infraestructura (tabla/config de permisos, guard); hay que decidir dónde aplica el scoping.

### Opción C — ABAC completo / motor de políticas (OPA, Cedar…)

**Pros:** máxima expresividad.
**Cons:** complejidad y operación desproporcionadas para dashboards de negocio. Over-engineering salvo requisito regulatorio.

---

## 5. Análisis de trade-offs

El eje es **expresividad vs. simplicidad**. RBAC-con-permisos cubre el 90% (quién puede hacer qué, por tipo) con coste bajo; el ABAC ligero cubre el 10% de reglas de propiedad sin arrastrar un motor de políticas. El ABAC completo (C) solo compensa con requisitos regulatorios o reglas muy dinámicas — no es el caso.

Pragmatismo (YAGNI): empezar con RBAC-con-permisos y añadir scoping por propiedad **solo** en los recursos que el dominio marque (hoy, `customer↔KAM`).

---

## 6. Consecuencias

**Más fácil**

- Añadir/cambiar roles sin tocar código (reagrupar permisos).
- Permisos base gratis (derivados del schema por el generador).
- Mismo modelo en single y pooled.

**Más difícil / a vigilar**

- Definir dónde aplica el scoping por propiedad (no meterlo en todo).
- Mantener el guard como único punto de decisión (no dispersar checks).
- No escalar a ABAC completo sin necesidad real.

**A revisar**

- Si aparecen reglas de acceso muy dinámicas o multi-atributo → evaluar un motor de políticas (Opción C) para _ese_ subconjunto.
- Rol super-admin de plataforma en pooled: definir su alcance con cuidado.

---

## 7. Action items

1. [ ] Definir el catálogo de permisos `recurso:acción` (derivado de las acciones del resource-schema).
2. [ ] Guard de permisos + decorador `@RequirePermissions` (punto único de decisión).
3. [ ] Roles como configuración por app (paquetes de permisos), no hardcodeados en checks.
4. [ ] Mecanismo de scoping por propiedad reutilizable (ej. CASL), aplicado solo donde el schema lo marque (empezar por `customer.assignedKamId`).
5. [ ] Generador: emitir permisos + guards por recurso automáticamente; dejar el scoping como hueco marcado.
6. [ ] En pooled: combinar permiso + RLS (tenant) + scoping, en ese orden.
