import type { PreviewTheme } from './preview-settings'

/** Los dos colores de la marca; en noche cambian de sitio, no de valor. */
const INK = '#1b1917'
const BRAND = '#f15539'

export interface ProductMarkColors {
  background: string
  letter: string
}

/**
 * La marca se dibuja invertida en noche: sobre un chrome oscuro una pastilla
 * negra se pierde, así que la pastilla toma el naranja y la R se pone en negro.
 */
export function productMark(theme: PreviewTheme): ProductMarkColors {
  return theme === 'dark' ? { background: BRAND, letter: INK } : { background: INK, letter: BRAND }
}
