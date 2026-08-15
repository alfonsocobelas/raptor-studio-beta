# Tareas atómicas: Convergencia flujos↔transiciones

> Cada tarea = un commit atómico en develop. Las de plantillas/generator llevan gate de
> `/golden-diff`; las de estudio que tocan plantilla Angular llevan `npm run web:build`.
> ⚠️ `flow-view/flow-panel/flow-sidebar` llevan WIP de Alfonso sin commitear: revisar antes
> de tocar y NO arrastrar su WIP a los commits.

## Bloque A — emisión (el corazón)

- [x] **TASK-01**: `/golden-diff` + el paso con `transition` emite cuerpo real (cargar →
      verbo → guardar, sin hueco @ai) con su JSDoc; el oro gana el paso «Se termina el
      contrato» (entity contract, transition terminate) en el flujo golden.

- [x] **TASK-02**: `/golden-diff` + controller de procesos por flujo con pasos convergidos
      (`POST /processes/<flujo>/<paso>/:id` → 204, mismo 409/404 vía filtro global) y su
      cableado en `processes.module.ts`. Sin pasos convergidos → sin controller.

## Bloque B — estudio

- [ ] **TASK-03**: Tests + el chat declara `transition` (prompt + schema de salida).

- [ ] **TASK-04**: Tests + panel del paso: desplegable «Transición» con los verbos de la
      máquina de la entidad aludida («— ninguna —» lo quita); el nodo del canvas enseña el
      verbo. `npm run web:build`. ⚠️ WIP de Alfonso en estos ficheros.

## Validación

- [ ] **TASK-05**: Suite completa + `web:build` + `/golden-diff` + navegador: transición
      declarada en el panel, app generada y `POST /processes/…/:id` ejercitado contra la
      app corriendo (204 real y 409 desde estado ilegal). Capturas a `docs/style/`.

---

## Regla del juego

- Implementar UNA tarea, commit, seguir (mandos delegados 2026-08-15).
- Dependencia oculta no contemplada → PARA y reporta.
