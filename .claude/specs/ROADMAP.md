# ROADMAP — Acelerador de Dashboards

> Mapa de specs del proyecto, derivado de la secuencia por riesgo del documento maestro (§9).
> Regla: **profundidad antes que anchura** — un recurso perfecto antes que muchos a medias.
> Las specs se crean con `/spec-new` cuando llega su turno; este mapa solo ordena la intención.

## Fase 1 — Núcleo del generador (el 70-80% de probabilidad de éxito)

| Nº  | Spec                                             | Objetivo                                                                                                      | Estado        |
| --- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- | ------------- |
| 00  | ✅ `generador-recurso` [DONE]                    | Workspace Nx + plugin `@acc/generators` + primera plantilla (entidad TypeORM de `contract`) validada por diff | ✅ Completada |
| 01  | ✅ `schema-lib` [DONE]                           | `libs/schema`: `defineResource`, tipos, validación del modelo (cerrando las 5 decisiones §5)                  | Pendiente     |
| 02  | ✅ `golden-fixtures`                             | Congelar los 4 módulos de oro desde `docs/referencia` + comando/target de diff                                | Pendiente     |
| 03  | ✅ `plantillas-backend` (corte canónico)         | Módulo backend completo (domain + application + infrastructure) con diff vacío para `contract`                | Pendiente     |
| 04  | ⏸ `plantillas-frontend` (explorada; requiere C2) | Vista completa (list + dialog + detail + service + rutas) con diff vacío                                      | Pendiente     |
| 05  | `validacion-4-entidades`                         | Las 4 referencias de oro generan con diff vacío (gate completo)                                               | Pendiente     |

## Fase 2 — Catálogo de infra (Azure primero, ADR-004)

| Nº  | Spec                    | Objetivo                                                                                            | Estado    |
| --- | ----------------------- | --------------------------------------------------------------------------------------------------- | --------- |
| 06  | `infra-ports`           | `libs/infra/ports`: `StoragePort` + test de conformidad                                             | Pendiente |
| 07  | `adapter-storage-azure` | Copiar/adaptar `AzureBlobFileStorage` + config/Key Vault loader de la referencia                    | Pendiente |
| 08  | `composition-root`      | Registro de adapters + `.env.template` + scaffolding Terraform Azure (desde `docs/referencia/iac/`) | Pendiente |

## Fase 3 — Bordes (bajo demanda, no especulativo)

| Nº  | Spec                   | Objetivo                                                                                                             | Estado                 |
| --- | ---------------------- | -------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| 09  | `ia-pre-generacion`    | IA redacta el `*.model.ts` desde NL/SQL/captura, bajo gate                                                           | Bajo demanda           |
| 10  | `ia-post-generacion`   | Huecos `// @ai:begin…@ai:end` + gate determinista                                                                    | Bajo demanda           |
| —   | `ui-nivel-2`           | Contratos headless + adapters de piel (ADR-003)                                                                      | Solo con cliente real  |
| —   | `adapter-storage-s3`   | 2º proveedor: valida la abstracción del puerto                                                                       | Solo con cliente AWS   |
| —   | `arquetipo-bridge-api` | Perfil `bridge-api` (ref. ip-opentext-cmis-api)                                                                      | Solo con proyecto real |
| —   | `demo-app-gate-visual` | App de demo que monta el código generado + recuperar el gate visual Playwright MCP para conducir las vistas emitidas | Tras spec 04           |
| —   | `gitflow-completo`     | Reinstaurar ramas/PRs/rulesets (base: spec 51 de la referencia)                                                      | Cuando madure          |

## Pendientes conocidos (no bloquean la spec 00)

Del README del starter (2026-07-12): ADR-008 distribución del kernel (B1), selección de adapter en
generación (A3), propagación de denormalización (B2), scoping en Criteria (B4), constante compartida
de campos (C1), uniformización de los 4 módulos de oro (C2), anotar ADR-001 (A1).

✅ Las 5 decisiones del resource-schema fueron **ratificadas el 2026-07-30** (ver skill `schema-authoring`) —
el starter original las tenía cerradas pero no llegó a este repo.
