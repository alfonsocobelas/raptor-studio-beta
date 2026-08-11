import type { StudioMode } from '../design/studio-modes'

/**
 * Lo que el chat sugiere en cada modo: se le habla de lo que se está mirando, así
 * que la pista cambia con el lienzo. Un modo sin pista dejaría el chat mudo, y el
 * test lo exige para todos.
 */
const PLACEHOLDERS: Record<StudioMode, string> = {
  views: '«pon los KPIs en dos columnas y sube la tabla»',
  model: '«añade caducidad a productos»',
  flows: '«al crear un pedido, avisa al almacén»',
  access: '«el almacén solo ve sus movimientos»'
}

export function chatPlaceholder(mode: StudioMode): string {
  return PLACEHOLDERS[mode]
}
