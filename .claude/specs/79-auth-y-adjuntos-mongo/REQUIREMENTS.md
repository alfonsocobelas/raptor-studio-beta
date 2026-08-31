# Spec 79: auth/IAM y adjuntos sobre Mongoose

> Origen: petición de Alfonso 2026-08-31 tras cerrar la spec 76 («entonces tienes que añadir
> un IAM con mongo y lo mismo para adjuntos»). Levanta las dos degradaciones grandes que la
> 76 dejó declaradas. Auditoría previa hecha (2026-08-31); resumen abajo.

## Contexto de negocio

Una app generada con `database=mongo` sale hoy sin autenticación (y con ella caen IAM, «mi
cuenta» y rate limit) y rechaza los modelos con adjuntos. Eso convierte a Mongo en un motor
de segunda: vale para demos pero no para un cliente real. Esta spec da paridad: elegir Mongo
en «Antes de generar» produce una app con login, gestión de usuarios y adjuntos, igual que
Postgres.

**Hallazgos de la auditoría que acotan el trabajo:**

- **Auth está BIEN puesto en capas**: dominio (User/Session/AuthToken + 9 VOs), 12 use cases,
  guards, seed y todo el frontend hablan con 3 ports de repositorio ya existentes
  (`UserRepository`, `SessionRepository`, `AuthTokenRepository`). Lo TypeORM-bound son
  **9 ficheros de persistencia** (entity+mapper+repo × user/auth-token/session) más el
  cableado del plugin: `registerEntities()` (ruta typeorm fija), `addSchemaMigration()`
  (SQL a mano), `registerTestRepositories()` (clase fija), el import del seed y el
  `requires: { database: 'postgres' }` de la ranura.
- **Adjuntos NO tienen port**: `AttachmentsService` inyecta `Repository<Entity>` directo.
  Portar sin extraer antes un `<X>AttachmentRepository` duplicaría el service entero por
  motor (mayor riesgo de deriva). El blob ya es agnóstico (`FileStoragePort`).
- **El manifiesto de motor no tiene ranura para auth ni adjuntos**: hay que dársela
  (mismo patrón que `resourceFiles`/`auditFiles`), y `PluginContext` no conoce el motor.
- **El rate limit no está atado a la BD** (memoria del proceso o Redis): se porta gratis,
  pero su módulo vive físicamente en `assets-auth-session-typeorm/` y hay que reubicarlo.
- Los assets se copian **sin EJS** (`copyVerbatim`): la variación por motor va por carpetas
  hermanas (precedente: `assets-auth-session-typeorm` vs `-redis`), no por condicionales.

## User stories (formato EARS)

- WHEN genero una app con `--database=mongo` (sin tocar la ranura auth) THEN sale con
  auth single-tenant de fábrica, como Postgres: login, invitación, reset de contraseña,
  IAM UI, «mi cuenta», rate limit y seed de admin — con persistencia Mongoose.
- WHEN la app mongo arranca THEN los índices únicos de IAM (email, tokenHash de session y
  auth_token) existen ANTES de aceptar tráfico y ANTES de sembrar (`seed:auth` sincroniza
  índices en su contexto standalone; sembrar sin unicidad de email es corrupción latente).
- WHEN un modelo declara `attachments: true` con `database=mongo` THEN el generador emite la
  pieza completa (schema de metadatos + repositorio Mongoose + controller + front) en vez de
  fallar, y la compensación del upload (borrar el blob si fallan los metadatos) se conserva.
- WHEN registro un usuario o un adjunto duplicado THEN el error de duplicado se detecta igual
  que en Postgres (`register` = create con detección de duplicado; `save` = update), no un
  upsert silencioso.
- IF el usuario combina `sessionStore=redis` con `database=mongo` THEN la combinación es
  válida y funciona (hoy es un camino que nadie ha probado: redis exigía auth y auth exigía
  postgres).
- WHEN termina la spec THEN la tarjeta MongoDB del estudio deja de listar carencias, la
  ranura auth deja de deshabilitarse al elegir mongo, y `golden-mongo` puede volver a llevar
  un modelo con adjuntos.
