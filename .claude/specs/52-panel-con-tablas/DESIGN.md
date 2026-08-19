# Diseño técnico: El panel admite tablas

> Requisitos aprobados en REQUIREMENTS.md. Decisión de origen: Alfonso, 2026-08-19.

---

## 0. La divergencia, dibujada

Hoy:

```
  LIENZO                                   EMITIDO
  ┌───────────────────────┐                ┌──────────────────┐
  │ Vista «Panel»         │                │ page: dashboard  │  ← solo widgets
  │  ├─ bloque kpis       │ ──────────────▶│  widgets: [...]  │
  │  └─ bloque table orden│ ──────┐        └──────────────────┘
  └───────────────────────┘       │        ┌──────────────────┐
  ┌───────────────────────┐       └───────▶│ page: resource   │  ← pantalla aparte,
  │ Vista «Órdenes»       │                │  orden (sin label)│    y sin título
  │  └─ bloque table orden│ ─ ─ ✗ descartada por `listed`      │
  └───────────────────────┘                └──────────────────┘
```

Después:

```
  ┌───────────────────────┐                ┌────────────────────────┐
  │ Vista «Panel»         │                │ page: dashboard        │
  │  ├─ bloque kpis       │ ──────────────▶│  widgets: [...]        │
  │  └─ bloque table orden│ ──────────────▶│  tables: ['orden']     │
  └───────────────────────┘                └────────────────────────┘
  ┌───────────────────────┐                ┌────────────────────────┐
  │ Vista «Órdenes»       │ ──────────────▶│ page: resource orden   │
  │  └─ bloque table orden│                │  label: 'Órdenes'      │
  └───────────────────────┘                └────────────────────────┘
```

## 1. Contrato (`@raptor/schema`)

```ts
export interface DashboardPage {
  kind: 'dashboard'
  label?: string
  widgets: PageWidget[]
  /** Listados que el panel muestra debajo de los widgets, en el orden dibujado (spec 52) */
  tables?: string[]
}
```

`defineApp` valida **forma**: kebab-case y sin repetidos dentro del mismo panel — exactamente lo
que ya hace con `widget.resource`. La **existencia** del recurso NO se valida aquí: es cosa de la
frontera (`validateDesign` / `buildAppFile`), que es quien conoce los recursos del diseño. No se
toca `GENERABLE_PAGE_KINDS`.

## 2. Frontera (`designPagesToAppPages`)

La clave del `listed` deja de ser `<kind>:<recurso>` y pasa a distinguir **dónde** aterriza:
`dashboard:<recurso>` para el listado embebido y `resource:<recurso>` para la pantalla propia. Así:

- una tabla en una vista con `kpis` va a `tables` del panel y **no** crea página de listado;
- la misma tabla en su propia vista sigue emitiendo su pantalla **con su título** (hoy se perdía);
- dos tablas del mismo recurso en la MISMA vista siguen colapsando en una (no hay nada que ganar).

El `titleTaken` deja de gobernar los listados del panel: el panel usa el título de la vista y el
listado embebido no lo necesita — no es una entrada de menú.

## 3. Emitido — el listado embebido

El componente de listado ya existe y es el que dibuja el lienzo (búsqueda + exportación + CRUD).
No se emite una tabla nueva: se **reutiliza** con la cabecera de pantalla apagada.

```ts
// <recurso>-list.component.ts (plantilla del generador de recurso)
/** Dentro del panel: la pantalla ya tiene su título, así que este no pinta el suyo. */
readonly embedded = input(false)
```

y en su plantilla, el bloque de cabecera (`h1` + entradilla + enlace a papelera) queda envuelto en
`@if (!embedded()) { … }`. Nada más cambia: filtros, orden, paginación, exportación, acciones por
rol y diálogos siguen exactamente igual — es el mismo componente.

El panel lo renderiza tras los widgets y las secciones analíticas, antes del hueco `@ai`:

```html
<app-ordenes-list [embedded]="true" />
<!-- @ai:begin dashboard-extra -->
```

Regla 8: la lista de imports, los selectores y el orden los calcula `generator.ts`; la plantilla
solo interpola.

## 4. Gate de oro

La app de oro **estrena panel con tabla**: su página `dashboard` declara el listado de `contract`.
Es la lección de la demo taller aplicada al gate — el oro solo protegía lo que ya salía. Cambia
`dashboard.component.ts`, el `nav.ts` (una entrada menos si la tabla vivía solo en el panel; en el
oro conviven, así que el menú no cambia) y el `<recurso>-list.component.ts` de los cuatro recursos
(la línea del `input` y el `@if`). Re-baseline consciente y comparado línea a línea.

Gate añadido: `npm run web:build` de la app emitida — un `input()` mal cableado no lo caza `tsc`.

## 5. Estudio

`generableHere` no cambia de respuesta para la tabla del panel (ahora sí es verdad). Lo que se
añade es el aviso de **duplicado en la misma vista**: dos tablas del mismo recurso en una vista
colapsan al emitir, así que el lienzo lo dice ahí mismo en vez de dejar creer que son dos.

## 6. Fuera

Tablas «top N», fichas/galerías/formularios en el panel, y reordenar widgets y listados entre sí
(el orden es: widgets, luego listados, luego el hueco `@ai`).
