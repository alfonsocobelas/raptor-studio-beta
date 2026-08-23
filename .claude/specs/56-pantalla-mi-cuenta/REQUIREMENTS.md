# Spec: Pantalla "Mi cuenta" (rescate del frontend de IAM)

---

## Contexto de negocio

Auditoría 2026-08-23 (a raíz de la spec 55): el frontend del plugin de auth es una adaptación
recortada de la referencia, no una copia. El backend emite `POST /auth/change-password` (use
case, handler, DTO) pero **ninguna pantalla lo usa**: el usuario logueado no puede cambiar su
propia contraseña salvo por el flujo de forgot-password. La referencia sí tiene
`profile.component.ts` ("Mi cuenta": datos del usuario + cambio de contraseña con confirmación).
Este rescate cierra ese hueco. El shell admin completo (nav-user dropdown) queda FUERA: es el
rescate grande del backlog.

## User stories (formato EARS)

- **WHEN** el usuario autenticado navega a `/account` **THEN** ve sus datos (nombre, email, rol) y un formulario de cambio de contraseña (actual + nueva + confirmación)
- **IF** la nueva contraseña y su confirmación no coinciden **THEN** el formulario lo señala y no envía
- **IF** la contraseña actual es incorrecta (401) **THEN** se muestra "La contraseña actual no es correcta", sin cerrar la sesión de esta pestaña
- **WHEN** el cambio tiene éxito **THEN** se muestra confirmación y el formulario se limpia
- **WHEN** el usuario mira el pie de sesión **THEN** su nombre enlaza a `/account` (visible para todos los roles, no solo admin)
- **IF** la app se genera sin auth **THEN** nada de esto existe (ni ruta, ni componente, ni DTO extra en el service)

## Criterios de aceptación

- [x] `ChangePasswordDto` en `shared/domain` y `changePassword()` en el `AuthService` del kernel frontend (mismo patrón que `resetPassword`)
- [x] `ProfileComponent` en `assets-auth` con los contratos `App*` de `shared/components/ui` (ADR-003: sin imports de Spartan), su test portado, ruta `/account` tras `authGuard` y enlace en el session-footer
- [x] Golden re-baseline (tres re-baselines acotados: dto+service, pantalla, endpoint backend) deliberado y acotado (app y app-mongo se mueven por el DTO+service del kernel; app además por el componente)
- [x] `typecheck-emitted` a 0 errores y cambio de contraseña verificado en vivo (login → cambio → re-login con la nueva)

## Referencias

- `docs/referencia/libs/frontend/src/domains/admin/bounded-contexts/iam/profile.component.ts` (+ `.spec.ts`)
- `docs/referencia/libs/frontend/src/core/services/auth.service.ts:90` (changePassword)
- `docs/referencia/libs/shared/domain/src/auth/change-password.dto.ts`
- Generador: `libs/generators/src/generators/shared-domain/files/auth/`, `frontend-kernel/files/core/services/auth.service.ts.template`, `app/plugins/assets-auth/`

## Fuera de scope (deliberado)

- Shell admin completo con nav-user dropdown (backlog de rescates)
- Edición de nombre/email propios (la referencia tampoco la tiene)
