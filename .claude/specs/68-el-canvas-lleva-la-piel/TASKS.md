# Tareas atómicas: El canvas del estudio lleva la piel de verdad

> Cada tarea = un commit. Implementar UNA, hacer commit, esperar revisión.
> Gates: suite del generador + gate de oro (TASK-01 no debe mover un byte del emitido) y
> `npm run typecheck` del estudio antes de cada commit que toque `apps/studio`
> ([[studio-ng-serve-bundle-viejo]]: vitest no typechequea).

## La mudanza (una sola fuente de verdad)

- [ ] TASK-01: Mover `design/presets.ts` y `design/hooks.ts` a `libs/schema`
      (`design-presets.ts`, `design-hooks.ts`) y exportarlos por el barrel; los consumidores del
      generador sólo cambian el import. `files-design/<id>/` se queda donde está: es emisión.
      **Verificación**: gate de oro vacío — el emitido no cambia ni un byte.

## El CSS del preset, acotado al lienzo

- [ ] TASK-02: `scopePresetCss(css, scope)` como función pura, con un test por forma de selector:
      `:root`, `.dark`, `.app-shell-main …`, hook suelto, `.dark <selector>`, comentarios y
      líneas `@…`. Incluye el caso guardián: **ningún selector sale sin prefijo**.
- [ ] TASK-03: El lienzo aplica el CSS de la piel elegida (inyección de `<style>` + clase de
      ámbito en su nodo raíz) y **se borra `presetChrome()`**. Test: al cambiar de piel cambia el
      CSS inyectado; con `actual` no se inyecta nada.

## Los hooks en los bloques del canvas

> El hook se añade delante de las clases Tailwind, nunca las sustituye: con `actual` el canvas
> se ve idéntico a hoy. Test por componente, como en la spec 67.

- [ ] TASK-04: `canvas-table` — `app-panel`, `app-toolbar`, `app-chip`.
- [ ] TASK-05: `canvas-calendar` — los cinco de la tabla del DESIGN.
- [ ] TASK-06: `canvas-kanban` + `canvas-cards` — `app-panel`, `app-panel-head`, `app-chip`, `app-toolbar`.
- [ ] TASK-07: `canvas-detail` — `app-panel`, `app-panel-head`, `app-chip`.
- [ ] TASK-08: `canvas-form`, `canvas-form-fields`, `canvas-form-dialog` — `app-panel-head` y
      `app-toolbar`; el `<form>` NO es superficie (lección de la 67).

## Guardas y verificación

- [ ] TASK-09: `design-hooks-canvas.spec.ts` — espejo del `design-drift.spec.ts` del generador:
      ningún bloque del canvas con cromo sin hook, ningún hook sin usar. Lista blanca con motivo
      para los cuatro componentes de shell del mock.
- [ ] TASK-10: Smoke en navegador sobre el estudio: elegir las tres pieles y medir el radio de
      KPI, panel de calendario, columna de kanban y pastilla (0px en cabina, 2px en suite, lo de
      hoy en actual) **y** que un botón del chrome del estudio NO cambia. Capturas a
      `docs/style/smoke-68-*`.

---

## Regla del juego

Implementar **UNA** tarea, commit, esperar aprobación.
TASK-01 es la más delicada pese a ser mecánica: si el gate de oro no queda vacío, algo se ha
movido que no era un import.
