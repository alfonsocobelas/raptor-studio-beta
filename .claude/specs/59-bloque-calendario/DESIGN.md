# Diseño técnico: Bloque Calendario (22E)

Molde: **gantt** (spec 30) para la capacidad del generador + **form** (spec 48) para el cableado
del BlockKind en el estudio. Sin backend nuevo: el componente emitido reutiliza el servicio del
listado igual que la galería (`files-gallery/...component.ts.template:7-12`).

## Resource-schema (`libs/schema/src/lib/resource-types.ts`)

```ts
export interface CalendarDefinition {
  /** Campo fecha que coloca cada registro en su día (date | timestamptz) */
  date: string
  /** Campo mostrado en la tira (default: primer texto buscable, como la galería) */
  label?: string
  /** Campo enum que colorea la tira (opcional; leyenda = sus valores) */
  color?: string
  /** Mostrar SÁB/DOM (default: true) */
  weekends?: boolean
}
```

- `calendar?: CalendarDefinition` junto a `gallery`/`gantt` (:468-469).
- Validación en `define-resource.ts` (patrón galería :80-86): `date` debe existir y ser
  `date`/`timestamptz`; `color` debe existir y tener `vo.values`.

## Generador

- `build-substitutions.ts`: `calendar: renderCalendar(definition)` — resuelve nombres de campo,
  defaults (label como `renderGallery` :1098-1125), etiquetas de la leyenda desde
  `table.badgeMap[value].label ?? form.options ?? capitalizado` (patrón `composition.ts:84-101`)
  y color por **posición** del valor del enum (misma doctrina determinista que `BADGE_VARIANTS`).
- `files-calendar/frontend/__plural__-calendar.component.ts.template`: componente standalone que
  inyecta el `<Class>Service` del listado (`linkedSignal` sobre `service.<plural>.value()`, como
  la galería). Vistas **Mes / Semana / Día** con conmutador, navegación `‹ ›`, hoy realzado,
  días de otro mes atenuados, fin de semana según config, tira clicable → ficha si `detail`.
  Toda la lógica de rejilla (semanas del mes, agrupado por día) en TS del componente; la
  plantilla EJS solo interpola nombres/config (plantillas tontas).
  - Filtrado por rango visible: v1 pagina como la galería y agrupa en cliente lo cargado; el
    pie muestra el total (el filtro por rango de fechas en query es mejora futura — el endpoint
    de listado ya soporta filtros, pero no queremos acoplar el mock a eso todavía).
- `resource.ts`: `if (model.calendar) generateFiles(files-calendar…)` (patrón :170-178).
- App: `CalendarPage` en `app-types.ts` (+`PageDefinition`); `composition.ts` sufijo
  `' · calendario'` y derivación en `composeFlat` desde `model.calendar`; `app.ts`
  `calendarPath = '/calendario'`, `calendarRoute` en el orden documentado (:893-897), siempre
  antes de `detailRoute (:id)`.

## Frontera (estudio → app-schema)

- `draft-resource.ts`: flag `calendar?: { dateField: string; labelField?: string; colorField?: string; weekends: boolean }`
  en el draft; `draftToResource` emite `calendar: {...}` mapeando a `CalendarDefinition`.
- `design-to-app.ts:65`: el cruce añade `'calendar'` al mapa de kinds; el descarte silencioso
  de kinds desconocidos queda como está.

## Estudio

- `design-page.ts`: `'calendar'` en `BlockKind` y `GENERABLE_BLOCKS`; `DesignBlock` gana
  `dateField?/labelField?/colorField?/weekends?`.
- **Generabilidad condicionada a datos** (primera vez): un calendario sobre un recurso sin
  campo fecha no es generable. `generableHere` no ve el draft, así que el badge «aún no
  generable» del canvas (`canvas-page.component.ts:74-88`) añade esta comprobación consultando
  `store.resources()` — sin tocar la firma compartida.
- Paleta: `BLOCK_TOOLS` + `view-icon.ts` → `{ kind: 'calendar', icon: 'lucideCalendar', label: 'Calendario' }`.
- Canvas: `canvas-calendar.component.ts` — mini-mes con tiras de `buildSampleRows`, fiel al mock
  (cabecera con título+nav, rejilla LUN→DOM, pie con origen y conmutador).
- **Panel de configuración por bloque** (obra nueva, primer bloque que lo tiene): cuando el
  bloque seleccionado es `calendar`, la pestaña «Componente» del `design-panel` muestra, encima
  del inspector, los cuatro controles del mock: Fecha (selects sobre los campos `date` del
  draft), Etiqueta (cualquier campo), Color de la tira (campos enum) y Fin de semana (toggle).
  Se guarda en el propio `DesignBlock` y `design-store` lo replica al flag del draft.
- `design-store`: `addBlock('calendar')` → defaults (primer campo `date`, labelField del draft,
  weekends true) + flag en el draft; `removeBlock` lo invierte; mutadores para el panel.

## Golden

Patrón spec 48: el modelo `project` de oro gana `calendar: { date: <campo date existente> }`
y `golden.app.ts` un bloque `{ kind: 'calendar', resource: 'project' }` → re-baseline
deliberado de `tools/golden-fixtures/projects/` y `tools/golden-fixtures/app/` (fixture nueva
del componente + ruta `/calendario` en `app.routes.ts`). Los otros 3 módulos no cambian ⇒ su
diff sigue vacío.

## Decisiones técnicas

- **Color por enum, no por campo libre**: leyenda finita y determinista; sin enum → todas las
  tiras neutras (como el mock en negro).
- **Config en build-time, no runtime**: fin de semana y campos elegidos se hornean en el
  emitido; el conmutador Mes/Sem/Día sí es runtime (estado local del componente).
- **Sin `CalendarPage` con selección de campos en el app-schema**: la config vive en el
  `CalendarDefinition` del resource (igual que gallery/gantt); la página solo referencia el
  recurso. Evita duplicar la verdad en dos sitios.
- **Semana/Día simples**: semana = misma rejilla de 7 días; día = lista de tiras. Nada de
  horas/franjas (el campo canónico es `date`, sin hora garantizada).

## Riesgos identificados

- El panel por-bloque es patrón nuevo en el estudio → mantenerlo mínimo (4 controles) y
  encapsulado en un componente propio para que el kanban lo reutilice.
- Re-baseline del oro: tocar `project` de referencia exige regenerar y revisar el diff a mano
  antes de congelar (gate `/golden-diff`).
- Volumen: con miles de registros el agrupado en cliente se queda corto — asumido y anotado
  como mejora (filtro por rango en query).
