# Diseño técnico: studio-editing

## Flujo (la definición manda, todo lo demás se deriva)

```
        paleta (añadir)   cruz (borrar)   drag&drop (orden)
              │                │                │
              ▼                ▼                ▼
        app-mutations.ts (funciones puras: def → def', gate defineApp)
                               │
                               ▼
              AppStore: signal<AppDefinition>          ← única fuente
                               │ computed
                               ▼
              composeApp(def, MODELS) : AppComposition ← derivado SIEMPRE
                               │
                               ▼
             lienzo (nav / dashboard / tablas) + panel JSON
```

## Piezas (todas en `apps/studio/libs/frontend/src/domains/studio/`)

- `editor/app-mutations.ts` — puro: `removePage(def, i)`, `removeWidget(def, pageIdx, widgetIdx)`
  (si el dashboard queda sin widgets, elimina la página), `movePage(def, from, to)`,
  `addResourcePage(def, resource)`, `addKpiWidget(def, resource)` (crea el dashboard si falta),
  y `paletteOf(def, registry)` (qué se puede añadir). Cada mutación devuelve una definición
  nueva pasada por `defineApp`; si no valida, lanza — el store decide no aplicar.
- `editor/app-store.ts` — `AppStore` (clase con signals, sin decorador de template):
  `definition` (signal), `composition` (computed via composeApp), `schemaJson` (computed),
  `apply(mutation)` con try/catch → aviso.
- `preview/*` — se vuelven editables: wrapper con hover-highlight + botón ✕ (posicionado
  absolute, visible en hover), `cdkDropList` en el nav de páginas, paleta lateral derecha,
  toggle del panel JSON. Los componentes leen del store en vez de ACTIVE_APP.

## Decisiones técnicas

- **Mutar la `AppDefinition`, no la composición**: la composición es un derivado (mismo camino
  que usará el generador). Nada se guarda de ella.
- **El gate estructural es `defineApp`** en cada mutación: imposible dejar el schema inválido.
- **CDK drag-drop solo para reordenar el nav** en esta fase (arrastrar desde la paleta = click
  "añadir": mismo efecto, menos código; el gesto se puede sofisticar después).
- **Aviso de bloqueo** con el NotificationService del kernel emitido (toasts ya montados).
- Los specs de vitest cubren mutaciones y store (sin templates); las interacciones se verifican
  con el smoke de Playwright (hover → cruz → borrar → JSON actualizado).

## Riesgos identificados

- Divergencia visual preview↔app real al envolver componentes con wrappers de edición →
  wrappers como overlay (outline/anillo), sin alterar layout interno de los componentes.
- Crecer la paleta más allá del catálogo → `paletteOf` deriva del registro, no hay lista manual.
