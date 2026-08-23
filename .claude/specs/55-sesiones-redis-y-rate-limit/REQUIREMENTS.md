# Spec: Sesiones en Redis opcionales + rate limiting por IP siempre activo

---

## Contexto de negocio

El proyecto de referencia (sap-licenses) migró las sesiones de PostgreSQL a Redis (spec 56 de la referencia) y añadió rate limiting por IP con `@nestjs/throttler` sobre Redis (spec 55 de la referencia). El generador de app emite hoy la versión pre-Redis: sesiones opacas en la tabla `iam.session` y **ningún** rate limiting HTTP (solo bloqueo de cuenta a nivel de dominio).

Decisión de diseño (brainstorm 2026-08-23, aprobada por Alfonso):

- **Convivencia con opt-in** (opción A): nueva opción `sessionStore: postgres (default) | redis` en el generador `app`. Postgres sigue siendo el caso canónico sin infra nueva; Redis es para el cliente que lo necesite (multi-réplica, no perder sesiones en despliegues). El dominio (`Session`, `SessionRepository`, VOs) es idéntico en ambos: el swap es una carpeta de persistencia alternativa + binding en `auth.module`. Es el segundo adapter real del puerto `SessionRepository` (regla de los dos).
- **Rate limiting desacoplado de la decisión de sesiones y siempre emitido** (seguridad por defecto): storage en memoria de `@nestjs/throttler` cuando no hay Redis (correcto para una réplica), storage Redis (`@nest-lab/throttler-storage-redis`) cuando `sessionStore: redis`.
- Redis **no sustituye a PostgreSQL**: usuarios y `auth_token` (invitaciones/resets) siguen en Postgres, como en la referencia.

## User stories (formato EARS)

- **WHEN** se genera una app con `sessionStore: postgres` (o sin indicar la opción) **THEN** el emitido es funcionalmente el actual: sesiones en `iam.session`, sin dependencia de Redis en compose, config ni Terraform
- **WHEN** se genera una app con `sessionStore: redis` **THEN** las sesiones se almacenan en Redis (`sess:{tokenHash}` con TTL + índice `user:{userId}:sess`) mediante un `RedisSessionRepository` que implementa el mismo puerto `SessionRepository`, y la migración/entidad TypeORM de `iam.session` no se emite
- **WHEN** se genera con `sessionStore: redis` **THEN** el compose local/test incluye el servicio Redis, la config tipada incluye `RedisConfig`, y el health check de readiness incluye el `PING` a Redis (down ⇒ 503, la réplica sale de rotación)
- **WHEN** se genera con `sessionStore: redis` e `infra: azure` **THEN** el Terraform incluye Azure Managed Redis + secretos `redis-host`/`redis-password` en Key Vault
- **IF** Redis está caído en runtime (con `sessionStore: redis`) **THEN** resolver sesión responde 503 `SessionStoreUnavailableError` (nunca 401 —evictaría al usuario— ni 500)
- **WHEN** se genera cualquier app con autenticación **THEN** el emitido incluye rate limiting por IP: global 200/min y límites por endpoint (login 10/60 s, forgot-password 5/1 h, redención de tokens 20/1 h), con health y endpoints técnicos excluidos (`@SkipThrottle`)
- **IF** el storage del throttler falla en runtime **THEN** el guard hace fail-open (deja pasar y loguea WARN): fail-closed sería un DoS autoinfligido
- **WHEN** la petición atraviesa proxies **THEN** la IP del cliente se extrae de `X-Forwarded-For` contando desde la derecha con `TRUSTED_PROXY_HOPS` configurable (el extremo izquierdo es falsificable y nunca gana)
- **IF** el entorno es `test` **THEN** los límites globales son lo bastante altos para que la suite e2e no se auto-limite
- **IF** `sessionStore: redis` se combina con `authentication: none` **THEN** el generador falla con error claro (la opción solo tiene sentido con auth)

## Criterios de aceptación

