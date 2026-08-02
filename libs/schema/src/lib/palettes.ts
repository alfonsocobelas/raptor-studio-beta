/**
 * Catálogo CERRADO de paletas (spec 18). Es el vocabulario común del estudio
 * (previsualización en el lienzo) y del generador (tokens emitidos en
 * styles.css), para que lo que ves sea lo que se genera.
 *
 * Una paleta tiñe SOLO el color de acción: fondos, bordes y textos siguen
 * siendo los del tema. Elegir colores libres convertiría el lienzo en un
 * editor de temas, que no es lo que estamos construyendo.
 */
export interface PaletteTokens {
  primary: string
  primaryForeground: string
  ring: string
}

export interface Palette {
  id: string
  label: string
  light: PaletteTokens
  dark: PaletteTokens
}

export const PALETTES: Palette[] = [
  {
    id: 'neutral',
    label: 'Neutro',
    // exactamente lo que emite el esqueleto hoy: sin paleta, diff de oro intacto
    light: { primary: 'oklch(0.205 0 0)', primaryForeground: 'oklch(0.985 0 0)', ring: 'oklch(0.708 0 0)' },
    dark: { primary: 'oklch(0.922 0 0)', primaryForeground: 'oklch(0.205 0 0)', ring: 'oklch(0.556 0 0)' }
  },
  {
    id: 'hydrangea',
    label: 'Hortensia',
    light: { primary: 'oklch(0.53 0.16 285)', primaryForeground: 'oklch(0.99 0 0)', ring: 'oklch(0.62 0.13 286)' },
    dark: { primary: 'oklch(0.72 0.13 288)', primaryForeground: 'oklch(0.17 0 0)', ring: 'oklch(0.62 0.13 286)' }
  },
  {
    id: 'ocean',
    label: 'Océano',
    light: { primary: 'oklch(0.55 0.14 235)', primaryForeground: 'oklch(0.99 0 0)', ring: 'oklch(0.63 0.12 236)' },
    dark: { primary: 'oklch(0.72 0.12 236)', primaryForeground: 'oklch(0.17 0 0)', ring: 'oklch(0.63 0.12 236)' }
  },
  {
    id: 'forest',
    label: 'Bosque',
    light: { primary: 'oklch(0.52 0.13 155)', primaryForeground: 'oklch(0.99 0 0)', ring: 'oklch(0.6 0.11 156)' },
    dark: { primary: 'oklch(0.7 0.11 156)', primaryForeground: 'oklch(0.17 0 0)', ring: 'oklch(0.6 0.11 156)' }
  },
  {
    id: 'amber',
    label: 'Ámbar',
    light: { primary: 'oklch(0.62 0.15 65)', primaryForeground: 'oklch(0.2 0 0)', ring: 'oklch(0.7 0.13 66)' },
    dark: { primary: 'oklch(0.75 0.14 66)', primaryForeground: 'oklch(0.17 0 0)', ring: 'oklch(0.7 0.13 66)' }
  },
  {
    id: 'rose',
    label: 'Rosa',
    light: { primary: 'oklch(0.56 0.17 15)', primaryForeground: 'oklch(0.99 0 0)', ring: 'oklch(0.64 0.15 16)' },
    dark: { primary: 'oklch(0.7 0.14 16)', primaryForeground: 'oklch(0.17 0 0)', ring: 'oklch(0.64 0.15 16)' }
  }
]

export const PALETTE_IDS: string[] = PALETTES.map(p => p.id)

export function findPalette(id: string): Palette | undefined {
  return PALETTES.find(p => p.id === id)
}
