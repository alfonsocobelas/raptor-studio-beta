/**
 * Modelo de composición del lienzo (ADR-009): una VISTA es una secuencia de
 * BLOQUES. El usuario elige qué bloques, en qué orden y con qué ancho — nunca
 * coordenadas. Los «arquetipos» son presets de bloques, no tipos rígidos de
 * página: la tabla es un bloque más, tan opcional como los ficheros.
 */
export type BlockKind = 'table' | 'kpis' | 'fields' | 'cards' | 'attachments' | 'text' | 'form' | 'calendar' | 'kanban'

/**
 * Tipos de celda de la fila de KPIs (spec 73). La familia analítica ya no son bloques sueltos:
 * son celdas que conviven en una misma línea. `counter` es el total del recurso con su tarjeta
 * (los antiguos `resources` del bloque).
 */
export type KpiCellKind = 'counter' | 'kpi' | 'top-n' | 'count-by' | 'series'

/**
 * Una celda de la fila. Campos PLANOS, doctrina de la spec 70: el autosave parchea y el JSON se
 * lee de un vistazo; la frontera los ensambla en los objetos anidados del app-schema. Cada tipo
 * usa su grupo de campos y `counter` no usa ninguno.
 */
export interface KpiCell {
  kind: KpiCellKind
  /** Entidad que alimenta la celda */
  resource: string
  /** Etiqueta de la tarjeta (kpi, top-n, count-by y series) */
  kpiLabel?: string
  /** Medida del kpi (spec 71): 'count' o una agregación sobre `kpiField` */
  kpiMeasure?: string
  kpiField?: string
  /** Condición: qué se cuenta. Los tres van juntos o no van ninguno */
  kpiConditionField?: string
  kpiConditionOperator?: string
  kpiConditionValue?: string
  /** Ventana: cuándo. El campo es una fecha del recurso */
  kpiWindowField?: string
  kpiWindowPreset?: string
  kpiWindowDays?: number
  /** El valor como porcentaje del total del recurso en la misma ventana */
  kpiRatio?: boolean
  /** Variación contra la ventana anterior (exige ventana) */
  kpiCompare?: boolean
  /** Objetivo de la barra de progreso (excluyente con kpiRatio) */
  kpiTarget?: number
  /** Mini-serie de 12 meses dentro de la tarjeta (spec 72); exige la ventana */
  kpiSparkline?: boolean
  /**
   * Barras y serie (spec 72): el EJE del desglose —un enum en las barras, una fecha en la serie— y
   * la medida que enseñan. Sin medida cuentan registros.
   */
  axisField?: string
  measure?: string
  measureField?: string
  /** Top N (spec 70): campo de orden, cuántas filas, qué se muestra y en qué sentido */
  topField?: string
  topN?: number
  topLabelField?: string
  topDir?: 'asc' | 'desc'
}

export interface DesignBlock {
  kind: BlockKind
  /** Entidad que alimenta el bloque (todos menos `text` y `kpis`) */
  resource?: string
  /**
   * @deprecated spec 73: formato viejo de la fila de contadores. Se sigue leyendo y
   * `normalizeDesignPages` lo convierte en celdas `counter`; el estudio ya no lo escribe.
   */
  resources?: string[]
  /** Celdas de la fila de KPIs (spec 73); solo el bloque `kpis` las usa */
  items?: KpiCell[]
  /** Texto de apoyo del bloque `text` */
  text?: string
  /** Ancho: completo o media fila (dos `half` seguidos forman dos columnas) */
  width?: 'full' | 'half'
  /** Calendario (spec 59): campo fecha que coloca cada registro en su día */
  dateField?: string
  /** Calendario: campo mostrado en la tira */
  labelField?: string
  /** Calendario: campo enum que colorea la tira */
  colorField?: string
  /** Calendario: mostrar SÁB/DOM (por defecto true) */
  weekends?: boolean
  /** Kanban (spec 61): campo enum cuyos valores son las columnas */
  columnsField?: string
}

export interface DesignPage {
  title: string
  blocks: DesignBlock[]
  /**
   * Vista a la que se LLEGA desde otra (la ficha de un registro), no una
   * entrada de menú. El generador la emite en `<ruta>/:id`, así que dibujarla
   * apilada bajo el listado haría que el lienzo mintiera sobre el resultado.
   */
  drillDown?: boolean
}

