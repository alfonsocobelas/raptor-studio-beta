import type { AggregateOp } from './aggregate-ops'
// Canonical app-schema format (spec 07, phase A of the visual editor vision).
// Declares how an app is composed — pages, order, widgets — with a vocabulary
// limited to what the app generator already emits (rule 7: never ahead of it).
// Pure TypeScript on purpose — this lib knows nothing about frameworks or tooling.

/** Ancho de un bloque dentro de su vista; dos `half` seguidos forman dos columnas (spec 53). */
export type BlockWidth = 'full' | 'half'

/**
 * Operadores con los que un KPI puede condicionar su conteo (spec 70). Son EXACTAMENTE los que
 * el filtro del listado sabe aplicar (`FilterOperator` del emitido): el panel no inventa
 * comparaciones que la API no pueda resolver.
 */
export type KpiOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'starts_with' | 'ends_with'

/**
 * Medida del KPI. `count` sale del listado; el resto exige el endpoint `aggregate` (spec 71) y un
 * campo sobre el que medir. Es EL catálogo de operaciones: dos uniones iguales con dos nombres ya
 * es una deriva esperando fecha (revisión specs 70-72).
 */
export type KpiMeasure = AggregateOp

/** Ventana temporal relativa; `days` solo acompaña al preset homónimo. */
export type KpiWindowPreset = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'days'

export interface KpiCondition {
  field: string
  operator: KpiOperator
  value: string
}

export interface KpiWindow {
  /** Campo fecha sobre el que se acota la ventana */
  field: string
  preset: KpiWindowPreset
  /** Longitud en días; obligatoria (y solo válida) con preset 'days' */
  days?: number
}

/**
 * Una celda de la fila de KPIs (spec 73): las variantes analíticas de siempre, sin `width` — el
 * ancho es de la FILA; dentro, cada tipo ocupa su span (tarjetas 1, gráficas 2). `counter` es el
 * total de un recurso con su tarjeta (la emisión histórica de `metrics`, celda a celda).
 */
export type KpiRowCell =
  | { kind: 'counter'; resource: string }
  | Omit<Extract<DashboardBlock, { kind: 'kpi' }>, 'width'>
  | Omit<Extract<DashboardBlock, { kind: 'top-n' }>, 'width'>
  | Omit<Extract<DashboardBlock, { kind: 'count-by' }>, 'width'>
  | Omit<Extract<DashboardBlock, { kind: 'series' }>, 'width'>

/**
 * Un bloque del panel. El panel es una SECUENCIA de bloques como cualquier otra vista (ADR-009,
 * spec 53): el orden y el ancho salen del dibujo, y una capacidad nueva es un `kind` más — nunca
 * un cajón más al lado de otro. Sustituye a los widgets y a la ranura `tables` de la spec 52.
 */
