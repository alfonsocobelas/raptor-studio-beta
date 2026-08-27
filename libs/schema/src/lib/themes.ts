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
  },
  {
    /**
     * «raptor»: la paleta del PROPIO estudio, bajada al emitido (spec 69). No es un tono con un
     * croma, y por eso necesitó `chromaByStep`/`hueByStep`: es un cálido cuyo croma sube al bajar
     * la luminancia —0.003 en el papel, 0.008 en el borde, 0.013 en el gris medio— y cuyo tono se
     * mueve entre 63 y 85. Con un croma único no había valor bueno (a 0.003 el borde sale neutro;
     * a 0.008 el papel se recorta contra sRGB y sale blanco).
     *
     * Los valores son los de `apps/studio/apps/frontend-app/src/styles.css`, y el test los LEE de
     * ahí en vez de copiarlos: si la casa se recalibra y nadie lo baja aquí, la suite lo canta.
     *
     * El CTA dominante es TINTA y el naranja de marca vive en `ring`: el estudio reserva el
     * naranja a un acento por pantalla, y ese acento lo pone la piel (`taller`, `banco`, `rotulo`).
     */
    id: 'raptor',
    label: 'Raptor (la casa)',
    surface: {
      // semillas de respaldo: todos los escalones que se usan declaran las suyas
      chroma: 0.005,
      hue: 70,
      ramp: {
        page: 0.985,
        subtle: 0.985,
        wash: 0.962,
        line: 0.918,
        dim: 0.56,
        deep: 0.215,
        ink: 0.215,
        night: 0.19,
        slate: 0.245,
        raised: 0.3,
        faint: 0.72
      },
      chromaByStep: {
        page: 0.003,
        subtle: 0.003,
        wash: 0.006,
        line: 0.008,
        dim: 0.013,
        deep: 0.005,
        ink: 0.005,
        night: 0.004,
        slate: 0.005,
        raised: 0.006,
        faint: 0.011
      },
      hueByStep: {
        page: 85,
        subtle: 85,
        wash: 75,
        line: 74,
        dim: 63,
        deep: 68,
        ink: 68,
        night: 68,
        slate: 70,
        raised: 70,
        faint: 70
      },
      // la tarjeta, blanca sobre el papel cálido: es lo que le da relieve
      untinted: [...TINTED.untinted]
    },
    light: {
      primary: 'oklch(0.215 0.005 68)',
      primaryForeground: 'oklch(0.985 0.003 85)',
      ring: 'oklch(0.656 0.197 32)',
      sidebarPrimary: 'oklch(0.215 0.005 68)',
      sidebarPrimaryForeground: 'oklch(0.985 0.003 85)'
    },
    dark: {
      // en oscuro la tinta no contrasta: el CTA se invierte a papel, como en el estudio
      primary: 'oklch(0.94 0.004 80)',
      primaryForeground: 'oklch(0.215 0.005 68)',
      ring: 'oklch(0.7 0.19 33)',
      sidebarPrimary: 'oklch(0.985 0.003 85)',
      sidebarPrimaryForeground: 'oklch(0.215 0.005 68)'
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
