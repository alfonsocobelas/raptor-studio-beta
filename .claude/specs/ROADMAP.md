# ROADMAP — Acelerador de Dashboards

> Mapa de specs del proyecto, derivado de la secuencia por riesgo del documento maestro (§9).
> Regla: **profundidad antes que anchura** — un recurso perfecto antes que muchos a medias.
> Las specs se crean con `/spec-new` cuando llega su turno; este mapa solo ordena la intención.

## Fase 1 — Núcleo del generador (el 70-80% de probabilidad de éxito)

| Nº  | Spec                                                                                                                                                                                                      | Objetivo                                                                                                      | Estado        |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------- |
| 00  | ✅ `generador-recurso` [DONE]                                                                                                                                                                             | Workspace Nx + plugin `@acc/generators` + primera plantilla (entidad TypeORM de `contract`) validada por diff | ✅ Completada |
| 01  | ✅ `schema-lib` [DONE]                                                                                                                                                                                    | `libs/schema`: `defineResource`, tipos, validación del modelo (cerrando las 5 decisiones §5)                  | Pendiente     |
| 02  | ✅ `golden-fixtures`                                                                                                                                                                                      | Congelar los 4 módulos de oro desde `docs/referencia` + comando/target de diff                                | Pendiente     |
| 03  | ✅ `plantillas-backend` (corte canónico)                                                                                                                                                                  | Módulo backend completo (domain + application + infrastructure) con diff vacío para `contract`                | Pendiente     |
| 04  | 🔄 `plantillas-frontend` — list ✅ en customer+contract (diff vacío, canon C2). **list ✅ 4/4** (flags features.view/delete/edit, dtoName override, columnas virtuales). Pendiente: dialog/detail/service | Vista completa (list + dialog + detail + service + rutas) con diff vacío                                      | Pendiente     |
| 05  | `validacion-4-entidades`                                                                                                                                                                                  | Las 4 referencias de oro generan con diff vacío (gate completo)                                               | Pendiente     |

## Fase 2 — Catálogo de infra (ADR-004) — ampliada 2026-07-30 a petición de Alfonso

| Nº  | Spec                    | Objetivo                                                                                                                                                                                                                                                | Estado        |
| --- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| 06  | `infra-ports`           | `FileStoragePort` + suite de conformidad reutilizable                                                                                                                                                                                                   | ✅ 2026-07-30 |
| 07  | `adapter-storage-azure` | `AzureBlobFileStorage` (Blob) con tests de SDK mockeado                                                                                                                                                                                                 | ✅ 2026-07-30 |
| 08  | `config-azure`          | Plugin de config: loader JSON por entorno + resolver `vault.*` de Key Vault (copiar de referencia)                                                                                                                                                      | Pendiente     |
| 09  | `composition-root`      | Registro de adapters + `.env.template` + scaffolding Terraform Azure (desde `docs/referencia/iac/`)                                                                                                                                                     | Pendiente     |
| 10  | `adapter-storage-s3`    | Adapter S3-compatible (cubre **AWS S3, Cloudflare R2, MinIO local**) — valida el puerto con el 2º proveedor real; conformidad contra MinIO en docker                                                                                                    | Pendiente     |
| 11  | `adapter-storage-gcs`   | Adapter Google Cloud Storage (3º barato una vez validado el puerto)                                                                                                                                                                                     | Pendiente     |
| 12b | `auth-plugin`           | ✅ Puertos (PasswordHasher, SecureTokenGenerator, Clock, SessionStore sobre primitivas) + adapters argon2/crypto/system-clock/in-memory + **RedisSessionStore** (TTL nativo + índice por usuario para logout-everywhere; single-tenant, cookie-session) | ✅ 2026-07-30 |
| 12  | `secrets-port`          | `SecretsPort` + adapters: **Azure Key Vault** (referencia) · **Doppler** · **Bitwarden/Infisical** (free-tier para stacks Cloudflare)                                                                                                                   | Pendiente     |
| 13  | `observability-port`    | `AppLogger`/telemetría: **App Insights** (referencia) · **Prometheus+Grafana** (prom-client, self-host free) · **Sentry**                                                                                                                               | Pendiente     |
| 14  | `plantillas-tests`      | El generador emite también los tests del módulo (mothers, builders, repository mock, tests de VOs/use cases) — hoy los módulos de oro los tienen y el generador no los produce                                                                          | Pendiente     |
| 15  | `kernel-config-infra`   | Replicar del esqueleto de referencia: config por entornos JSON, logger, filtros/interceptores, health checks, Dockerfiles, CI                                                                                                                           | Pendiente     |

Nota (regla de los dos, ADR-004): la ampliación multi-cloud la pidió Alfonso el 2026-07-30. Orden de
ROI: S3-compatible primero (un adapter cubre 3 proveedores y valida el puerto), GCS después. Cómputo
sigue fuera (Cloudflare Workers ≠ contenedor Node — ADR-004 §6).

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

Del README del starter (2026-07-12): ~~ADR-008 distribución del kernel (B1)~~ → **RESUELTO 2026-07-30** (docs/ADR-008: paquetes npm @acc/*, instalabilidad verificada por smoke; pipeline de publicación pendiente), selección de adapter en
generación (A3), propagación de denormalización (B2), scoping en Criteria (B4), constante compartida
de campos (C1), uniformización de los 4 módulos de oro (C2), anotar ADR-001 (A1).

✅ Las 5 decisiones del resource-schema fueron **ratificadas el 2026-07-30** (ver skill `schema-authoring`) —
el starter original las tenía cerradas pero no llegó a este repo.
