# Tareas atómicas: Roles personalizados (spec 76)

> Cada tarea = un commit. TDD: test fallido antes de producción.
> Orden: contrato → generador → estudio → validación.

## Contrato (libs/schema)

- [ ] TASK-01: `RoleDefinition` + `AppDefinition.roles` + `ROLE_LIMITS` + validación en
      `defineApp` (patrón, colisiones, duplicados, tope, label). Tests primero.
- [ ] TASK-02: `AccessRole = string` + `defineResource(def, { extraRoles })`:
      `validateAccess` acepta roles extra y el mensaje de error lista los válidos.
      Tests: rol extra aceptado, rol no declarado rechazado, comportamiento actual intacto.

## Generador (libs/generators)

- [ ] TASK-03: `buildRoleSubstitutions()` (enum members, values, check, labels, variants,
      seed users) con tests puros; incluye `roleConstantName` para kebab-case.
- [ ] TASK-04: Plantillas IAM a sustituciones (auth-enums, user-role.vo, auth-types,
      iam-labels, local-seed) + CHECK de `auth.plugin.ts`. Test: app con roles extra emite
      enum/VO/check/seed/labels correctos; sin roles extra, output idéntico (golden).
- [ ] TASK-05: `rolesArgs` con `constantName` + `app.ts` pasa `extraRoles` a
      `defineResource` y a la nav. Test e2e de generador: recurso que otorga `view` a un
      rol personalizado emite `@Roles(UserRoleEnum.ADMIN, UserRoleEnum.PERITO, ...)`.

## Estudio

- [ ] TASK-06: dominio compartido: `roles` en el draft (persistencia condicional) +
      `access-table.ts` dinámico (`rolesFor(design)`, summary, helpers). Tests puros.
- [ ] TASK-07: `design-store`: `addRole`/`removeRole` (borrar limpia matrices) + gate del
      chat y generate del studio-api pasan `extraRoles`. Tests.
- [ ] TASK-08: UI Accesos: tarjetas dinámicas + «+ Nuevo rol» + borrado, tabla y pivotes
      dinámicos, `access-ui.service` a `string`. Tests de componente.

## Validación

- [ ] TASK-09: Gate de oro (/golden-diff) — diff vacío sin roles extra.
- [ ] TASK-10: Suite completa (schema + generators + studio) + `npm run web:build` +
      generar app de prueba con un rol `perito` y verificar arranque + 403/nav a mano.

---

## Regla del juego

Implementar UNA tarea, commit atómico en develop, seguir. Si una tarea supera ~150 líneas,
partirla antes de empezar.
