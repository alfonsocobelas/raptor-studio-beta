# Diseño técnico: UI de IAM

> Todo es capa generador: plantillas nuevas en `assets-auth` + cirugía en `auth.plugin.ts`.
> No hay backend nuevo: los endpoints existen desde la spec 05.

---

## Piezas emitidas (solo con el plugin auth activo)

```
assets-auth/libs/frontend/src/domains/iam/
  iam-labels.ts.template            etiquetas/variants de rol y estado (es)
  invite-user-dialog.component.ts.template
  users-list.component.ts.template
assets-auth/libs/frontend/src/domains/auth/
  session-footer.component.ts.template   pie de sidebar: quién soy + Usuarios (admin) + logout
```

Los componentes importan SOLO contratos neutrales: `DataTable`, `AppDialog`, `AppSelect`,
`AppFormField`, `AppInput`, `AppButton`, `ConfirmDialog`, `NotificationService` — misma API
en `files-ui/spartan` y `files-ui/material`, así que no hay variante por piel.

## users-list.component

Sigue el patrón de los listados emitidos (linkedSignal para retener la última página,
estados loading/empty/error, acciones condicionadas):

```
┌ Usuarios ──────────────────────────────────────────────┐
│ [select rol ▾] [select estado ▾]        [Invitar usuario]
│ DataTable: email · nombre · rol (badge) · estado (badge)
│   acciones fila: cambiar rol · desactivar/reactivar
└─────────────────────────────────────────────────────────┘
```

- `UserService.request` ya modela `{ page, pageSize, role?, status?, text? }`; el buscador del
  DataTable alimenta `text`, los dos selects alimentan `role`/`status` (página a 1).
- Cambio de rol: `ConfirmDialog` + `AppSelect` del rol destino (dialog propio pequeño, como el
  canon pero con contratos). Desactivar/reactivar: `ConfirmDialog` con el aviso de sesiones.
- Acción de fila única «toggle» cuyo efecto depende de `row.status` (disabled → reactivate).

## session-footer.component

- `AuthService` ya expone el usuario de sesión; se añade `isAdmin` computed al template del
  kernel (inofensivo sin auth: el dev-auth es admin fijo).
- Contenido: nombre + email + badge de rol; enlace «Usuarios» si `isAdmin()`; botón
  «Cerrar sesión» → `auth.logout()` → `router.navigate(['/login'])`.

## Cableado (auth.plugin.ts, `wireFrontend`)

1. Ruta `/users` insertada en `app.routes.ts` (misma cirugía que las rutas de auth).
2. Shell: insertar `<app-session-footer />` en `app.component.ts` justo tras el toggle de tema
   (ancla estable: el `</button>` del toggle) + import del componente. Sin auth no se toca nada.

## Tests (TDD sobre la suite de generators)

- `auth-frontend-wiring.spec.ts` (ampliar): con auth → existen los 4 ficheros, la ruta `/users`
  y el `<app-session-footer />`; sin auth → no existe nada de IAM UI en el árbol.
- Nuevo `iam-ui.spec.ts` si el anterior crece demasiado: contenidos clave (solo contratos
  neutrales en imports, endpoints correctos, roles asignables).
- Gate: `/golden-diff` (re-baseline deliberado: la fixture `app` lleva auth) +
  `npm run typecheck:emitted` + verificación en navegador sobre una demo con auth.
