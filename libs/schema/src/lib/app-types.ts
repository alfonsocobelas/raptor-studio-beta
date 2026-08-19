// Canonical app-schema format (spec 07, phase A of the visual editor vision).
// Declares how an app is composed — pages, order, widgets — with a vocabulary
// limited to what the app generator already emits (rule 7: never ahead of it).
// Pure TypeScript on purpose — this lib knows nothing about frameworks or tooling.

export interface KpiTotalWidget {
  kind: 'kpi-total'
  /** Recurso cuyo total muestra la tarjeta (su existencia la valida el generador) */
  resource: string
}

/** Una barra por valor del enum, con su conteo (spec 32). Exige campo enum filterable. */
export interface CountByWidget {
  kind: 'count-by'
  resource: string
  field: string
  /** Título del widget; por defecto, el label del campo */
  label?: string
}

/** Tarjeta KPI con un conteo condicionado: cuántos cumplen field = equals (spec 32). */
export interface KpiCountWidget {
  kind: 'kpi-count'
  resource: string
  field: string
  equals: string
  label: string
}

/** Evolución mensual de altas (últimos 12 meses) sobre un campo fecha filterable (spec 32). */
export interface SeriesWidget {
  kind: 'series'
  resource: string
  field: string
  label?: string
}

export type PageWidget = KpiTotalWidget | CountByWidget | KpiCountWidget | SeriesWidget

export interface DashboardPage {
  kind: 'dashboard'
  /** Label del menú; por defecto 'Dashboard' */
  label?: string
  widgets: PageWidget[]
  /**
   * Listados que el panel muestra DEBAJO de los widgets, en el orden dibujado (spec 52). Un panel
   * de negocio es métricas arriba y lo que importa debajo; sin esto la tabla que el diseñador
   * suelta en la vista del panel acababa como una pantalla aparte.
   */
  tables?: string[]
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

export type PageDefinition = DashboardPage | ResourcePage | DetailPage | CardsPage | GanttPage | FormPage

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
