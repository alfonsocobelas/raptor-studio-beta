# Tareas atómicas: Tests del DataTable emitido

> El artefacto SON tests: el ciclo TDD aquí es escribir el spec contra el DataTable emitido en
> la demo real (rojo si el spec miente, verde cuando describe la verdad) y luego templetizarlo.

- [x] **TASK-00** (descubierta al empezar, habilitadora): **el runner emitido no podía renderizar
      componentes**. Era esbuild pelado: sin `@analogjs/vite-plugin-angular` los decoradores se
      borran sin metadata y todo binding muere con NG0303 — medido en app real, 53 de 65 tests
      del canon caían por esto. Añadidos el plugin, `tsconfig.spec.json` (el raíz solo incluye
      backend+shared, así que apuntar ahí no compila NADA del frontend) y testing-library.
      Verificado en app recién generada: un test que renderiza el DataTable pasa. `0b6bf36`.
- [ ] **TASK-01**: Escribir `data-table.spec.ts` contra el DataTable emitido, iterando en la
      demo (`iamdemo`) hasta verde: render, búsqueda, filtros, orden, paginación cliente.
      · Estado: el spec del canon (887 líneas) ya corre contra el emitido con **59/65 en verde**.
        Los 6 rojos son señal, no ruido — ver TASK-01b.
- [ ] **TASK-01b**: Decidir uno a uno los 6 rojos (cada uno es un defecto del emitido o una
      diferencia deliberada del canon):
      · `sortField` no se resuelve de vuelta a la clave de columna en modo servidor → **defecto
        real** del DataTable emitido (la flecha de orden desaparece y el 2º clic reinicia en asc);
        la referencia sí lo hace (`data-table.ts:666`).
      · fecha `dd-MM` esperada por el canon vs **`dd/MM` nuestro** (defecto 22 ya resuelto a
        propósito) → se adapta el TEST, no el código.
      · vocabulario cerrado por `valueMap` en el desplegable de filtros (2 tests) y los dos de
        selects spartan → pendiente de decidir si el emitido debe adoptarlos.
- [ ] **TASK-02**: Ampliar con lo que la referencia no cubría: server-side (eventos), badges,
      valueMap, booleanos, acciones con `hidden`, export CSV, estado vacío. Verde en la demo.
- [ ] **TASK-03**: Templetizar en `files-ui/spartan`, test del generador (se emite con spartan,
      no con material), golden re-baseline propio y `test:front` verde en app regenerada.