- WHILE se porta THEN el comportamiento Postgres no se mueve: su golden queda vacío salvo
  los ficheros que la extracción del port de adjuntos toque (re-baseline justificado).

## Criterios de aceptación

- [ ] Ranuras nuevas en `PersistenceProvider` (patrón `resourceFiles`): persistencia de auth
      y de adjuntos por motor; `PluginContext` conoce el motor. Se retira
      `requires: { database: 'postgres' }` de la ranura auth y el `slotFallbacks` de mongo.
- [ ] Los 9 adapters Mongoose de auth (user/auth-token/session: schema+mapper+repo) +
      registro de modelos IAM en el `shared-persistence.module` mongo + re-binding del
      módulo + seed con `persistenceDir` variable + test-repositories por manifiesto.
- [ ] Port `AttachmentRepository` extraído (el service queda agnóstico; Postgres re-gateado)
      + adapter Mongoose de adjuntos + rama mongo en `files-module` + registro del modelo.
- [ ] `seed:auth` en mongo sincroniza índices antes de insertar (riesgo del contexto
      standalone: `onApplicationBootstrap` no corre solo).
- [ ] Tests del generador reescritos: `auth-slot.spec` (mongo YA emite auth),
      `attachments-engine.spec` (mongo ya no rechaza), y los que usaban mongo como sinónimo
      de «app sin auth» (`rate-limit`, `iam-ui`, `my-account`) pasan a otro arreglo.
- [ ] Re-baseline deliberado de `app-mongo` (entra `contexts/iam/**` completo, ~60+ ficheros)
      y de `golden-mongo.app.ts` si recupera un modelo con adjuntos.
- [ ] Demo real: app mongo generada desde el camino del estudio con login funcionando por
      HTTP (login → cookie/token → endpoint protegido → 401 sin sesión), IAM UI, seed de
      admin, y un adjunto subido/descargado/borrado contra el replSet + storage local.
- [ ] Suite emitida completa verde (unit + integración + typecheck + web:build) en la demo.
- [ ] Estudio: tarjeta MongoDB sin carencias, ranura auth habilitada con mongo,
      `sessionStore` combinable; `npm run slots` regenerado y smoke de slots ajustado.

## Referencias del proyecto de referencia

- Auditoría completa: (informe 2026-08-31, en el hilo de la spec 76 → esta)
- Ports de auth: `assets-auth/.../modules/auth/domain/{user,session,auth-token}-repository.ts`
- Precedente de variante por carpeta: `assets-auth-session-typeorm/` vs `-redis/`
- Base Mongoose a extender: `kernel/files-mongo/.../mongoose.repository.ts.template`,
  `mongoose-criteria-converter`, `MongooseIndexSync`
- Semántica de sesiones con TTL ya resuelta: `assets-auth-session-redis/.../redis-session.repository.ts.template`

## Reglas de negocio aplicables

- Las demos detectan, no se parchean; gate de oro antes de cada commit de plantillas.
- Sin índice TTL de Mongo para sesiones en esta spec: la caducidad la decide el dominio
  (`ResolveSessionUseCase`), igual que en Postgres — un TTL con sliding idle borraría en un
  momento distinto al del dominio. Paridad primero; limpieza física, si se quiere, en otra spec.
- `contains` del listado de usuarios: el `MongooseCriteriaConverter` debe dar el mismo
  case-insensitive que ya da el camino Postgres del IAM UI.
- Los adjuntos huérfanos al borrar el padre son responsabilidad de la aplicación (no hay FK):
  mismo criterio que el arrastre del borrado suave.

## Fuera de scope (deliberado)

- **Código de negocio (`code`) con mongo**: Mongo no tiene secuencias; sigue el error explícito.
- **IaC para Mongo** (Atlas/Cosmos/self-hosted): los proveedores de infra siguen emitiendo
  Postgres; se anota como idea de backlog aparte.
- **Limpieza física de sesiones caducadas** (TTL index / barrendero): paridad con Postgres
  (tampoco la tiene).
- **Multi-tenant**: sin cambios.
- **Transacciones en los use cases de auth**: hoy no las hay en Postgres; no se añaden aquí.
