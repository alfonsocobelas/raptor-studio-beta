# Producto — Acelerador de Dashboards

## Qué es

Herramienta interna para **generar dashboards de negocio y APIs para distintos clientes** de forma rápida y repetible. No es una app de negocio: su "usuario" es el propio equipo (Alfonso) entregando proyectos a clientes con distinta piel (librería UI) y distinta infraestructura cloud.

## El problema

Los dashboards comparten muchísimo (tablas paginadas con filtro/orden/búsqueda, CRUD, export, auth) y cambian en tres ejes por cliente: **modelo de datos**, **piel** e **infraestructura**. Hoy ese 80% común se reescribe a mano en cada proyecto.

## La solución (diseño cerrado 2026-07-12)

1. **Generador Nx determinista**: resource-schema → módulo completo (dominio + persistencia + vista). Plantillas EJS, sin IA en el núcleo.
2. **Validación por referencias de oro**: regenerar los 4 módulos escritos a mano de sap-licenses (customers, contracts, licenses, projects) y comparar por diff. Diff vacío ⇒ generador correcto.
3. **Catálogo de adapters de infra** (ADR-004): puertos estables + adapters almacenados una vez (Azure primero: config/Key Vault, Blob Storage, ACS email, App Insights). El generador no genera infra; la compone.
4. **IA en los bordes** (opcional, bajo gate): redactar el modelo desde NL/SQL/captura; rellenar huecos `// @ai:begin…@ai:end`.

## Decisiones firmes (no re-litigar)

- **Descartado** el RAG por imagen (convergía en generación schema-driven).
- **Arquetipos** (ADR-007, decisión de nivel 0): `ddd-fullstack` (ref. sap-licences) y `bridge-api` (ref. ip-opentext-cmis-api). Misma espina ports & adapters. No crear perfil `layered` sin referencia real.
- **Datos** (ADR-002): denormalización por defecto en listados CRUD; JOIN/read-model solo para reporting a mano.
- **UI** (ADR-003): Nivel 1 ahora (plantillas emiten contra componentes shared); Nivel 2 (headless + adapters) bajo demanda. Lint prohíbe `@spartan-ng/*` en features.
- **Infra** (ADR-004): puerto + catálogo + composition root generado. Empezar por `StoragePort`. Regla de los dos: el puerto se abstrae en el 2º-3º adapter real.
- **Tenancy** (ADR-005): perfiles `single` y `multi-pooled` (tenant_id + RLS) como perfil de generación, no de runtime.
- **Autorización** (ADR-006): RBAC con permisos `recurso:acción`; checks por permiso, no por rol; permisos base derivados del schema.

## Secuencia de construcción (por riesgo)

```
1. UML+ER (hecho) → 2. resource-schema customers → 3. generador Nx (regenera customers → diff)
→ 4. validar 4 entidades → 5. StoragePort + adapter Azure → 6. UI Nivel 1 / IA bordes
→ 7. 2º proveedor / Nivel 2 UI (SOLO bajo demanda)
```

**Profundidad antes que anchura**: un recurso perfecto antes que muchos a medias.

## Lo que NO es este proyecto

- No es un framework público ni un producto: es un subproducto de proyectos reales de cliente.
- No es un intérprete de runtime: el schema genera código que luego es tuyo ("generar, no interpretar").
- No construye adapters especulativos (segundo proveedor cloud solo cuando haya cliente real).

## Riesgo dominante

No es técnico: es mantener un meta-framework en solitario mientras se entregan clientes. Mitigación: construir la versión aburrida primero y dejar que las **horas ahorradas medibles** decidan cada capa siguiente.
