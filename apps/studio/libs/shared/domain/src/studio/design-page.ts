/**
 * Modelo de composición del lienzo (ADR-009): una VISTA es una secuencia de
 * BLOQUES. El usuario elige qué bloques, en qué orden y con qué ancho — nunca
 * coordenadas. Los «arquetipos» son presets de bloques, no tipos rígidos de
 * página: la tabla es un bloque más, tan opcional como los ficheros.
 */
export type BlockKind = 'table' | 'kpis' | 'fields' | 'cards' | 'attachments' | 'text'

export interface DesignBlock {
  kind: BlockKind
  /** Entidad que alimenta el bloque (todos menos `text`) */
  resource?: string
  /** Varios recursos para la fila de KPIs */
  resources?: string[]
  /** Texto de apoyo del bloque `text` */
  text?: string
  /** Ancho: completo o media fila (dos `half` seguidos forman dos columnas) */
  width?: 'full' | 'half'
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
  { id: 'blank', label: 'En blanco', icon: 'lucideSquareDashed', description: 'Vista vacía; añade los bloques que quieras', blocks: () => [] },
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
            { kind: 'kpis', resources: [resource], width: 'full' },
            { kind: 'table', resource, width: 'full' }
          ]
        : []
  }
]

/** Bloques que el GENERADOR sabe emitir hoy (el resto es solo diseño). */
/** Bloques que solo tienen sentido en la ficha de un registro. */
export const DETAIL_BLOCKS: BlockKind[] = ['fields', 'attachments']

export const GENERABLE_BLOCKS: BlockKind[] = ['table', 'kpis', 'fields', 'cards', 'attachments']
