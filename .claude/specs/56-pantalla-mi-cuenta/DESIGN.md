# Diseño técnico: pantalla "Mi cuenta"

Rescate pequeño y acotado; tres piezas, cada una donde le toca:

1. **Contrato**: `change-password.dto.ts.template` en `shared-domain/files/auth/` (+ export en el
   barrel). Se emite SIEMPRE, como el resto de DTOs de auth — mueve las dos fixtures, diff de
   dos líneas + un fichero.
2. **Servicio**: `changePassword(dto)` en `frontend-kernel/files/core/services/auth.service.ts.template`,
   calcado de `resetPassword` (POST a `${API_PREFIX}/auth/change-password`). En el kernel y no
   parcheado por el plugin: el service ya lleva todos los métodos de auth aunque la app no
   tenga auth (mismo criterio existente).
3. **Pantalla**: `profile.component.ts.template` en `assets-auth/libs/frontend/src/domains/iam/`,
   adaptando la referencia al idioma del emitido — `AppFormField`/`AppInput`/`AppButton` de
   `shared/components/ui` (ADR-003, lo vigila `lint:ui-boundaries`), rol como texto vía
   `USER_ROLE_LABELS` (no hay contrato de badge y no se abre por un solo caso). Errores: 401 ⇒
   "contraseña actual incorrecta"; resto ⇒ genérico. Test portado como asset
   (`profile.component.spec.ts.template`). Ruta `/account` (authGuard implícito del shell) y
   enlace en el session-footer: el bloque nombre+email pasa a ser un enlace a `/account`.

Riesgos: el re-baseline toca app y app-mongo (kernel/shared) — commit del contrato+service
separado del componente para que cada diff sea legible.
