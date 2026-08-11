import type { DesignPage } from '@app/shared/domain'

/**
 * El icono de una vista sale de lo que TIENE, no de cómo se creó: un panel de
 * KPIs no es una tabla, y una vista en blanco no debe fingir contenido. Con
 * tabla manda la tabla, que es lo que domina la pantalla emitida.
 */
export function viewIcon(page: DesignPage): string {
  if (page.drillDown) return 'lucideIdCard'

  const kinds = new Set(page.blocks.map(block => block.kind))
  if (kinds.has('table')) return 'lucideTable'
  if (kinds.has('cards')) return 'lucideLayoutGrid'
  if (kinds.has('kpis')) return 'lucideChartNoAxesColumn'
  if (kinds.has('fields')) return 'lucideIdCard'
  if (kinds.has('attachments')) return 'lucidePaperclip'
  return 'lucideSquareDashed'
}
