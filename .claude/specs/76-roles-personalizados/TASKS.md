# Tareas atómicas: Roles personalizados (spec 76)

> Cada tarea = un commit. TDD: test fallido antes de producción.
> Orden: contrato → generador → estudio → validación.

## Contrato (libs/schema)

- [x] TASK-01: `RoleDefinition` + `AppDefinition.roles` + `ROLE_LIMITS` + validación en
      `defineApp` (patrón, colisiones, duplicados, tope, label). Tests primero.
- [x] TASK-02: `AccessRole = string` + `defineResource(def, { extraRoles })`:
      `validateAccess` acepta roles extra y el mensaje de error lista los válidos.
      Tests: rol extra aceptado, rol no declarado rechazado, comportamiento actual intacto.

## Generador (libs/generators)

- [x] TASK-03: `buildRoleSubstitutions()` (enum members, values, check, labels, variants,
      seed users) con tests puros; incluye `roleConstantName` para kebab-case.
- [x] TASK-04: Plantillas IAM a sustituciones (auth-enums, user-role.vo, auth-types,
      iam-labels, local-seed) + CHECK de `auth.plugin.ts`. Test: app con roles extra emite
      enum/VO/check/seed/labels correctos; sin roles extra, output idéntico (golden).
- [x] TASK-05: `rolesArgs` con `constantName` + `app.ts` pasa `extraRoles` a
      `defineResource` y a la nav. Test e2e de generador: recurso que otorga `view` a un
      rol personalizado emite `@Roles(UserRoleEnum.ADMIN, UserRoleEnum.PERITO, ...)`.

## Estudio

- [x] TASK-06: `access-table.ts` dinámico (`grantableRoles`, orden parametrizado). Tests
      puros. (La persistencia de `roles` en el diseño se movió a TASK-07: `Design` vive
      en `design-store.ts`.)
- [x] TASK-07: `design-store`: `addRole`/`removeRole` (borrar limpia matrices) + gate del
      chat y generate del studio-api pasan `extraRoles`. Tests.
- [x] TASK-08: UI Accesos: tarjetas dinámicas + «+ Nuevo rol» + borrado, tabla y pivotes
      dinámicos, `access-ui.service` a `string`. Tests de componente.

## Validación

- [x] TASK-09: Gate de oro (/golden-diff) — 6/6 vacío (2026-08-30).
- [x] TASK-10a: Suites completas: schema 260 ✅ · generators 1101 ✅ (las 5 rojas son de la
      spec 78 concurrente: optimistic-lock + migrations version, ajenas a roles) ·
      studio 1170 front + 328 back ✅ · `web:build` AOT ✅.
- [x] TASK-10b: Verificación en vivo (2026-08-30, app `roles-demo` local sin trackear):
      seed con 4 usuarios (CHECK acepta `perito`); login perito ✓; GET 200 · POST 403 ·
      PUT 204 (edit otorgado) · transición `cerrar` 403 (no otorgada) ✓; viewer PUT 403;
      user cierra con `{"version":N}` (el 400 sin version es el bloqueo optimista de la
      spec 78, no de roles); nav emitida con PERITO en la entrada de Expedientes.

---

## Regla del juego

Implementar UNA tarea, commit atómico en develop, seguir. Si una tarea supera ~150 líneas,
partirla antes de empezar.