export interface BlockPreset {
  id: string
  label: string
  /** El preset crea una vista de detalle (no aparece en el menú) */
  drillDown?: boolean
  /** Nombre del icono lucide (el MISMO set que emite la app generada) */
  icon: string
  description: string
  blocks: (resource?: string) => DesignBlock[]
}

/** Presets de vista: puntos de partida, todos editables después. */
export const VIEW_PRESETS: BlockPreset[] = [
  {
    id: 'blank',
    label: 'En blanco',
    icon: 'lucideSquareDashed',
    description: 'Vista vacía; añade los bloques que quieras',
    blocks: () => []
  },
  {
    id: 'list',
    label: 'Listado',
    icon: 'lucideTable',
    description: 'Tabla con búsqueda, filtros y CRUD',
    blocks: resource => (resource ? [{ kind: 'table', resource, width: 'full' }] : [])
  },
  {
    id: 'detail',
    label: 'Ficha',
    icon: 'lucideIdCard',
    description: 'Datos de un registro y sus ficheros (se abre desde el listado)',
    drillDown: true,
    blocks: resource =>
      resource
        ? [
            { kind: 'fields', resource, width: 'full' },
            { kind: 'attachments', resource, width: 'full' }
          ]
        : []
  },
  {
    id: 'gallery',
    label: 'Galería',
    icon: 'lucideLayoutGrid',
    description: 'Una tarjeta por registro',
    blocks: resource => (resource ? [{ kind: 'cards', resource, width: 'full' }] : [])
  },
  {
    id: 'panel',
    label: 'Panel',
    icon: 'lucideLayoutDashboard',
    description: 'Métricas arriba y listado debajo',
    blocks: resource =>
      resource
        ? [
            { kind: 'kpis', items: [{ kind: 'counter', resource }], width: 'full' },
            { kind: 'table', resource, width: 'full' }
          ]
        : []
  }
]

/** Bloques que el GENERADOR sabe emitir hoy (el resto es solo diseño). */
/** Bloques que solo tienen sentido en la ficha de un registro. */
export const DETAIL_BLOCKS: BlockKind[] = ['fields', 'attachments']

export const GENERABLE_BLOCKS: BlockKind[] = [
  'table',
  'kpis',
  'fields',
  'cards',
  'attachments',
  'form',
  'calendar',
  'kanban'
]

/**
 * ¿El generador emite ESTE bloque en ESTA vista? La generabilidad no es solo del
 * tipo: los datos y los ficheros de un registro se emiten dentro de la pantalla
 * de ficha, así que en un listado o un panel son diseño y nada más. El lienzo lo
 * marca ahí mismo en vez de mover el bloque a otra vista a espaldas de quien lo
 * suelta (2026-08-12: eso se leía como «me ha borrado la tabla»).
 */
export function generableHere(page: DesignPage, block: DesignBlock): boolean {
  if (!GENERABLE_BLOCKS.includes(block.kind)) return false
  return !DETAIL_BLOCKS.includes(block.kind) || page.drillDown === true
}

/**
 * ¿Esta celda cruza la frontera? Es la MISMA regla que aplica design-to-app al emitir (spec 73):
 * la celda incompleta —top-n sin orden, gráfica sin eje, medida sin campo— no se falsea, se
 * etiqueta en el lienzo y se omite al generar.
 */
export function generableCell(cell: KpiCell): boolean {
  if (!cell.resource) return false
  if (cell.kind === 'top-n') return Boolean(cell.topField)
  if (cell.kind === 'count-by' || cell.kind === 'series') return Boolean(cell.axisField)
  if (cell.kind === 'kpi') return !(cell.kpiMeasure && cell.kpiMeasure !== 'count' && !cell.kpiField)
  return true
}

/**
 * ¿Este bloque repite uno anterior de la MISMA vista? La frontera colapsa dos bloques del
 * mismo tipo y recurso en una sola pantalla (o en un solo listado del panel), así que el
 * segundo no aporta nada y el lienzo lo dice ahí mismo (spec 52). Repetir la tabla en OTRA
 * vista no es duplicado: son dos sitios legítimos — el panel y su pantalla.
 */
export function duplicateOfEarlierBlock(page: DesignPage, index: number): boolean {
  const block = page.blocks[index]
  if (!block?.resource) return false

  return page.blocks.slice(0, index).some(earlier => earlier.kind === block.kind && earlier.resource === block.resource)
}
