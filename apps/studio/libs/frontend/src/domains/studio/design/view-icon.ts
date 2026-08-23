import type { DesignBlock, DesignPage } from '@app/shared/domain'

/** Un icono por tipo de bloque; el orden de la vista decide cuál se usa. */
const ICONS: Partial<Record<DesignBlock['kind'], string>> = {
  table: 'lucideTable',
  cards: 'lucideLayoutGrid',
  kpis: 'lucideChartNoAxesColumn',
  fields: 'lucideIdCard',
  attachments: 'lucidePaperclip',
  form: 'lucideClipboardList',
  calendar: 'lucideCalendar',
  kanban: 'lucideSquareKanban'
}

/**
 * El icono de una vista sale de su PRIMER bloque, que es lo que domina arriba:
 * un panel (KPIs y listado debajo) se ve como KPIs, no como tabla, y un listado
 * con métricas al pie sigue siendo un listado. La ficha es la excepción, porque
 * lo que la define es cómo se llega a ella. Una vista vacía no finge contenido.
 */
export function viewIcon(page: DesignPage): string {
  if (page.drillDown) return 'lucideIdCard'

  for (const block of page.blocks) {
    const icon = ICONS[block.kind]
    if (icon) return icon
  }
  return 'lucideSquareDashed'
}
