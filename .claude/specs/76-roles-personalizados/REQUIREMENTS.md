# Spec 76: Roles personalizados

## Contexto de negocio

Hoy el acelerador trabaja con tres roles fijos: `admin` (implícito, todo), `user` y `viewer`.
La unión está cerrada en el contrato (`AccessRole`), en el enum de identidad emitido
(`UserRoleEnum`), en el CHECK SQL de la migración IAM, en las etiquetas del frontend y en
la pestaña Accesos del estudio. La spec 49 dejó «+ Nuevo rol» explícitamente en el backlog.

Un cliente real rara vez encaja en admin/user/viewer: quiere «perito», «tramitador»,
«contable». Esta spec permite **declarar roles adicionales a nivel de diseño** (app), que
participan en la matriz de accesos igual que user/viewer y se emiten en la app generada
(enum, VO, migración, seed, etiquetas, guards). Los tres roles por defecto no se tocan:
todo diseño existente conserva su significado.

Es el primer paso ejecutable del ADR-006 (roles como configuración por app), sin saltar
todavía al modelo completo de permisos `recurso:acción`.

## User stories (formato EARS)

- WHEN el diseñador pulsa «+ Nuevo rol» en la pestaña Accesos y escribe nombre y etiqueta,
  THEN el rol aparece como actor en la matriz (tarjeta + fila/columna según pivot) y se
  persiste en el JSON del diseño.
- WHEN un diseño declara roles personalizados, THEN la matriz de accesos de cada recurso
  admite otorgarles view/create/edit/delete y verbos de transición, igual que a user/viewer.
- IF un rol personalizado no recibe ninguna capacidad en un recurso, THEN no ve ese recurso
  (opt-in puro: un rol nuevo nace sin ningún permiso).
- WHEN se genera la app, THEN `UserRoleEnum`, el VO `UserRole`, el CHECK de la migración,
  las etiquetas/badges del frontend, el seed local y los `@Roles(...)` de los controllers
  incluyen los roles personalizados declarados.
- WHEN se genera la app con roles personalizados, THEN el seed local crea un usuario de
  prueba por rol (`<rol>@app.local`) para poder verificar los accesos a mano.
- IF un recurso otorga una capacidad a un rol que el diseño no declara, THEN la validación
  del schema lo rechaza con un mensaje que lista los roles válidos.
- IF un diseño no declara roles personalizados, THEN el código emitido es **byte a byte
  idéntico** al actual (gate de oro con diff vacío).
- WHILE el usuario de la app emitida tiene un rol personalizado, THEN la navegación solo
  muestra los recursos donde su rol tiene `view`, y los endpoints sin su rol devuelven 403.

## Criterios de aceptación

- [ ] El estudio permite crear (y borrar) roles personalizados desde la pestaña Accesos;
      se persisten en `.studio/designs/*.json` (clave raíz `roles`).
- [ ] Nombre de rol validado: kebab/minúsculas, no colisiona con admin/user/viewer, con
      tope de longitud y de cantidad razonables.
- [ ] La matriz de accesos (ambos pivotes) muestra y edita los roles personalizados.
- [ ] `defineResource` acepta roles personalizados en `access` cuando se le declaran, y
      rechaza los no declarados.
- [ ] `resolveAccess` no regala nada a los roles nuevos (defectos siguen siendo user/viewer).
- [ ] La app emitida compila y arranca con roles personalizados: enum, VO, auth-types,
      CHECK SQL, seed, labels, guards y navegación coherentes.
- [ ] Golden diff vacío para diseños sin roles personalizados.
- [ ] Suite verde (schema + generators + studio).

## Referencias del proyecto de referencia

- `libs/schema/src/lib/resource-types.ts:406` (`AccessRole`), `access.ts` (`resolveAccess`),
  `define-resource.ts:247-293` (`GRANTABLE_ROLES`, `validateAccess`).
- `libs/generators/src/generators/resource/build-entrypoints.ts:290` (`rolesArgs`).
- Plantillas IAM: `shared-domain/files/auth/auth-enums.ts.template`,
  `app/plugins/assets-auth/**` (user-role.vo, auth-types, local-seed, iam-labels,
  users-list), `app/plugins/auth.plugin.ts:443-451` (CHECK SQL).
- Estudio: `apps/studio/libs/shared/domain/src/studio/access-table.ts`,
  `draft-resource.ts`, `apps/studio/libs/frontend/src/domains/studio/design/access-*`.
- `docs/ADR-006-modelo-autorizacion.md` y spec 49 (`49-accesos-lavado-de-cara/`).

## Reglas de negocio aplicables

- `admin` sigue siendo implícito: puede todo, no se declara en la matriz, se inyecta
  siempre primero en `@Roles(...)`. Esta spec NO lo convierte en rol configurable.
- `user` y `viewer` siguen existiendo siempre y conservan sus defectos (spec 46/49).
- Los roles son **configuración de generación**: cambiar roles = regenerar la app.
- Guard plano sin jerarquías: un rol personalizado solo tiene lo que la matriz le otorga.
- La regla «no te quedes sin admins» del repo de usuarios no cambia.

## Fuera de scope (deliberado)

- Permisos `recurso:acción` con roles como agrupación (ADR-006 completo).
- Jerarquías o herencia entre roles.
- CRUD de roles en runtime en la app emitida (la pantalla IAM solo asigna roles existentes).
- Renombrar/borrar un rol con usuarios ya persistidos (migración de datos): la vía es
  regenerar y re-seedear en local; en producción sería una migración manual.
- Etiquetas i18n por rol más allá de una `label` única.