- [x] Golden diff vacío para la fixture actual (postgres por defecto) salvo el rate limiting nuevo, que se re-baselinea deliberadamente (`4cd567aa`: el diff era exactamente el rate limiting)
- [x] Variante `sessionStore: redis` verificada por specs de generador sobre el árbol (`session-store.spec.ts`, `redis-session.plugin.spec.ts`) — decisión de diseño: sin fixture completa duplicada
- [x] App generada con `sessionStore: redis` arranca con el compose emitido, login OK y las sesiones en Redis (`sess:{hash}` + índice `user:{id}:sess` + contador del throttler, verificado 2026-08-23)
- [x] Con Redis parado, `GET /auth/me` devuelve **503** `SessionStoreUnavailableError` (ni 401 ni 500) y el readiness pasa a 503
- [x] Rate limit verificado en vivo en ambas variantes: la 11ª petición a login en <60 s devuelve **429** (redis y memoria)
- [x] Suite emitida: variante postgres 100 % verde (140+8+67); variante redis verde en backend (389 unit + 33 integración, incluida la de Redis real) — los 3 rojos del front son el defecto pre-existente del soft delete (`/projects/deleted`, ver memoria `defectos-vivos-del-emitido`), ajeno a esta spec
- [x] `typecheck-emitted` a 0 errores en ambas variantes (4 modelos de oro, fuera del monorepo)

## Referencias (proyecto de referencia y diseño)

- Sesiones Redis: `docs/referencia/libs/backend/src/contexts/shared/infrastructure/persistence/redis/` (`redis.module.ts`, `redis-client-options.ts`, `redis.constants.ts`)
- Repositorio: `docs/referencia/libs/backend/src/contexts/iam/modules/auth/infrastructure/persistence/redis/` (`redis-session.repository.ts`, `session-store-errors.ts`)
- Rate limit: `docs/referencia/libs/backend/src/contexts/shared/infrastructure/rate-limit/` (`rate-limit.module.ts`, `fail-open-throttler-storage.ts`, `client-ip.ts`, `rate-limit.constants.ts`)
- Health: `docs/referencia/libs/backend/src/contexts/shared/infrastructure/health/redis-health.indicator.ts`
- Terraform Azure: `docs/referencia/iac/terraform/managed-redis.tf` (Azure Managed Redis, eviction `NoEviction`)
- Compose: `docs/referencia/docker/docker-compose.{local,test}.yml` (redis 7-alpine, puertos 6379/6380)
- Tests-especificación: `docs/referencia/libs/backend/tests/infrastructure/persistence/redis/`, `tests/shared/rate-limit/`, `tests/infrastructure/e2e/auth/session-store-down.e2e.test.ts`
- Adapter ya extraído en el catálogo (evaluar reutilización vs. plantilla): `libs/infra/session-redis/src/lib/redis-session-store.ts`
- Generador afectado: `libs/generators/src/generators/app/` (`schema.json`, `plugins/auth.plugin.ts`, `plugins/assets-auth/`, `infra/providers.ts`)

## Reglas de negocio aplicables

- Orden de módulos: `RateLimitModule` antes de `AuthModule` en `root.module` para cortar el flood antes de tocar la DB (referencia `root.module.ts:26`)
- Política de sesión de la referencia: idle 12 h, máximo absoluto 7 días, token 32 bytes; el TTL lo decide el dominio (`Session.slide`), Redis solo lo materializa
- Cliente Redis compartido único (`REDIS_CLIENT`), cierre con `quit()` en `onApplicationShutdown`, no `@Global`
- Plantillas tontas: toda la condicionalidad `sessionStore` vive en `auth.plugin.ts` / `generator.ts`, no en las EJS

## Fuera de scope (deliberado)

- Migración de sesiones vivas entre stores (la referencia cortó con relogin; aquí ni aplica: se elige al generar)
- Redis para cache, colas o cualquier uso distinto de sesiones + throttler storage
- Terraform de Redis para `infra: aws` (ElastiCache) y `infra: raptor` (contenedor Hetzner) — se etiquetan como pendiente y se abordan en spec propia si se necesitan; en esta spec solo Azure, como en la referencia
- Rate limiting configurable por el usuario en el studio: los límites son constantes emitidas, editables a mano (generar, no interpretar)
- Exponer `sessionStore` en el studio/canvas: primero la opción del generador por CLI; el cableado en la UI del studio se decide después

---

> ⚠️ **STOP** después de rellenar este fichero. No proceder a `DESIGN.md` hasta aprobación explícita del usuario.
