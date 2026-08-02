import { Theme } from './derive-theme'
import { ThemeDefinition } from './app-types'

/**
 * Catálogo CERRADO de temas (spec 20). Es el vocabulario común del estudio
 * (previsualización en el lienzo) y del generador (tokens emitidos en
 * styles.css), para que lo que ves sea lo que se genera.
 *
 * Sustituye al catálogo de paletas de la spec 18, que solo teñía el color de
 * acción y dejaba fondos, tarjetas y bordes en gris. Aquí un tema viste la app
 * entera: las superficies llevan el tono, no solo el botón.
 *
 * Los ids se conservan para no invalidar las apps ya generadas.
 */
export interface NamedTheme extends Theme {
  id: string
  label: string
}

/**
 * Croma de las superficies. Bajo a propósito —un fondo con el croma del botón no
 * es un tema, es un flúor— pero no tanto como para perderse: 0.016 es lo que
 * cabe en sRGB a la luminancia de la página teñida.
 */
const SURFACE_CHROMA = 0.016

/**
 * Escalones claros de un tema con color. Bajan respecto al neutro porque el
 * gamut sRGB no admite croma arriba: a L=1 el máximo es 0 y a L=0.99 es 0.005,
 * así que un tono declarado ahí se recorta y la superficie sale blanca.
 *
 * `base` se queda en 1 y sin teñir: la tarjeta es blanca y la página lleva el
 * tono, que es lo que le da relieve.
 */
const TINTED = {
  ramp: { page: 0.965, subtle: 0.955, wash: 0.93, line: 0.89 },
  untinted: ['base'] as const
}

export const THEMES: NamedTheme[] = [
  {
    id: 'neutral',
    label: 'Neutro',
    // croma 0: reproduce el esqueleto carácter a carácter, diff de oro intacto
    surface: { chroma: 0, hue: 0 },
    light: {
      primary: 'oklch(0.205 0 0)',
      primaryForeground: 'oklch(0.985 0 0)',
      ring: 'oklch(0.708 0 0)',
      sidebarPrimary: 'oklch(0.205 0 0)',
      sidebarPrimaryForeground: 'oklch(0.985 0 0)'
    },
    dark: {
      primary: 'oklch(0.922 0 0)',
      primaryForeground: 'oklch(0.205 0 0)',
      ring: 'oklch(0.556 0 0)',
      sidebarPrimary: 'oklch(0.985 0 0)',
      sidebarPrimaryForeground: 'oklch(0.205 0 0)'
    }
  },
  {
    id: 'hydrangea',
    label: 'Hortensia',
    surface: { chroma: SURFACE_CHROMA, hue: 286, ramp: TINTED.ramp, untinted: [...TINTED.untinted] },
    light: {
      primary: 'oklch(0.53 0.16 285)',
      primaryForeground: 'oklch(0.99 0 0)',
      ring: 'oklch(0.62 0.13 286)',
      sidebarPrimary: 'oklch(0.53 0.16 285)',
      sidebarPrimaryForeground: 'oklch(0.99 0 0)'
    },
    dark: {
      primary: 'oklch(0.72 0.13 288)',
      primaryForeground: 'oklch(0.17 0 0)',
      ring: 'oklch(0.62 0.13 286)',
      sidebarPrimary: 'oklch(0.72 0.13 288)',
      sidebarPrimaryForeground: 'oklch(0.17 0 0)'
    }
  },
  {
    id: 'ocean',
    label: 'Océano',
    surface: { chroma: SURFACE_CHROMA, hue: 236, ramp: TINTED.ramp, untinted: [...TINTED.untinted] },
    light: {
      primary: 'oklch(0.55 0.14 235)',
      primaryForeground: 'oklch(0.99 0 0)',
      ring: 'oklch(0.63 0.12 236)',
      sidebarPrimary: 'oklch(0.55 0.14 235)',
      sidebarPrimaryForeground: 'oklch(0.99 0 0)'
    },
    dark: {
      primary: 'oklch(0.72 0.12 236)',
      primaryForeground: 'oklch(0.17 0 0)',
      ring: 'oklch(0.63 0.12 236)',
      sidebarPrimary: 'oklch(0.72 0.12 236)',
      sidebarPrimaryForeground: 'oklch(0.17 0 0)'
    }
  },
  {
    id: 'forest',
    label: 'Bosque',
    surface: { chroma: SURFACE_CHROMA, hue: 156, ramp: TINTED.ramp, untinted: [...TINTED.untinted] },
    light: {
      primary: 'oklch(0.52 0.13 155)',
      primaryForeground: 'oklch(0.99 0 0)',
      ring: 'oklch(0.6 0.11 156)',
      sidebarPrimary: 'oklch(0.52 0.13 155)',
      sidebarPrimaryForeground: 'oklch(0.99 0 0)'
    },
    dark: {
      primary: 'oklch(0.7 0.11 156)',
      primaryForeground: 'oklch(0.17 0 0)',
      ring: 'oklch(0.6 0.11 156)',
      sidebarPrimary: 'oklch(0.7 0.11 156)',
      sidebarPrimaryForeground: 'oklch(0.17 0 0)'
    }
  },
  {
    id: 'amber',
    label: 'Ámbar',
    surface: { chroma: SURFACE_CHROMA, hue: 75, ramp: TINTED.ramp, untinted: [...TINTED.untinted] },
    light: {
      primary: 'oklch(0.62 0.15 65)',
      primaryForeground: 'oklch(0.2 0 0)',
      ring: 'oklch(0.7 0.13 66)',
      sidebarPrimary: 'oklch(0.62 0.15 65)',
      sidebarPrimaryForeground: 'oklch(0.2 0 0)'
    },
    dark: {
      primary: 'oklch(0.75 0.14 66)',
      primaryForeground: 'oklch(0.17 0 0)',
      ring: 'oklch(0.7 0.13 66)',
      sidebarPrimary: 'oklch(0.75 0.14 66)',
      sidebarPrimaryForeground: 'oklch(0.17 0 0)'
    }
  },
  {
    id: 'rose',
    label: 'Rosa',
    surface: { chroma: SURFACE_CHROMA, hue: 16, ramp: TINTED.ramp, untinted: [...TINTED.untinted] },
    light: {
      primary: 'oklch(0.56 0.17 15)',
      primaryForeground: 'oklch(0.99 0 0)',
      ring: 'oklch(0.64 0.15 16)',
      sidebarPrimary: 'oklch(0.56 0.17 15)',
      sidebarPrimaryForeground: 'oklch(0.99 0 0)'
    },
    dark: {
      primary: 'oklch(0.7 0.14 16)',
      primaryForeground: 'oklch(0.17 0 0)',
      ring: 'oklch(0.64 0.15 16)',
      sidebarPrimary: 'oklch(0.7 0.14 16)',
      sidebarPrimaryForeground: 'oklch(0.17 0 0)'
    }
  }
]

export const DEFAULT_THEME_ID = 'neutral'

export const THEME_IDS: string[] = THEMES.map(t => t.id)

export function findTheme(id: string): NamedTheme | undefined {
  return THEMES.find(t => t.id === id)
}

/**
 * Qué tema pide una app. `palette` es el nombre que usó la spec 18 y se sigue
 * leyendo: las apps generadas entonces no tienen por qué dejar de valer.
 */
export function resolveThemeId(theme: ThemeDefinition | undefined): string {
  return theme?.id ?? theme?.palette ?? DEFAULT_THEME_ID
}
