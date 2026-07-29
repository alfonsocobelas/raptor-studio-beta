# Contexto para continuar — Diseño del "acelerador de dashboards/APIs"

> Pega esto al inicio de la nueva conversación. Resume una sesión de brainstorming ya cerrada. **No re-litigar lo ya decidido**; el objetivo es continuar desde aquí.

## Quién soy y cómo trabajo
Soy Alfonso, dev en solitario. Proyecto `sap-licences`: Angular 21 + Signals + Spartan NG / NestJS 11 + TypeORM + PostgreSQL / Nx monorepo / DDD + Clean Architecture. **Responde en español.** Rol esperado: Senior Engineer + arquitecto pragmático (YAGNI/KISS), **honestidad intelectual (contrapeso, no adulación)**, TDD, "generar, no interpretar". Reglas completas en el `CLAUDE.md` del repo. Proyectos de referencia: `sap-licences` (DDD fullstack) e `ip-opentext-cmis-api` (bridge hexagonal a OpenText CMIS, sin BD).

## Objetivo
Diseñar un **acelerador** para generar rápido dashboards y APIs para distintos clientes, con desacoplamiento de UI, de infraestructura cloud, y con la arquitectura adaptada al problema.

## A dónde llegamos (conclusiones firmes, no reabrir)
- **Descartado:** RAG por imagen→código (IA-céntrico, bajo valor marginal; converge en generación schema-driven).
- **Elegido:** un **generador Nx DETERMINISTA** (plantillas EJS) que, desde una **definición de entidad**, emite un módulo completo (dominio + persistencia + vista). Sin IA en el núcleo.
- **IA solo en los bordes** (opcional, bajo gate): ① redactar el modelo desde NL/SQL/captura; ② rellenar huecos marcados (`// @ai:begin…@ai:end`): validación de negocio, tests edge, seed. Lema: **determinismo en el centro, IA en los bordes, verificación en la frontera** (compila + `enforce-module-boundaries` + tests + diff).
- **Marco unificador — hexágono con los dos lados abiertos:** el acelerador aporta la espina *ports & adapters* + kernel; el arquetipo y el CLI eligen los adapters. Lado **primario/driving** (UI, API REST, contrato CMIS) y lado **secundario/driven** (BD, API externa, storage, auth, tenant). **Regla de los dos:** un puerto se abstrae en el 2º-3º adapter real, no antes; con uno solo, adapter directo.

## Decisiones registradas (ADRs)
- **ADR-001** — arquitectura general + estrategias multi-tenant.
- **ADR-002** — datos: **denormalización** por defecto en listados CRUD (una tabla, sin join); JOIN/read-model solo para reporting a mano; composición cargable dentro del agregado.
- **ADR-003** — UI: desacoplamiento por capas. *Nivel 1* (plantillas emiten contra componentes shared → cambiar piel = shared + regenerar) ahora; *Nivel 2* (contratos headless + adapters, sin regenerar) bajo demanda. Lint prohíbe `@spartan-ng/*` en features.
- **ADR-004** — infra: **puertos + catálogo de adapters por referencia + composition root generado** (`.env` + Terraform). Runtime por env (12-factor). ROI: storage/Postgres fácil, identidad vía OIDC, **cómputo difícil (Cloudflare Workers ≠ contenedor Node)**. Test de conformidad por puerto obligatorio.
- **ADR-005** — tenancy: perfiles **single** y **multi-pooled** (`tenant_id` + **RLS** de Postgres). Puerto `TenantContext` siempre presente (dominio agnóstico). Es **perfil de generación**, no de runtime. Hedge "build for multi, run as single" si el cliente puede crecer.
- **ADR-006** — autorización: **RBAC con permisos** `recurso:acción` agrupados en roles; **checks por permiso, no por rol**; scoping por propiedad (ABAC ligero) **solo donde el dominio lo pida** (`customer.assignedKamId`). Permisos base **derivados del schema** por el generador.
- **ADR-007** — arquetipos (**decisión de nivel 0, se elige primero**): `ddd-fullstack` (ref `sap-licences`) vs `bridge-api` (ref `ip-opentext-cmis-api`). Hallazgo: **misma espina ports & adapters**; difieren en grado de dominio, qué envuelve el lado secundario (BD vs API externa), BD/UI sí/no, y la entrada del generador (entidad vs endpoints). No crear el perfil `layered` sin proyecto de referencia real.

## Modelo de dominio (verificado del código de sap-licences)
Grafo con raíz `Customer`; relaciones **por referencia de ID** (sin FK dura entre contextos), soft-delete (`deletedAt`), denormalización (`customerName` copiado en contract/license/project). Agregados con **protocolo común** `create/fromPrimitives/toPrimitives/updateDetails/equals` + Value Objects con `create()` validador. Repositorios como puertos (`matching/exists/count` con `Criteria`). Dos tipos de arista: composición (cascada, dentro del agregado) y referencia entre contextos (solo ID + lookup).

## El generador (mecanismo)
Plugin Nx local (`libs/generators`): `generator.ts` + `schema.json` + `files/` (plantillas EJS con `__name__` y sufijo `.template`). **Lógica en `generator.ts`, plantillas tontas.** Entrada = **resource-schema** (proyección del UML: por campo declara `vo`+constraints, `query` filtrable/ordenable/buscable, `table` columna+ancho, `form` control). **Validación por referencias de oro:** regenerar los 4 módulos ya escritos a mano (customer/contract/license/project) y comparar por `diff` (vacío = correcto). Coherencia front↔back gratis: `columns[]` y `ALLOWED_FILTERS/ORDERS` salen del mismo array `fields`.

## Estado y siguiente paso
- **Fase:** brainstorming cerrado. Diseño sólido y coherente.
- **Pendiente antes de la spec:** cerrar las **5 decisiones abiertas** del resource-schema de customers (unicidad condicional de taxId; qué implica `origin:'sap'` respecto a editabilidad; drill-down declarado en padre vs inferido del hijo; `assignedKamId` sin UI; nombres de VO explícitos vs derivados).
- **Siguiente:** `/spec-new` para la feature **"generador de recurso"** en perfil `ddd-fullstack`. Primera tarea (guía §9): plugin Nx vacío + generar la **entidad TypeORM de `contract`**, validada por diff. TDD, tareas atómicas, `make commit` (Conventional Commits).

## Documentos producidos (guardar idealmente en `docs/acelerador/` del repo)
Maestro: `ACELERADOR-arquitectura-consolidada.md` (leer primero; supera al `dossier-…` antiguo).
ADRs: `arquitectura-acelerador-dashboards.md` (=ADR-001), `ADR-002…ADR-007`.
Referencia: `uml-clases-dominio.md`, `uml-modelo-dominio.md`, `resource-schema-customers.md`, `guia-generador-nx.md`, `integracion-ia-generador.md`, `contrato-unidad-vista-rag.md` (concepto vigente, marco RAG superado).
Ignorar: `dossier-acelerador-dashboards.md` (superado).

## Cómo quiero continuar
Retomar desde "estado y siguiente paso". Primero ayúdame a cerrar las 5 decisiones abiertas del resource-schema; luego montamos la spec del generador. Mantén el rol de contrapeso técnico: discrepa con argumentos si algo no encaja.
