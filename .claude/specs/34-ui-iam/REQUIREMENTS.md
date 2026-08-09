# Spec 34: UI de IAM (usuarios, invitaciones y sesión en el shell)

> Rescate nº 2 del backlog post-auditoría (2026-07-31). Cierra el hueco funcional del plugin
> `auth=single-tenant`: el backend emite el IAM completo (búsqueda de usuarios, invitación,
> cambio de rol, desactivación/reactivación, logout) y el frontend emite `user.service.ts` y
> `auth.service.ts`… pero **ningún componente los consume**. Una app generada con auth no
> permite invitar usuarios desde la UI ni cerrar sesión.

---

## Contexto de negocio

Una app generada con `auth=single-tenant` la estrena un administrador (sembrado por `seed:auth`).
Ese admin necesita: invitar al resto de usuarios (con su rol), cambiar roles, desactivar a quien
se va y reactivar a quien vuelve. Cualquier usuario autenticado necesita ver quién es y cerrar
sesión. Todo eso ya existe en el backend emitido; esta spec emite la UI que lo consume,
siguiendo el canon de `docs/referencia` pero construida sobre los **contratos UI neutrales**
(ADR-003 nivel 1: `AppButton`, `AppDialog`, `AppSelect`, `AppFormField`, `AppInput`,
`ConfirmDialog`, `NotificationService`, `DataTable`) para que sirva a las dos pieles sin variante.

## User stories (formato EARS)

- WHEN un admin navega a `/users` THEN ve el listado paginado de usuarios (email, nombre, rol,
  estado como badges) servido por `GET /api/v1/users`
- WHEN un admin escribe en el buscador THEN la lista filtra por email (`contains`), y los selects
  de rol y estado filtran por igualdad, reseteando a página 1
- WHEN un admin pulsa «Invitar usuario» y envía email + nombre + rol THEN se llama a
  `POST /api/v1/auth/invitations`, la lista se recarga y se notifica el resultado por toast
- WHEN un admin cambia el rol de un usuario THEN se pide confirmación antes de llamar a
  `PUT /api/v1/users/:id/role`
- WHEN un admin desactiva un usuario THEN la confirmación avisa de que se cerrarán sus sesiones
  (`POST /api/v1/users/:id/disable`); WHEN reactiva THEN `POST /api/v1/users/:id/reactivate`
- IF el usuario autenticado no es admin THEN no ve la entrada «Usuarios» en la navegación
  (el backend ya responde 403; ocultar evita ofrecer acciones imposibles)
- WHEN cualquier usuario autenticado mira el pie de la barra lateral THEN ve su nombre, email y
  rol, y un botón «Cerrar sesión» que llama a `POST /api/v1/auth/logout` y navega a `/login`
- IF la app se genera SIN el plugin de auth THEN nada de esto se emite: ni ruta, ni nav, ni
  bloque de sesión en el shell (el diff de una app sin auth queda intacto)
- WHILE la lista carga THEN se muestran los estados loading/empty/error del patrón de listados

## Criterios de aceptación

- [ ] App generada con auth: `/users` funciona end-to-end (listar, buscar, filtrar, invitar,
      cambiar rol, desactivar, reactivar) en navegador contra el backend real
- [ ] Logout visible y funcional para cualquier usuario autenticado
- [ ] Entrada «Usuarios» solo visible para admin
- [ ] App generada sin auth: cero ficheros ni referencias de IAM UI (test del generador)
- [ ] Las dos pieles compilan: los componentes solo importan contratos UI neutrales
- [ ] Gate de oro: diff vacío tras re-baseline deliberado; `typecheck:emitted` a 0 errores

## Referencias

- Canon: `docs/referencia/libs/frontend/src/domains/admin/bounded-contexts/iam/`
  (`users-list.component.*`, `invite-user-dialog.component.ts`, `iam-labels.ts`) y
  `layout/sidebar/nav-user.ts` (menú de sesión)
- Emitido hoy: `frontend-kernel/files/core/services/{user,auth}.service.ts.template`,
  plugin `app/plugins/auth.plugin.ts` (+ `assets-auth/`)

## Reglas de negocio aplicables

- Roles asignables: admin / user / viewer; etiquetas en español, valores de dominio en inglés
- Acciones de escritura ocultas si `!canWrite()`; gestión de usuarios solo admin
- Regla 8: plantillas tontas; el cableado (rutas, shell) vive en `auth.plugin.ts`

## Fuera de scope (deliberado)

- Shell admin completo de la referencia (sidebar colapsable, avatar, dropdown, fullscreen):
  es el rescate nº 1 y exige 8 componentes helm no vendorizados. Aquí el bloque de sesión es
  un pie de sidebar sencillo con los contratos existentes.
- Página «Cuenta» (perfil propio, cambio de contraseña propio): no existe endpoint dedicado.
- Multi-tenant (spec D): sin cambios en la ranura.
- Filtros por columna del DataTable para rol/estado: se usan selects sobre la tabla, como el canon.
