/** Los modos de primer nivel del estudio, en el orden en que se pintan en la barra. */
export type StudioMode = 'views' | 'model' | 'flows' | 'access'

export interface StudioModeTab {
  mode: StudioMode
  label: string
}

/**
 * La navegación de la barra superior. El orden es el del producto (la vista es
 * lo primero que se toca), y los ids no se renombran: `mode-<mode>` es el
 * data-testid que consumen los smoke tools.
 */
export const STUDIO_MODES: readonly StudioModeTab[] = [
  { mode: 'views', label: 'Vistas' },
  { mode: 'model', label: 'Modelo' },
  { mode: 'flows', label: 'Flujos' },
  { mode: 'access', label: 'Accesos' }
]
