# Tareas atómicas: vistas de sistema en el estudio

> Cada tarea = un commit atómico en develop.

- [x] **TASK-01** (`25ca9c40`): Tests + `system-preview/`: script de sync (`apps/studio/tools/emit-system-preview.ts`,
      patrón emit-slots), copias de login/users-list/profile/iam-labels con imports reescritos,
      mocks `PreviewAuthService`/`PreviewUserService`, spec de paridad contra los assets del
      plugin (asset cambiado sin regenerar = rojo) y compilación verde en la suite del estudio.
- [x] **TASK-02** (`ea58328c`): Tests + raíl y lienzo: grupo "Sistema" en `views-sidebar` (3 entradas de
      `SYSTEM_VIEWS`, sin drag/borrar), selección `design|system` en el estado de sesión del
      modo Vistas, `system-view.component` con la banda "La trae la autenticación", el
      componente real vía `ngComponentOutlet` + providers del preview y `pointer-events: none`.
- [ ] **TASK-03**: Verificación visual CON Alfonso (esencia antes que fontanería): estudio
      levantado, las 3 vistas en los 3 presets; smoke actualizado. Cierre.

---

## Regla del juego

Implementar UNA, commit, seguir. La TASK-03 requiere a Alfonso delante: no se cierra sola.
