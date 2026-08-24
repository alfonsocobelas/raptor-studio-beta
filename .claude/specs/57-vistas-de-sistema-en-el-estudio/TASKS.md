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
- [x] **TASK-03** (OK de Alfonso 2026-08-24, tras 3 rondas): Verificación visual CON Alfonso: estudio
      levantado, las 3 vistas en los 3 presets; smoke actualizado. Cierre.

---

## Regla del juego

Implementar UNA, commit, seguir. La TASK-03 requiere a Alfonso delante: no se cierra sola.

> La verificación visual (contra capturas de la referencia en docs/style) tiró del hilo mucho
> más allá del estudio — defectos ARREGLADOS EN EL GENERADOR: login sin enlace de recuperación,
> título "Dashboard" fijo, logo azul hardcodeado, sin sección Administración en el nav, footer
> sin Mi cuenta explícito, acciones de tabla como iconos, sin reenviar invitación, y la fila más
> ancha estirando la tabla (max-content). En el estudio: login a página completa, panel derecho
> plegado con vista de sistema, vistas interactivas con dobles inertes y "Volver al diseño".
