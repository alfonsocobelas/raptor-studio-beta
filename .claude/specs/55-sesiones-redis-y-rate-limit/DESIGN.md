# Diseño técnico: ranura `sessionStore` + rate limiting por IP

## Mapa

```
                 elección del usuario
                        │
        ┌───────────────┴────────────────┐
        │ sessionStore=postgres (default)│ sessionStore=redis
        ▼                                ▼
  auth.plugin emite                auth.plugin emite
  persistence/typeorm/             persistence/redis/
  (entidad+repo+mapper sesión,     (RedisSessionRepository,
   tabla iam.session en la          session-store-errors 503)
   migración)                      + redisSession.plugin emite
                                     RedisModule compartido,
                                     health PING, compose redis,
                                     RedisConfig, terraform azure
        │                                │
        └───────────────┬────────────────┘
                        ▼
          rate limiting (SIEMPRE con auth)
          shared/infrastructure/rate-limit/
          storage: memoria ──o── Redis + fail-open
```

Todo el código emitido nuevo ya existe escrito y probado en `docs/referencia/` (specs 55 y 56 de la referencia); esta spec es portarlo al generador con la condicionalidad en el sitio correcto.

## La ranura `sessionStore`

Nueva entrada en `SLOTS` (`libs/generators/src/generators/app/plugins/slots.ts`), tras `auth`:

```ts
sessionStore: {
  name: 'sessionStore',
  label: 'Almacén de sesiones',
  default: 'postgres',
  providers: [
    { value: 'postgres', label: 'PostgreSQL (tabla iam.session)' },
    {
      value: 'redis',
      label: 'Redis (multi-réplica, TTL nativo)',
      requires: { auth: 'single-tenant' },   // redis sin auth no tiene sentido
      plugin: redisSessionPlugin
    }
  ]
}
```

- `validateCombination` ya resuelve el `requires`: `--sessionStore=redis --auth=none` falla con el mensaje estándar de ranuras antes de emitir un fichero. No hay que escribir validación nueva.
- Con `auth=none`, `sessionStore=postgres` (el default) es un no-op silencioso: no emite nada, igual que hoy. No se prohíbe porque Nx rellena los defaults del schema.json antes de llamar al generador — prohibirlo rompería toda app sin auth.
- `schema.json` gana la opción con `x-prompt` tipo list, misma forma que `infra`.

## Quién decide qué (el reparto de la condicionalidad)

Dos piezas, cada una dueña de lo suyo:

**1. `auth.plugin.ts` conoce el store** — las sesiones son suyas. `PluginContext` gana un campo `sessionStore: 'postgres' | 'redis'` (resuelto por el generador, default `postgres`; los plugins que no lo miran no cambian). Con eso el plugin:

- `postgres`: emite `infrastructure/persistence/typeorm/` de sesión y la tabla `iam.session` en la migración `CreateIamAuth`, como hoy. **Cero cambios en el emitido default.**
- `redis`: emite `infrastructure/persistence/redis/` (repo + errores) en su lugar, la migración `CreateIamAuth` se genera **sin** la tabla `session` (la plantilla de la migración es un string en `auth.plugin.ts`: el bloque de sesión se concatena condicionalmente en la función, no con `<% if %>` — plantillas tontas), la entidad `TypeOrmSessionEntity` no se registra en `shared-persistence.module`, y el binding de `auth.module` apunta a `RedisSessionRepository`.

Para no meter `if` en las plantillas, los assets de sesión se separan de `assets-auth`:

```
assets-auth/                  ← todo lo común (sin persistencia de sesión)
assets-auth-session-typeorm/  ← entidad + repo + mapper TypeORM (lo actual, movido)
assets-auth-session-redis/    ← RedisSessionRepository + session-store-errors.ts
```

y `auth.plugin.apply` copia la carpeta que toque (`generateFiles` con dos raíces). El `auth.module.ts.template` emite el binding vía sustitución calculada en el plugin (`sessionRepositoryClass`, `sessionRepositoryImport`).

**2. `redisSession.plugin.ts` (nuevo, manifiesto de la ranura)** — dueño de la infraestructura Redis transversal, calcado del reparto de la referencia:

