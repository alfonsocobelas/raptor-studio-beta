# 28 — Flujos de negocio · TASKS

> Cada tarea = un commit atómico en develop. TDD: test rojo primero.
> TASK-01..06 no tocan plantillas → `/golden-diff` vacío garantizado.
> ⚠️ TASK-07 está BLOQUEADA hasta que la spec 22 emita `CLAUDE.md` (su TASK-05).

## Fase 1 — el contrato

- [ ] TASK-01 — Contrato en `@acc/schema`: `FlowNode`/`FlowEdge`/`BusinessFlow` +
      `AppDefinition.flows` + gate estructural completo en `defineApp` (ids únicos,
      aristas válidas, un start / ≥1 end, aridad por kind, alcanzabilidad BFS,
      auto-bucle rechazado, topes). Tests: válido pasa, cada regla rechaza con
      mensaje accionable.
- [ ] TASK-02 — Helper puro `flowLayout(flow)` en `@app/shared/domain`
      (niveles BFS desde start, orden estable, determinista) + reutilización
      verificada de `nodeBox`/`edgeLine` con cajas de flujo (TDD).

## Fase 2 — el estudio

- [ ] TASK-03 — `DesignStore`: signal `flows` + mutaciones (`addFlow`,
      `removeFlow`, `addFlowNode`, `updateFlowNode`, `removeFlowNode` con
      limpieza de aristas, `addFlowEdge`, `removeFlowEdge`) vía `mutate()`;
      `exportJson`/`importJson`/`applyExternal` incluyen flujos (TDD).
- [ ] TASK-04 — Vista **Flujos** solo lectura: conmutador a tres posiciones
      (Vistas/Modelo/Flujos), selector de flujo activo, cajas por kind
      (píldora/rectángulo/rombo), flechas con etiqueta a mitad de camino.
- [ ] TASK-05 — Edición visual: paleta de nodos, arrastre (posiciones en
      memoria sobre `flowLayout`), conexión con flecha fantasma (etiqueta
      pedida al salir de una decisión), doble clic edita texto, desplegable
      de `entity`, selección y borrado de nodo/arista (botón + Supr).
- [ ] TASK-06 — Chat de punta a punta: `DesignPayload.flows`, `RESPONSE_SCHEMA`,
      prompt («propón un flujo cuando el proceso tenga ramas; conserva los
      existentes»), fake adapter con flujo de demo, gate + existencia de
      `entity` en `validateDesign` (tests del gate primero).

## Fase 3 — la frontera y el aterrizaje

- [ ] TASK-07 — `buildAppFile` copia `flows` (validando `entity` contra los
      recursos) + `renderFlows(flows)` pura en el generador (esquema numerado
      con ramas, orden BFS; sin flujos → `''`) + sección «Procesos de negocio»
      en el `CLAUDE.md` emitido. **BLOQUEADA por spec 22 TASK-05.**
- [ ] TASK-08 — Validación final: `/golden-diff` vacío, suites de `@acc/schema`
      + estudio + generadores verdes, e2e con captura (flujo dibujado →
      `CLAUDE.md` de la app generada lo contiene).

## Regla del juego

- Implementar UNA, commitear, esperar revisión, siguiente.
- Si una tarea supera ~1h o ~150 líneas, partirla antes de empezar.
- Dependencia oculta no contemplada → PARA y reporta.
