/** Filas visibles antes de que la caja deje de crecer y empiece a hacer scroll. */
export const MAX_ROWS = 6

/** Si `line-height` no resuelve a px (p. ej. `normal`), asumimos el de `text-sm`. */
const FALLBACK_LINE_HEIGHT = 20

/** Lo que necesitamos de un KeyboardEvent para decidir (facilita el test sin DOM). */
export interface SubmitKey {
  key: string
  shiftKey: boolean
  isComposing: boolean
}

/** Enter envía; Shift+Enter mete salto de línea, igual que Claude Code. */
export function shouldSubmit(event: SubmitKey): boolean {
  return event.key === 'Enter' && !event.shiftKey && !event.isComposing
}

/**
 * Crece con el contenido hasta `maxRows` filas; el techo se calcula con el
 * line-height real, así que no se descuadra si cambia la tipografía o la piel.
 */
export function autosize(textarea: HTMLTextAreaElement, maxRows = MAX_ROWS): void {
  const lineHeight = parseFloat(getComputedStyle(textarea).lineHeight) || FALLBACK_LINE_HEIGHT
  textarea.style.maxHeight = `${lineHeight * maxRows}px`
  textarea.style.height = 'auto'
  textarea.style.height = `${textarea.scrollHeight}px`
}
