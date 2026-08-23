# Tareas atómicas: Bloque Calendario (22E)

> Cada tarea = un commit en `develop`. Orden: schema → generador → app → frontera → estudio → golden.
> TDD estricto; para plantillas EJS el test es el spec del generador + gate de oro al final.

## Schema y generador

- [x] **TASK-01**: Tests + `CalendarDefinition` en `resource-types.ts` + validación en
      `define-resource.ts` (date existe y es date/timestamptz; color existe y es enum).
- [x] **TASK-02**: Tests + `renderCalendar` en `build-substitutions.ts` (defaults de label,
      leyenda del enum con etiquetas y color por posición, weekends).
- [x] **TASK-03**: Tests (`calendar.spec.ts`, patrón gallery.spec) + plantilla
      `files-calendar/frontend/__plural__-calendar.component.ts.template` + condición
      `if (model.calendar)` en `resource.ts`. Vistas Mes/Semana/Día, hoy realzado, tiras.
- [ ] **TASK-04**: Tests + `CalendarPage` en `app-types.ts`, sufijo `' · calendario'` y
      derivación en `composition.ts`, `calendarPath`/`calendarRoute` en `app.ts` (antes de `:id`).

## Frontera

- [ ] **TASK-05**: Tests + flag `calendar` en `draft-resource.ts` (draft → `CalendarDefinition`)
      y cruce `'calendar'` en `design-to-app.ts`.

## Estudio

- [ ] **TASK-06**: Tests + `'calendar'` en `BlockKind`/`GENERABLE_BLOCKS` y campos de config en
      `DesignBlock` (`design-page.ts`); derivación en `design-store` addBlock/removeBlock con
      defaults (primer campo date, labelField, weekends true) + mutadores de config.
- [ ] **TASK-07**: Paleta (`BLOCK_TOOLS` + `view-icon.ts`, `lucideCalendar`) + componente de
      preview `canvas-calendar.component.ts` (mini-mes fiel al mock) + badge «aún no generable»
      cuando el recurso no tiene campo fecha.
- [ ] **TASK-08**: Panel de configuración por bloque (componente propio): Fecha / Etiqueta /
      Color de la tira / Fin de semana, cableado al store y visible en la pestaña Componente.

## Golden y verificación

- [ ] **TASK-09**: `calendar` en el modelo `project` de oro + bloque en `golden.app.ts`;
      regenerar, revisar el diff a mano y congelar fixtures (`projects/` y `app/`). `/golden-diff`
      limpio en los 4 módulos y las 2 apps.
- [ ] **TASK-10**: Verificación final: suites del estudio y del plugin en verde + typecheck del
      emitido a 0 errores + smoke visual del estudio (canvas y panel).

---

## Regla del juego

Implementar UNA tarea, commit, seguir. Si una tarea crece (>~150 líneas), partirla.