export type DashboardBlock =
  /**
   * Fila de celdas analíticas mixtas (spec 73): contador, KPI, Top N, Barras y Evolución
   * conviviendo en una misma línea. Es EL formato de la familia; los kinds sueltos de abajo se
   * siguen leyendo y `normalizeDashboardBlocks` los envuelve en filas de una celda.
   */
  | { kind: 'kpi-row'; cells: KpiRowCell[]; width?: BlockWidth }
  /** @deprecated spec 73: usa `kpi-row` con celdas `counter`. Se sigue leyendo. */
  | { kind: 'metrics'; resources: string[]; width?: BlockWidth }
  /**
   * Una barra por valor del enum (spec 32). Con `measure` distinta de `count` la barra enseña una
   * MEDIDA y no un conteo (spec 72: lo que iba a ser un kind `sum-by`) — un cajón por combinación
   * es lo que la regla 7 prohíbe.
   */
  | {
      kind: 'count-by'
      resource: string
      field: string
      measure?: KpiMeasure
      /** Campo medido; obligatorio (y solo válido) cuando la medida no es `count` */
      measureField?: string
      label?: string
      width?: BlockWidth
    }
  /**
   * @deprecated spec 70: usa `kpi` con `condition`. Se sigue leyendo y `normalizeDashboardBlocks`
   * lo traduce, para no romper los app-schema y los diseños ya guardados.
   */
  | { kind: 'kpi-count'; resource: string; field: string; equals: string; label: string; width?: BlockWidth }
  /**
   * Tarjeta de un número (spec 70). Un solo kind con modificadores: `condition` acota QUÉ se
   * cuenta, `window` CUÁNDO, y `ratio`/`compare`/`target` son tres lecturas del mismo número
   * —porcentaje, variación y progreso—. Sin condición ni ventana es el total del recurso.
   */
  | {
      kind: 'kpi'
      resource: string
      label: string
      measure?: KpiMeasure
      /** Campo sobre el que se mide; obligatorio (y solo válido) cuando la medida no es `count` */
      field?: string
      condition?: KpiCondition
      window?: KpiWindow
      /** El valor sobre el total del recurso en la misma ventana, en porcentaje */
      ratio?: boolean
      /** Variación contra la ventana anterior de la misma longitud (exige `window`) */
      compare?: boolean
      /** Barra de progreso hacia este objetivo (excluyente con `ratio`) */
      target?: number
      /** Mini-serie de 12 meses dentro de la tarjeta (spec 72); exige la fecha de la ventana */
      sparkline?: boolean
      width?: BlockWidth
    }
  /** Lista corta ordenada por un campo: «Top 5 pedidos por importe» (spec 70). Una petición. */
  | {
      kind: 'top-n'
      resource: string
      /** Campo de orden; debe ser `query.sortable` */
      field: string
      n: number
      /** Campo mostrado como etiqueta de la fila; por defecto el del listado */
      labelField?: string
      dir?: 'asc' | 'desc'
      label?: string
      width?: BlockWidth
    }
  /**
   * Evolución mensual (últimos 12 meses) sobre un campo fecha filterable (spec 32). Con `measure`
   * distinta de `count` la serie enseña una MEDIDA por mes (spec 72: el kind `series-sum`).
   */
  | {
      kind: 'series'
      resource: string
      field: string
      measure?: KpiMeasure
      measureField?: string
      label?: string
      width?: BlockWidth
    }
  /** El listado del recurso, embebido: mismo componente, sin su cabecera de pantalla (spec 52) */
  | { kind: 'table'; resource: string; width?: BlockWidth }

export interface DashboardPage {
  kind: 'dashboard'
  /** Label del menú; por defecto 'Dashboard' */
  label?: string
  blocks: DashboardBlock[]
}

export interface ResourcePage {
  kind: 'resource'
  resource: string
  /** Label del menú; por defecto labels.plural del modelo */
  label?: string
}

/** Ficha de un registro: cabecera con estado, secciones de datos, métricas y adjuntos. */
export interface DetailPage {
  kind: 'detail'
  resource: string
  label?: string
}

/** Galería de tarjetas (una por registro) en vez de tabla. */
export interface CardsPage {
  kind: 'cards'
  resource: string
  label?: string
}

/** Cronograma: una barra por registro entre las fechas del period (spec 30). */
export interface GanttPage {
  kind: 'gantt'
  resource: string
  label?: string
}

/** Página-formulario: alta en `/{ruta}/formulario` y edición en `/{ruta}/formulario/:id` (spec 48). */
export interface FormPage {
  kind: 'form'
  resource: string
  label?: string
}

/** Calendario: una tira por registro en el día de su campo fecha (spec 59). */
export interface CalendarPage {
  kind: 'calendar'
  resource: string
  label?: string
}

/** Kanban: una columna por valor del enum y cada registro como tarjeta (spec 61). */
export interface KanbanPage {
  kind: 'kanban'
  resource: string
  label?: string
}

export type PageDefinition =
  | DashboardPage
  | ResourcePage
  | DetailPage
  | CardsPage
  | GanttPage
  | FormPage
  | CalendarPage
  | KanbanPage

/** Arquetipos que el GENERADOR sabe emitir hoy; el resto solo se puede diseñar. */
export const GENERABLE_PAGE_KINDS: PageDefinition['kind'][] = ['dashboard', 'resource', 'form']

