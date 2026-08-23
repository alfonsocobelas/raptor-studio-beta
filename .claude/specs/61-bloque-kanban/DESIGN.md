# Diseño técnico: Bloque Kanban (22F)

Receta de la spec 59 (calendario) con una pieza nueva de verdad: el drag que ESCRIBE.
Sin backend nuevo: lectura por el listado; escritura por los endpoints que ya existen.

## Resource-schema (`libs/schema/src/lib/resource-types.ts`)

```ts
export interface KanbanDefinition {
  /** Campo enum cuyas VALORES son las columnas */
  field: string
  /** Campo mostrado en la tarjeta (default: primer texto buscable, como galería/calendario) */
  label?: string
}
```

- `kanban?: KanbanDefinition` junto a `gallery`/`gantt`/`calendar`.
- Validación en `define-resource.ts`: `field` existe y tiene `vo.values` (patrón validateCalendar).

## Generador

### Sustituciones (`build-substitutions.ts`)

`kanban: KanbanSubstitution | null`:

```ts
{
  field: string
  labelField: string
  columns: { value: string; label: string }[]      // badgeMap → form.options → capitalizado
  stateDriven: boolean                              // field === state.field
  /** Solo stateDriven: movimiento legal columna→columna. Primera transición declarada
   *  por par (from,to); el caso canónico es una. */
  moves: { from: string; to: string; method: string; verb: string }[]
}
```

`moves` se expande desde `state.transitions` (cada transición aporta un move por cada `from`).
Para enum normal, `moves` queda vacío y el emitido usa `update`.

### Plantilla (`files-kanban/frontend/__plural__-kanban.component.ts.template`)

- Mismo esqueleto que la galería: inyecta el `<Class>Service`, `linkedSignal` sobre
  `service.<plural>.value()`, sin estado propio.
- Columnas: agrupado en cliente `Map<value, Dto[]>`; cabecera con etiqueta y contador.
- **Drag nativo HTML5** (dragstart/dragover/drop) — cero dependencias nuevas; `@angular/cdk`
  no hace falta para esto.
  - `stateDriven`: el drop sobre una columna solo se acepta si existe move (from actual → to);
    las ilegales se atenúan durante el arrastre (`dragging` signal). Drop legal →
    `service.<method>(id)` (los métodos de transición ya existen y recargan). El 409 del
    backend queda de red de seguridad: error → tarjeta no se mueve (no hay optimismo) +
    mensaje de error visible.
  - Enum normal: drop en cualquier columna → `service.update(id, { <field>: value })`
    (los DTO de update del canon son parciales con guards `!== undefined`; verificar en la
    tarea y si NO lo fueran, v1 deshabilita drag en enums normales y lo anota).
- Tarjeta: etiqueta + hasta 2 atributos visibles del listado (patrón chips de la galería);
  clic → ficha si `detail`.
- Pie: `<plural> · columnas por <label del campo>`.
- Roles: si el modelo declara `access`, el drag solo se ofrece si el usuario puede transicionar
  (mismo guard `TRANSITION_ROLES` que usa la ficha); sin matriz, se ofrece siempre.

### App

- `KanbanPage { kind: 'kanban', resource, label? }` en `app-types.ts` + `PageDefinition`.
- `composition.ts`: sufijo `' · tablero'` + derivación en `composeFlat` desde `model.kanban`.
- `app.ts`: `kanbanPath = '/tablero'`, `kanbanRoute` antes de `:id`.
- `resource.ts`: `if (model.kanban) generateFiles(files-kanban…)`.

## Frontera

- `draft-resource.ts`: `kanban?: { field: string; labelField?: string }` → `KanbanDefinition`.
- `design-to-app.ts`: cruce `'kanban'`; sin `field` no cruza (patrón calendario).

## Estudio

- `design-page.ts`: `'kanban'` en `BlockKind` y `GENERABLE_BLOCKS`; `DesignBlock` gana
  `columnsField?: string` (la `labelField` del calendario se reutiliza).
- `design-store.addBlock('kanban')`: default = campo de la máquina de estados si existe,
  si no el primer enum; sin enum → sin flag (no generable). `removeBlock` invierte;
  `setKanbanConfig` como `setCalendarConfig`.
- Paleta: `lucideSquareKanban` · «Kanban». Canvas: `canvas-kanban.component.ts` — columnas
  por valor del enum con tarjetas de `buildSampleRows`; badge «aún no generable» sin enum.
- Panel del bloque: `kanban-config.component.ts` (Columnas / Etiqueta), calcado de
  `calendar-config`.

## Golden

`contract` (único modelo con máquina: terminate/expire) gana `kanban: { field: 'status' }`;
`golden.app.ts` y `demo.app.ts` ganan la página. Re-baseline de `contracts/` y `app*/`.

## Decisiones técnicas

- **Drag nativo, no CDK DragDrop**: el gesto es soltar-en-columna, no reordenar; CDK añadiría
  API y estilos por nada.
- **Sin optimismo**: la tarjeta se mueve cuando el reload del servicio trae el nuevo estado.
  Menos wow instantáneo, cero estados fantasma.
- **Primera transición declarada por (from,to)**: el caso canónico es una; elegir verbo se
  opera desde la ficha (fuera de scope).

## Riesgos identificados

- El drag&drop UI emitido no existía: probarlo de verdad exige navegador (smoke sobre la demo
  o sobre el estudio-preview no cubre el emitido) → el smoke del emitido queda anotado como
  verificación manual/e2e futura; el typecheck y los specs del generador cubren la estructura.
- DTO de update no parcial (enums normales): plan B declarado arriba.
