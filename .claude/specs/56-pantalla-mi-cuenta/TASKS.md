# Tareas atómicas: pantalla "Mi cuenta"

> Cada tarea = un commit atómico en develop.

- [ ] **TASK-01**: Tests + `ChangePasswordDto` en shared-domain (+ barrel) y
      `AuthService.changePassword` en el kernel frontend. Re-baseline deliberado de app y
      app-mongo (solo estas dos piezas).
- [ ] **TASK-02**: Tests + `ProfileComponent` ("Mi cuenta") en `assets-auth` con contratos
      `App*`, su spec portado como asset, ruta `/account` en `wireFrontend` y enlace en el
      session-footer. Re-baseline deliberado de la fixture app.
- [ ] **TASK-03**: Verificación: `typecheck-emitted` a 0 en la app de oro; demo en vivo —
      login, cambiar contraseña en `/account`, logout, re-login con la nueva; 401 con la
      actual incorrecta mostrado en el formulario. Cierre.
