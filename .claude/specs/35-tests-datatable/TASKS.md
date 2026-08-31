# Tareas atómicas: Tests del DataTable emitido

> El artefacto SON tests: el ciclo TDD aquí fue correr la suite del canon contra el DataTable
> emitido (roja donde el emitido tenía un defecto) y vaciarla, y solo después templetizarla.

- [x] **TASK-00** (descubierta al empezar, habilitadora): **el runner emitido no podía renderizar
      componentes**. Era esbuild pelado: sin `@analogjs/vite-plugin-angular` los decoradores se
      borran sin metadata y todo binding muere con NG0303 — medido en app real, 53 de 65 tests
      del canon caían por esto. Añadidos el plugin, `tsconfig.spec.json` (el raíz solo incluye
      backend+shared, así que apuntar ahí no compila NADA del frontend) y testing-library.
      Verificado en app recién generada: un test que renderiza el DataTable pasa. `0b6bf36`.
- [x] **TASK-01/02**: Correr la suite del canon (887 líneas) contra el emitido y vaciarla.
      Recorrido: 53 rojos → 6 → 5 → 3 → 1 → **0**.
- [x] **TASK-01b**: Los rojos, uno a uno. Ninguno era ruido:
      · **defecto real** — `sortField` no se resolvía de vuelta a la clave de columna en modo
        servidor: la flecha de orden desaparecía y el 2º clic reiniciaba en asc (`751f5c7`).
      · **defecto real** — una columna con `valueMap` no ofrecía desplegable de filtro: había que
        teclear la clave guardada (`yearly`) viendo en pantalla su etiqueta (`Anual`), y encima
        con un «contiene» sin sentido sobre un valor de lista cerrada (`c8b117b`).
      · **defecto real** — el `test-setup` emitido no rellenaba los huecos de jsdom: `brn-select`
        llama a `scrollIntoView` al abrirse, así que CUALQUIER test que despliegue un select
        emitido moría en el CDK. Añadidos también `matchMedia`, limpieza de overlays entre tests
        y guarda del init del TestBed (`3ec246e`). Decisión: NO se importa el `setup-vitest` de
        Analog, que arrastra zone.js — estas apps son zoneless.
      · **diferencia deliberada** — el canon espera `dd-MM`; nuestro canon es `dd/MM` (defecto 22).
        Se adaptó el TEST, no el código.
- [x] **TASK-03**: Templetizada en `files-ui/spartan` (se emite con spartan; material no, su tabla
      es otra y la piel está congelada), test del generador, golden re-baseline y verificación en
      app recién generada: `npm run test:front` → **65/65** (`40bc2e2`).

## Pendiente (fuera del alcance de esta spec)

- [~] ~~La piel **material declara `sortColumnInput` y no lo usa en ningún sitio**: no restaura el
      indicador de orden al volver a la pantalla. Mismo defecto de fondo que el de spartan, otra
      piel; y su tabla no tiene suite. Tarea propia cuando la piel material se descongele.~~
      **ANULADA 2026-08-31**: la piel material se retiró entera del generador (spec 36,
      2026-08-10); no hay defecto que arreglar porque no hay código que lo tenga.
- [ ] Siguiente tanda de suites del kernel si esta demuestra valor: KpiCard, dialogs, RelatedTable.