/** Aspecto de la app emitida: el tema viste la app entera (spec 20). */
export interface ThemeDefinition {
  /** Id de un tema del catálogo (@raptor/schema THEMES) */
  id?: string
  /** @deprecated nombre que usó la spec 18; se sigue leyendo como alias de `id` */
  palette?: string
  /** Color de marca del cliente (#RRGGBB): deriva un tema COMPLETO con la receta del catálogo (fase 4) */
  seed?: string
}

/**
 * Puertos que ocupará la app al ejecutarse en local. Se declaran porque quien
 * genera casi siempre tiene otros proyectos abiertos: 3000 y 4200 rara vez están
 * libres, y dos demos vivas compartían la misma base (hallazgo 14).
 */
export interface PortsDefinition {
  api?: number
  web?: number
  postgres?: number
  postgresTest?: number
}

/**
 * Flujos de negocio (spec 28): diagramas de proceso que viajan con el diseño
 * y aterrizan como contexto en la app generada. NUNCA generan código —
 * mismo precedente que el brief: metadatos que la IA post-generación lee.
 */
export type FlowNodeKind = 'start' | 'step' | 'decision' | 'end'

export interface FlowNode {
  /** Único dentro del flujo; slug corto en kebab-case ('llega-pedido') */
  id: string
  kind: FlowNodeKind
  /** Lo que se lee dentro del nodo */
  text: string
  /** Recurso al que alude el paso; su existencia la valida la frontera, no defineApp */
  entity?: string
  /**
   * Estado en que queda `entity` al terminar el paso, con el valor del enum del modelo
   * ('in_progress'). Que ese valor exista lo valida la frontera, que sí conoce los
   * recursos. Es una anotación del mapa: NO emite máquina de estados (regla 7).
   */
  status?: string
  /**
   * Transición de la máquina de estados de `entity` que este paso ejecuta (spec 43, la
   * costura de la convergencia). Aquí solo viaja el nombre; que exista en la máquina del
   * recurso lo valida la frontera. La emisión que lo consume es la spec de convergencia.
   */
  transition?: string
}

export interface FlowEdge {
  from: string
  to: string
  /** Obligatoria en las salidas de una decisión ('sí', 'no', …) */
  label?: string
}

export interface BusinessFlow {
  name: string
  description?: string
  nodes: FlowNode[]
  edges: FlowEdge[]
}

/** Topes del contrato: el diseño se reenvía en cada turno del chat (mismo motivo que el brief). */
export const FLOW_LIMITS = {
  flows: 10,
  nodes: 30,
  edges: 60,
  name: 60,
  text: 120,
  label: 20,
  description: 300,
  status: 40,
  transition: 30
} as const

/**
 * Brief de negocio (spec 22): lo destila la IA de la conversación, lo corrige el usuario y viaja
 * con el diseño hasta aterrizar como CLAUDE.md en la app generada. NO genera código (regla 7):
 * es la memoria del negocio que el chat relee cada turno. Con topes porque se reenvía entero en
 * cada turno — sin ellos degrada el prompt con el uso.
 */
export interface BusinessBrief {
  /** Prosa: qué hace este negocio */
  business: string
  /** Reglas que la IA debe respetar al diseñar */
  rules?: string[]
  /** Jerga del cliente: cómo llama a las cosas */
  glossary?: { term: string; means: string }[]
}

/** Topes del brief: se reenvía en cada turno del chat (brainstorming 2026-08-03). */
export const BRIEF_LIMITS = {
  business: 1200,
  rules: 20,
  ruleLength: 240,
  glossary: 30,
  termLength: 40,
  /** brief de entidad (ResourceDefinition.brief) */
  entity: 500
} as const

export interface AppDefinition {
  schemaVersion: 1
  name: string
  theme?: ThemeDefinition
  /** Puertos locales; sin declarar se emiten los del esqueleto */
  ports?: PortsDefinition
  /** El orden de páginas gobierna nav, rutas y ruta por defecto (la primera) */
  pages: PageDefinition[]
  /** Procesos de negocio dibujados en el estudio; contexto, nunca fuente de código (spec 28) */
  flows?: BusinessFlow[]
  /** Contexto de negocio destilado del chat; documentación que viaja, nunca fuente de código */
  brief?: BusinessBrief
}
