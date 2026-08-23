# Tareas atómicas: pantalla "Mi cuenta"

> Cada tarea = un commit atómico en develop.

- [x] **TASK-01** (`33f9e922`): Tests + `ChangePasswordDto` en shared-domain (+ barrel) y
      `AuthService.changePassword` en el kernel frontend. Re-baseline deliberado de app y
      app-mongo (solo estas dos piezas).
- [x] **TASK-02** (`5272a26f`): Tests + `ProfileComponent` ("Mi cuenta") en `assets-auth` con contratos
      `App*`, su spec portado como asset, ruta `/account` en `wireFrontend` y enlace en el
      session-footer. Re-baseline deliberado de la fixture app.
- [x] **TASK-03** (`5cbe7f60` + verificación en vivo 2026-08-23): Verificación: `typecheck-emitted` a 0 en la app de oro; demo en vivo —
      login, cambiar contraseña en `/account`, logout, re-login con la nueva; 401 con la
      actual incorrecta mostrado en el formulario. Cierre.

> Hallazgo de la TASK-03 (las demos detectan): el backend NUNCA emitió POST /auth/change-password
> — solo existía en la referencia. Portado en `5cbe7f60` (use case con lockout, borra todas las
> sesiones y emite cookie nueva). Verificado: wrong-current 401, change 204, cookie nueva 200,
> re-login con la vieja 401 y con la nueva 200; vitest del front 74/74 (7 del profile).
