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
}

export interface BlockPreset {
  id: string
  label: string
  icon: string
  description: string
  blocks: (resource?: string) => DesignBlock[]
}

/** Presets de vista: puntos de partida, todos editables después. */
export const VIEW_PRESETS: BlockPreset[] = [
  { id: 'blank', label: 'En blanco', icon: '▢', description: 'Vista vacía; añade los bloques que quieras', blocks: () => [] },
  {
    id: 'list',
    label: 'Listado',
    icon: '▦',
    description: 'Tabla con búsqueda, filtros y CRUD',
    blocks: resource => (resource ? [{ kind: 'table', resource, width: 'full' }] : [])
  },
  {
    id: 'detail',
    label: 'Ficha',
    icon: '🗂',
    description: 'Datos de un registro, métricas y adjuntos',
    blocks: resource =>
      resource
        ? [
            { kind: 'kpis', resources: [resource], width: 'full' },
            { kind: 'fields', resource, width: 'full' },
            { kind: 'attachments', resource, width: 'full' }
          ]
        : []
  },
  {
    id: 'gallery',
    label: 'Galería',
    icon: '▩',
    description: 'Una tarjeta por registro',
    blocks: resource => (resource ? [{ kind: 'cards', resource, width: 'full' }] : [])
  },
  {
    id: 'panel',
    label: 'Panel',
    icon: '▤',
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
export const GENERABLE_BLOCKS: BlockKind[] = ['table', 'kpis', 'fields', 'cards', 'attachments']
