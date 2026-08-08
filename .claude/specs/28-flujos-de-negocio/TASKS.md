# 28 — Flujos de negocio · TASKS

> Cada tarea = un commit atómico en develop. TDD: test rojo primero.
> TASK-01..06 no tocan plantillas → `/golden-diff` vacío garantizado.
> ⚠️ TASK-07 está BLOQUEADA hasta que la spec 22 emita `CLAUDE.md` (su TASK-05).

## Fase 1 — el contrato

- [x] TASK-01 — Contrato en `@acc/schema`: `FlowNode`/`FlowEdge`/`BusinessFlow` +
      `AppDefinition.flows` + gate estructural completo en `defineApp` (ids únicos,
      aristas válidas, un start / ≥1 end, aridad por kind, alcanzabilidad BFS,
      auto-bucle rechazado, topes). Tests: válido pasa, cada regla rechaza con
      mensaje accionable.
- [x] TASK-02 — Helper puro `flowLayout(flow)` en `@app/shared/domain`
      (niveles BFS desde start, orden estable, determinista) + reutilización
      verificada de `nodeBox`/`edgeLine` con cajas de flujo (TDD).

## Fase 2 — el estudio

- [x] TASK-03 — `DesignStore`: signal `flows` + mutaciones (`addFlow`,
      `removeFlow`, `addFlowNode`, `updateFlowNode`, `removeFlowNode` con
      limpieza de aristas, `addFlowEdge`, `removeFlowEdge`) vía `mutate()`;
      `exportJson`/`importJson`/`applyExternal` incluyen flujos (TDD).
- [x] TASK-04 — Vista **Flujos** solo lectura: conmutador a tres posiciones
      (Vistas/Modelo/Flujos), selector de flujo activo, cajas por kind
      (píldora/rectángulo/rombo), flechas con etiqueta a mitad de camino.
- [x] TASK-05 — Edición visual: paleta de nodos, arrastre (posiciones en
      memoria sobre `flowLayout`), conexión con flecha fantasma (etiqueta
      pedida al salir de una decisión), doble clic edita texto, desplegable
      de `entity`, selección y borrado de nodo/arista (botón + Supr).
      · toda mutación llama al store (T03): el componente no guarda nada salvo
        las posiciones arrastradas (cosmético, memoria de sesión)
      · smoke en navegador (e2e-15-flujo-editado.png): paleta → conexión
        decisión→paso con etiqueta «sí» → conexión directa → borrado de arista
      · pendiente cosmético anotado: dos aristas opuestas entre los mismos
        nodos se pintan superpuestas (misma línea)
- [x] TASK-06 — Chat de punta a punta: `DesignPayload.flows`, `RESPONSE_SCHEMA`,
      prompt («propón un flujo cuando el proceso tenga ramas; conserva los
      existentes»), fake adapter con flujo de demo, gate + existencia de
      `entity` en `validateDesign` (tests del gate primero).
      · el fake («dibuja el flujo de pedidos») emite un ciclo con decisión y vuelta
        a revisión que pasa el gate REAL de validateFlows; sin entidad, pide crearla
      · validateDesign valida estructura (validateFlows compartido con defineApp) y
        que `entity` aluda a entidades del diseño — error accionable en el turno

## Fase 3 — la frontera y el aterrizaje

- [x] TASK-07 — `buildAppFile` copia `flows` (validando `entity` contra los
      recursos) + `renderFlows(flows)` pura en el generador (esquema numerado
      con ramas, orden BFS; sin flujos → `''`) + sección «Procesos de negocio»
      en el `CLAUDE.md` emitido. (Desbloqueada: la 22-T05 emitió el CLAUDE.md.)
      · el CLAUDE.md sigue emitiéndose solo con brief (regla de la 22); los flujos
        entran como sección cuando existen — sin flujos el markdown es byte a byte
        el de antes y los 6 golden quedan vacíos
      · el esquema numera en BFS (el orden del lienzo), lista las ramas etiquetadas
        de las decisiones y hace explícitos los saltos no secuenciales (→ 2)
- [x] TASK-08 — Validación final: `/golden-diff` vacío, suites de `@acc/schema`
      + estudio + generadores verdes, e2e con captura (flujo dibujado →
      `CLAUDE.md` de la app generada lo contiene).
      · 2026-08-08: golden 6/6 vacíos · schema 122 · generadores 455 · estudio 243+206
      · e2e real (e2e-16-flujo-para-claudemd.png): entidad + brief del panel + flujo
        con entidad en el nodo → app.json exportado → `nx g @acc/generators:app` →
        el CLAUDE.md emitido contiene «Procesos de negocio» con el esquema numerado
        («1. (inicio) Llega un pedido · entidad: pedido»)

## Regla del juego

- Implementar UNA, commitear, esperar revisión, siguiente.
- Si una tarea supera ~1h o ~150 líneas, partirla antes de empezar.
- Dependencia oculta no contemplada → PARA y reporta.
