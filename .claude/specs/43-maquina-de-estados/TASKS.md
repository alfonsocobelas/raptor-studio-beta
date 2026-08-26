# Tareas atómicas: Máquina de estados de la entidad

> Cada tarea = un commit atómico en develop. Implementar UNA, commitear, esperar revisión.
> Orden: contrato → estudio → plantillas backend → plantillas frontend → validación.
> Las tareas de plantillas/generator llevan gate de `/golden-diff`; las de estudio que tocan
> plantilla Angular llevan `npm run web:build` (lección de la spec 41).

## Bloque A — contrato y gate

- [x] **TASK-01**: Tests + `StateMachine`/`StateTransition` en `@raptor/schema` y gate completo
      en `defineResource` (campo enum existente, valores válidos, `name` únicos y no
      reservados, `from` no vacío, `to ∉ from`, topes). `FlowNode.transition?` entra en el
      contrato. _Nota: el gate vive en `defineResource`, no en `defineApp` — la máquina es
      del recurso y solo el recurso conoce su enum._

- [x] **TASK-02**: Tests + frontera: `validateDesign` valida `state` (y `FlowNode.transition`
      contra la máquina del recurso del paso) y emite el **warning** de alcanzabilidad.

## Bloque B — estudio

- [x] **TASK-03**: Tests + conmutador «Es el estado de la entidad» en el campo enum del
      editor de modelo (crear `state` con `initial` = primer valor; quitar con confirmación).

- [x] **TASK-04**: Tests + el canvas pinta la máquina en la vista de la entidad: nodos =
      valores del enum (labels), flechas con `label`, `initial` distinguido, nodos sueltos
      visibles. Solo pintado; `npm run web:build`.

- [x] **TASK-05**: Tests + gestos: arrastre crea transición (nombre propuesto, label inline),
      selección + edición + Supr, acción «Estado inicial», agrupado por `name` al guardar
      (merge de orígenes). `npm run web:build`.

- [x] **TASK-06**: Tests + el chat propone `state`: prompt con ejemplos, el diseño devuelto
      pasa el gate, autosave como siempre.

## Bloque C — plantillas backend

- [x] **TASK-07**: `/golden-diff` + la app de oro declara una máquina (contrato:
      `borrador → firmado → archivado`) y el VO enum-estado gana factorías semánticas y
      predicados (`initial()`, una por valor, `isX()`).

- [x] **TASK-08**: `/golden-diff` + el agregado emite un método por transición (no-op en
      destino, guarda OR de `from`, `InvalidTransitionError` con label), nace en `initial`,
      el campo sale de register/update props.

- [x] **TASK-09**: `/golden-diff` + caso de uso por transición (cargar → transicionar →
      guardar) y endpoint `POST /{plural}/:id/{name}` → 204; error de transición → 409 por
      tipo; 404 si no existe. Tests e2e emitidos.

## Bloque D — plantillas frontend

- [x] **TASK-10**: `/golden-diff` + servicio emitido con un método por transición y el campo
      estado excluido de los formularios de alta/edición (sigue en listado/ficha/filtros).

- [x] **TASK-11**: `/golden-diff` + botones de acción en la ficha emitida: visibles según
      `from`, disabled+spinner, POST → reload, 409 → toast + recarga. Tests emitidos.

## Validación

- [x] **TASK-12**: Suite completa + `npm run web:build` + demo en navegador: máquina diseñada
      en el estudio (chat y gestos), app generada, aprobar/descartar ejercitados con botones
      que aparecen/desaparecen, 204 no-op y 409 comprobados. Capturas a `docs/style/`.
      Añadir la spec de convergencia flujos↔transiciones al ROADMAP.

      Cerrada el 2026-08-26 con dos guiones que quedan en el repo:

      - `apps/studio/tools/smoke-machine-access.ts` — en el estudio: arrastrar el asa de
        «Rechazada» a «Presupuestada» crea la transición, el editor inline la renombra a
        `reabrir` / «Reabrir presupuesto» y el diseño guardado la lleva.
      - `apps/studio/tools/validate-emitted-machine-access.ts` — sobre la app generada:
        `aprobar` desde «recibida» → **409**, `presupuestar` → **204**, re-aplicarla →
        **204 no-op**, orden inexistente → **404**; y en la ficha, presupuestar hace
        **desaparecer** su botón y **aparecer** los del estado nuevo.

      Capturas: `docs/style/spec43-1..5-*.png`. La spec 44 ya figura en el ROADMAP
      («Convergencia flujos↔transiciones»). El chat ya había diseñado la máquina del taller
      (demo 2026-08-18); aquí se ejercitan los **gestos**.

---

## Regla del juego

- Implementar **UNA** tarea, commit, esperar aprobación, siguiente.
- Si una tarea parece > 1h o > ~150 líneas, partirla antes de empezar.
- Dependencia oculta no contemplada → PARA y reporta.
