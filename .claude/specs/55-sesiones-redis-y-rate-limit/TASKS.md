# Tareas atómicas: ranura `sessionStore` + rate limiting por IP

> Cada tarea = un commit atómico en develop. Implementar UNA, commitear, informar, siguiente.
> Gate permanente: golden en verde antes de cada commit. Solo TASK-03 re-baselinea, y de
> forma deliberada (el diff debe ser exactamente el rate limiting, nada más).
> TDD: test fallido primero en cada tarea con lógica de generador; el código emitido lleva
> sus tests portados de la referencia como assets.

---

## Preparar el terreno (golden intacto)

- [ ] **TASK-01**: Refactorizar `assets-auth`: mover la persistencia de sesión TypeORM
      (entidad, repo, mapper) a `assets-auth-session-typeorm/` y que `auth.plugin` copie
      ambas raíces con `generateFiles`. Sin cambio de comportamiento: **golden vacío** es el
      test de esta tarea (más el spec existente de auth en verde). Este commit aísla la
      refactorización para que el re-baseline de TASK-03 no pueda colar nada.

- [ ] **TASK-02**: Tests + ranura `sessionStore` en `slots.ts` (postgres default | redis con
      `requires: { auth: 'single-tenant' }`, aún sin `plugin`), opción en `schema.json`
      (x-prompt tipo list), paridad con `tools/slots.json`, y campo
      `PluginContext.sessionStore` resuelto en `app.ts` (default `postgres`). Tests:
      `--sessionStore=redis --auth=none` falla con el mensaje de ranuras;
      `--sessionStore=redis` sin `--auth` también (el default no cuenta como elección);
      default = no-op (golden vacío).

## Rate limiting (siempre con auth) — el re-baseline

- [ ] **TASK-03**: Tests + rate limiting en `assets-auth`:
      `shared/infrastructure/rate-limit/` (`rate-limit.module.ts` con ThrottlerModule +
      `APP_GUARD`, `client-ip.ts` con conteo desde la derecha y `trustedProxyHops`,
      `rate-limit.constants.ts` con global 200/60 s y login 10/60 s, forgot 5/1 h, redención
      20/1 h), sección `rateLimit` en config-types/validation/environments (test.json con
      límites altísimos, default `trustedProxyHops: 0`), `@Throttle` en el auth controller,
      `@SkipThrottle` en health, `RateLimitModule` en root ANTES de `AuthModule` (ancla entre
      `HealthModule` y `AuthModule`; cubrir la forma prettificada en una línea — trampa de la
      spec 51), dependencia `@nestjs/throttler`, y el test emitido de `client-ip` portado
      como asset. Storage: memoria (el default). **Re-baseline deliberado del golden**:
      revisar el diff completo y confirmar que solo contiene rate limiting.

## Sesiones en Redis

- [ ] **TASK-04**: Tests + `assets-auth-session-redis/` (`RedisSessionRepository` con
      `sess:{hash}` TTL + índice `user:{id}:sess` en MULTI, `session-store-errors.ts` con
      `SessionStoreUnavailableError` → 503) y bifurcación en `auth.plugin` por
      `context.sessionStore`: copia la carpeta de store que toque, binding de `auth.module`
      por sustitución (`sessionRepositoryClass`/`sessionRepositoryImport`), migración
      `CreateIamAuth` sin la tabla `session` (bloque concatenado condicionalmente en la
      función), `TypeOrmSessionEntity` fuera de `shared-persistence.module`. Spec de
      generador `session-store.spec.ts` (patrón `auth-slot.spec.ts`) + test emitido del
      repositorio portado como asset. Con redis el golden NO se toca (la fixture es
      postgres): lo afirma el spec.

- [ ] **TASK-05**: Tests + `redisSession.plugin` (manifiesto de la ranura, cableado en
      `slots.ts`): `shared/infrastructure/persistence/redis/` (`redis.module.ts` con
      `REDIS_CLIENT` único y `quit()` en `onApplicationShutdown`, no `@Global`;
      `redis-client-options.ts`; `redis.constants.ts`), sección `redis` en
      config-types/validation/environments (prod con referencias `vault.redis.*`),
      `redis-health.indicator.ts` (PING timeout 3 s → readiness 503) cableado en el health
      module, dependencia `ioredis`. Tests emitidos de la referencia portados
      (redis-module, unavailable).

- [ ] **TASK-06**: Tests + infra local y cloud del store redis: servicio `redis`
      (`redis:7-alpine`, 6379) en `docker-compose.local.yml` y `redis-test` (6380) en el de
      test (parche con ancla en el servicio postgres del skeleton), y con `infra=azure`
      además `iac/managed-redis.tf` (Azure Managed Redis, eviction `NoEviction`) + secretos
      `redis-host`/`redis-password` en Key Vault; con `aws`/`raptor`, nota "Redis pendiente
      de IaC" en el README de `iac/`. Specs de generador sobre el YAML y el tf resultantes.

- [ ] **TASK-07**: Tests + storage Redis del throttler cuando `sessionStore=redis`:
      `fail-open-throttler-storage.ts` (Redis caído ⇒ deja pasar + WARN) envolviendo
      `ThrottlerStorageRedisService` sobre el `REDIS_CLIENT` compartido (dependencia
      `@nest-lab/throttler-storage-redis` vía `redisSession.plugin`), sustitución del
      provider de storage calculada en el plugin. Además: `metrics.plugin` añade
      `@SkipThrottle({ global: true })` a su controller si `rate-limit.module.ts` existe en
      el árbol (test de composición auth+metrics, y de que `assets-metrics` sin auth no
      nombra throttler). Tests emitidos de fail-open portados.

## Verificación

- [ ] **TASK-08**: Verificación fuera del árbol, en ambas variantes:
      `tools/typecheck-emitted.sh` con `--sessionStore=redis` (y la variante default) a 0
      errores; app demo con redis: `make local-setup`, login y `KEYS sess:*` muestra la
      sesión, Redis parado ⇒ `GET /auth/me` 503 (ni 401 ni 500), 11 POST a login en <60 s ⇒
      el 11º 429 (también en la variante postgres/memoria); suite emitida en verde en ambas.
      Golden final en verde sin re-baseline. Cierre de spec.

---

## Regla del juego

Implementar **UNA** tarea, commit, esperar aprobación antes de seguir.
Si una tarea parece > 1h o > ~150 líneas, partirla en subtareas antes de empezar.