- `shared/infrastructure/persistence/redis/`: `redis.module.ts` (provider `REDIS_CLIENT` único, `quit()` en `onApplicationShutdown`, no `@Global`), `redis-client-options.ts` (maxRetriesPerRequest 3, TLS opcional), `redis.constants.ts`.
- `shared/infrastructure/health/redis-health.indicator.ts`: `PING` con timeout 3 s, down ⇒ readiness 503. Se cablea en el health module emitido (parche tipo `registerModule`, mismo estilo que `AuthModule` en root).
- Sección `redis` en `config-types.ts` + `config-validation.ts` + `environments/{local,test,dev,qa,prod}.json` (en prod, referencias `vault.redis.host`/`vault.redis.password`) — patrón `addMetricsConfigSection` del plugin metrics.
- Compose: servicio `redis` (`redis:7-alpine`, 6379) en `docker-compose.local.yml` y `redis-test` (6380) en el test — parche sobre el YAML emitido por el skeleton, con ancla en el servicio de postgres.
- Terraform **solo si `infra=azure`**: escribe `iac/managed-redis.tf` (Azure Managed Redis, eviction `NoEviction`) + secretos `redis-host`/`redis-password` en Key Vault. Con `aws`/`raptor` no escribe IaC y deja una nota en el README de `iac/` ("Redis pendiente de IaC en este proveedor: apunta REDIS_HOST a tu instancia"), según el fuera-de-scope aprobado.
- `dependencies`: `ioredis` (misma versión que la referencia).

`PluginContext.sessionStore` en vez de pasar la selección entera: los plugins solo ven lo que necesitan; si un tercer plugin necesita otra ranura algún día, se añade entonces (regla de los dos).

## Rate limiting: siempre que hay auth

Va **dentro de `assets-auth`** (no es plugin aparte ni opción): toda app con `auth=single-tenant` lo emite. Razón: sus límites por endpoint protegen `login`/`forgot-password`/`accept-invitation`, que solo existen con auth; y sin auth no hay superficie pública que justifique el módulo.

Piezas (portadas de la referencia):

- `shared/infrastructure/rate-limit/rate-limit.module.ts` — `ThrottlerModule.forRootAsync` + `APP_GUARD` → `ThrottlerGuard`, `getTracker: req => clientIp(req)`.
- `client-ip.ts` — entrada N-ésima **desde la derecha** de `X-Forwarded-For` con `trustedProxyHops` de config (el extremo izquierdo es falsificable y nunca gana; clamp si la cadena es corta). En la referencia eran 3 hops medidos de su topología; aquí el default emitido es **0** (compose local sin proxy delante) y es un valor por entorno que el cliente ajusta a su topología real.
- `rate-limit.constants.ts` — global 200/60 s; `LOGIN 10/60 s`, `FORGOT_PASSWORD 5/1 h`, `TOKEN_REDEMPTION 20/1 h`. Constantes emitidas, editables a mano (generar, no interpretar).
- `@Throttle` en `auth.controller.ts.template` (login, forgot-password, reset-password, accept-invitation) y `@SkipThrottle({ global: true })` en el health controller. El de métricas (`GET /metrics`) también debe saltarse el global (el raspado de Alloy es tráfico interno cada pocos segundos y computaría contra el límite), pero el decorador no puede vivir en `assets-metrics`: sin auth no está `@nestjs/throttler` y el import rompería. Como las ranuras se aplican **antes** que los aditivos (`app.ts:136`, auth antes que metrics), es `metrics.plugin` quien parchea su propio controller si `rate-limit.module.ts` existe ya en el árbol.
- Config `rateLimit` (`globalLimit`, `globalTtlMs`, `trustedProxyHops`) por entorno; en `test.json` límites altísimos para que la suite e2e no se auto-limite.
- Orden en `root.module`: `RateLimitModule` **antes** de `AuthModule` (el throttler corta el flood antes de tocar la DB). El parche `registerModule` de auth ya ancla tras `HealthModule`; el rate-limit se inserta entre ambos.
- `dependencies`: `@nestjs/throttler`.

**El storage lo decide `sessionStore`** (sustitución calculada en `auth.plugin`, no `if` en plantilla):

- `postgres` → storage en memoria (el default de `@nestjs/throttler`). Correcto para una réplica, que es el caso canónico; sin dependencia nueva, sin fail-open que necesitar (la memoria no se cae sola).
- `redis` → `ThrottlerStorageRedisService` (`@nest-lab/throttler-storage-redis`) sobre el `REDIS_CLIENT` compartido, envuelto en `fail-open-throttler-storage.ts` (si Redis falla: deja pasar + WARN; fail-closed sería un DoS autoinfligido). La dependencia extra la aporta `redisSession.plugin`.

