# Diseño técnico: Calendario interactivo

Receta: el calendario (spec 59) gana escritura igual que el kanban (spec 61) —
**cero backend nuevo**: el alta y la edición pasan por el diálogo CRUD y el service
que ya emite el listado. Todo el cálculo en `build-substitutions`/plantilla del
generador; la plantilla solo interpola (regla 8).

## Decisiones (preguntas abiertas del REQUIREMENTS, cerradas 2026-08-25)

1. **Gesto de alta**: botón «+» en la esquina de cada celda (mes/semana), visible en
   `hover`/`focus-within`; en vista día, botón «Nueva …» en la cabecera del panel.
   El clic desnudo en la celda NO crea (competiría con el clic en tira y con el scroll).
2. **Tira sin `detail`**: abre directamente el diálogo de edición (KISS; el popover de
   lectura es especulativo). Con `detail` se conserva la navegación actual a la ficha.
3. **Precarga**: solo la fecha (`yyyy-mm-dd`). El formulario emitido usa
   `input type="date"` para los campos fecha — no hay hora que decidir.

## Piezas

### 1. Diálogo CRUD: input opcional `initialValue`

`files/frontend/__fileName__-dialog.component.ts.template` gana:

```ts
readonly initialValue = input<Partial<XFormValue> | null>(null)
```

En el `constructor`, el `effect` existente se amplía: si NO hay entidad (`x() === null`)
y hay `initialValue`, `this.form.patchValue(initialValue)`. Genérico: sirve a cualquier
bloque futuro que quiera pre-rellenar el alta. Sin `initialValue` el emitido actual no
cambia de comportamiento (el diff de oro solo debe mostrar el input y la rama nueva).

### 2. Plantilla del calendario: gestos de escritura

`files-calendar/frontend/__plural__-calendar.component.ts.template`, todo condicionado
a `features.edit` (mismo flag que gobierna el diálogo del listado):

- Imports: `AppDialog`, `XDialogComponent`, `XFormValue`, `generateId`, `NotificationService`
  (mismos del listado) — y `entry.listAccessImports` si `entry.accessDeclared`.
- Estado: `dialogOpen = signal(false)`, `editing = signal<Dto | null>(null)`,
  `createDate = signal<string | null>(null)`.
- Alta: botón «+» por celda → `openCreate(cell.key)` (guarda la fecha y abre el diálogo);
  en vista día → `openCreate(this._keyOf(this.anchor()))`. El diálogo recibe
  `[initialValue]="createInitial()"` (computed: `{ [dateField]: createDate() }`).
- Edición: SIN `detail`, la tira gana `(click)="edit(item)"` (rol button, Enter) que fija
  `editing` y abre el diálogo. CON `detail` se mantiene `open(item)` → ficha (sin cambios).
- Guardado: `onSave(value)` calcado del listado (update si `editing`, create con
  `generateId()` si no; toasts de éxito/error). El `resource()` compartido se recarga solo,
  la tira aparece sin recargar página.
- Guardias: `[showCreate]`-equivalente con `entry.canCreateExpr`; la tira editable con
  `entry.canEditExpr` (mismas expresiones que el listado; sin matriz declarada caen a
  `canWrite()`). Sin permiso: ni botón «+» ni clic de edición (tira inerte como hoy).

### 3. Sustituciones

`renderCalendar` no necesita campos nuevos: `features`, `entry.*` y `ui.*` ya viajan en
las substitutions globales que recibe `files-calendar`. Solo se añade a `CalendarSubstitution`
lo que falte de UI (`createLabel` reutiliza `ui.createLabel` del listado — comprobar que
existe en el contexto; si no, derivarlo en `renderCalendar`).

### ASCII del gesto

```
┌── LUN ──────┬── MAR ──────┐        ┌─ diálogo ──────────────┐
│ 3        [+]│ 4        [+]│  clic  │ Nueva cita             │
│ ▎revisión   │             │  [+]   │ fecha: [2026-08-03]    │ ← precargada
│ ▎vacuna ────┼─────────────┤ ─────▶ │ motivo: [        ]     │
│  (clic tira:│             │        │ …                      │
│  ficha o    │             │        │ [Guardar]              │
│  edición)   │             │        └────────────────────────┘
```

## Qué NO entra

- Popover de lectura sobre la tira (v2 si se pide).
- Drag de tiras entre días (sería el simétrico del kanban; idea para el backlog).
- Cambios de backend, de estudio o de panel de config del bloque.

## Validación

- Tests del generador (vitest): `calendar.spec.ts` + spec nuevo del diálogo — asserts
  sobre el contenido emitido (botón solo con `features.edit`, expresiones de guardia,
  precarga, rama sin `detail`).
- Gate de oro: `/golden-diff` → diff SOLO en calendario y diálogo; re-baseline deliberado
  en commit propio.
- Demo veterinaria regenerada: crear cita desde el calendario y abrirla (typecheck + humo).
