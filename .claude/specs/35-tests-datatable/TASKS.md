# Tareas atómicas: Tests del DataTable emitido

> El artefacto SON tests: el ciclo TDD aquí es escribir el spec contra el DataTable emitido en
> la demo real (rojo si el spec miente, verde cuando describe la verdad) y luego templetizarlo.

- [ ] **TASK-01**: Escribir `data-table.spec.ts` contra el DataTable emitido, iterando en la
      demo (`iamdemo`) hasta verde: render, búsqueda, filtros, orden, paginación cliente.
- [ ] **TASK-02**: Ampliar con lo que la referencia no cubría: server-side (eventos), badges,
      valueMap, booleanos, acciones con `hidden`, export CSV, estado vacío. Verde en la demo.
- [ ] **TASK-03**: Templetizar en `files-ui/spartan`, test del generador (se emite con spartan,
      no con material), golden re-baseline propio y `test:front` verde en app regenerada.