## Golden fixtures y tests

- **Fixture `app` actual** (postgres, con auth): se mueve **solo** por el rate limiting → re-baseline deliberado, revisando el diff completo antes de congelar. La refactorización `assets-auth` → tres carpetas debe dar diff **vacío** por sí sola (se hace en un commit separado, con golden verde, antes de tocar nada más).
- **Variante redis**: no una fixture completa nueva (duplicaría ~300 ficheros para tocar ~15). Un spec de generador (`session-store.spec.ts`, estilo `auth-slot.spec.ts`) genera en árbol con `--sessionStore=redis` y afirma sobre los ficheros que cambian: binding del módulo, ausencia de `typeorm-session.entity`, migración sin tabla `session`, presencia de `redis.module`, compose con el servicio, storage del throttler. Mismo patrón que ya usa el repo para mongo y para los presets.
- Tests del emitido: los tests de la referencia (`redis-session.repository`, `fail-open`, `client-ip`, `session-store-down.e2e`) se portan como assets a la carpeta de tests emitida, condicionados igual que su código.
- Verificación end-to-end manual (criterios del REQUIREMENTS): app demo con `sessionStore=redis`, login y `KEYS sess:*`; Redis parado ⇒ `GET /auth/me` 503; 11 logins ⇒ 429.

## Decisiones técnicas

| Decisión | Elegida | Razón |
| --- | --- | --- |
| Cómo se expone | Ranura `sessionStore`, no plugin aditivo | Es una decisión excluyente entre proveedores — exactamente lo que es una ranura (spec 23); `requires` resuelve gratis la combinación inválida con `auth=none` |
| Dónde vive la condicionalidad | `auth.plugin` (sesión) + `redisSession.plugin` (infra Redis) | Cada plugin dueño de lo suyo; cero `<% if %>` en plantillas (regla 8) |
| Cómo llega la elección al plugin | `PluginContext.sessionStore` | Los plugins ven solo lo que necesitan; pasar la selección entera es abrir abstracción sin segundo caso |
| Rate limiting | Siempre con auth, sin opción | Seguridad por defecto; sus límites protegen endpoints que solo existen con auth |
| Storage del throttler | Memoria (postgres) / Redis + fail-open (redis) | Una réplica no necesita storage compartido; fail-open solo tiene sentido cuando el storage puede caerse |
| `trustedProxyHops` | Config por entorno, default 0 | El 3 de la referencia era SU topología medida; emitir 3 a ciegas rompería la extracción de IP en cualquier otra |
| Redis caído | 503 `SessionStoreUnavailableError` | Ni 401 (evicta al usuario) ni 500 (miente sobre la causa) — igual que la referencia |
| IaC Redis | Solo azure (`managed-redis.tf`); aws/raptor → nota en README | Fuera de scope aprobado; mejor un hueco honesto que Terraform sin probar |
| Golden de la variante redis | Spec de generador sobre el árbol, no fixture completa | La variante toca ~15 ficheros; una fixture entera duplicaría el coste de mantenimiento de por vida |

## Riesgos identificados

| Riesgo | Prob. | Impacto | Mitigación |
| --- | --- | --- | --- |
| El re-baseline del rate limiting cuela un cambio no intencionado | media | alto | Commit previo de la refactorización de assets con golden **vacío**; el re-baseline solo contiene rate-limit |
| Parche del compose YAML frágil (anclas de texto) | media | medio | Ancla en el servicio postgres que emite el skeleton (congelado en fixture); spec de generador que afirma el YAML resultante |
| `@SkipThrottle` en metrics rompe apps sin auth (import de `@nestjs/throttler` sin dependencia) | media | alto | Lo parchea `metrics.plugin` sobre su propio controller solo si `rate-limit.module.ts` existe en el árbol (las ranuras se aplican antes que los aditivos, `app.ts:136`); `assets-metrics` no se toca |
| La suite e2e emitida se auto-limita | baja | medio | `test.json` con límites altísimos, como la referencia |
| Deriva futura entre `assets-auth-session-*` y el dominio común | baja | medio | El dominio (`Session`, puerto, VO) vive solo en `assets-auth`; las carpetas de store solo contienen adapters |

---

> ⚠️ **STOP** después de rellenar este fichero. No proceder a `TASKS.md` hasta aprobación explícita del usuario.
