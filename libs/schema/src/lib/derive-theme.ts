/**
 * Un tema no se escribe token a token: se DERIVA (spec 20).
 *
 * Los valores neutros que emite el esqueleto ya son una escala de luminancias
 * con croma 0 y tono 0. Así que un tema declara pocas semillas —el croma y el
 * tono de las superficies, y los colores de acción— y esta función produce el
 * juego completo, en claro y en oscuro.
 *
 * El seguro contra romper lo ya generado: con croma 0 y tono 0, la derivación
 * reproduce el esqueleto carácter a carácter.
 */

/**
 * Escalones de luminancia compartidos por todos los temas. Son los de shadcn,
 * que es de donde viene el esqueleto; cambiarlos cambia TODAS las apps.
 */
export interface Ramp {
  base: number
  subtle: number
  wash: number
  line: number
  faint: number
  dim: number
  raised: number
  ink: number
  deep: number
}

export const DEFAULT_RAMP: Ramp = {
  base: 1,
  subtle: 0.985,
  wash: 0.97,
  line: 0.922,
  faint: 0.708,
  dim: 0.556,
  raised: 0.269,
  ink: 0.205,
  deep: 0.145
}

/** Colores que un tema decide, no deriva: son identidad, no escala. */
export interface ThemeAction {
  primary: string
  primaryForeground: string
  ring: string
  sidebarPrimary: string
  sidebarPrimaryForeground: string
}

export interface ThemeSurface {
  chroma: number
  hue: number
  /**
   * Retoques a la rampa. El caso real es `base`: en sRGB, con L=1 el croma
   * máximo es 0, así que un tema con color debe bajar su escalón más claro
   * (0.99) o su fondo saldrá blanco por mucho croma que declare.
   */
  ramp?: Partial<Ramp>
}

export interface Theme {
  surface: ThemeSurface
  light: ThemeAction
  dark: ThemeAction
  /** El rojo de error rara vez es de marca; por defecto, el de shadcn. */
  destructive?: { light: string; dark: string }
}

/**
 * Orden de los tokens en el fichero emitido. NO es cosmético: la fixture de oro
 * está congelada con este orden, así que cambiarlo rompe el gate.
 */
export const TOKEN_ORDER: string[] = [
  'background',
  'foreground',
  'card',
  'card-foreground',
  'popover',
  'popover-foreground',
  'primary',
  'primary-foreground',
  'secondary',
  'secondary-foreground',
  'muted',
  'muted-foreground',
  'accent',
  'accent-foreground',
  'destructive',
  'border',
  'input',
  'ring',
  'sidebar',
  'sidebar-foreground',
  'sidebar-primary',
  'sidebar-primary-foreground',
  'sidebar-accent',
  'sidebar-accent-foreground',
  'sidebar-border',
  'sidebar-ring'
]

export interface ThemeTokens {
  light: Record<string, string>
  dark: Record<string, string>
}

const DEFAULT_DESTRUCTIVE = {
  light: 'oklch(0.577 0.245 27.325)',
  dark: 'oklch(0.704 0.191 22.216)'
}

/**
 * Bordes y campos en oscuro son un VELO DE BLANCO, no un escalón de la rampa:
 * una línea teñida sobre fondo oscuro canta, y el velo es justamente lo que lo
 * evita. Por eso no se derivan.
 */
const DARK_BORDER = 'oklch(1 0 0 / 10%)'
const DARK_INPUT = 'oklch(1 0 0 / 15%)'

/** Qué escalón de la rampa ocupa cada superficie, en cada modo. */
const LIGHT_SURFACES: Record<string, keyof Ramp> = {
  background: 'base',
  foreground: 'deep',
  card: 'base',
  'card-foreground': 'deep',
  popover: 'base',
  'popover-foreground': 'deep',
  secondary: 'wash',
  'secondary-foreground': 'ink',
  muted: 'wash',
  'muted-foreground': 'dim',
  accent: 'wash',
  'accent-foreground': 'ink',
  border: 'line',
  input: 'line',
  sidebar: 'subtle',
  'sidebar-foreground': 'deep',
  'sidebar-accent': 'wash',
  'sidebar-accent-foreground': 'ink',
  'sidebar-border': 'line'
}

const DARK_SURFACES: Record<string, keyof Ramp> = {
  background: 'deep',
  foreground: 'subtle',
  card: 'ink',
  'card-foreground': 'subtle',
  popover: 'ink',
  'popover-foreground': 'subtle',
  secondary: 'raised',
  'secondary-foreground': 'subtle',
  muted: 'raised',
  'muted-foreground': 'faint',
  accent: 'raised',
  'accent-foreground': 'subtle',
  sidebar: 'ink',
  'sidebar-foreground': 'subtle',
  'sidebar-accent': 'raised',
  'sidebar-accent-foreground': 'subtle'
}

const oklch = (lightness: number, chroma: number, hue: number): string => `oklch(${lightness} ${chroma} ${hue})`

const surfaceTokens = (
  roles: Record<string, keyof Ramp>,
  ramp: Ramp,
  surface: ThemeSurface
): Record<string, string> => {
  const tokens: Record<string, string> = {}
  for (const [token, step] of Object.entries(roles)) {
    tokens[token] = oklch(ramp[step], surface.chroma, surface.hue)
  }
  return tokens
}

const actionTokens = (action: ThemeAction): Record<string, string> => ({
  primary: action.primary,
  'primary-foreground': action.primaryForeground,
  ring: action.ring,
  'sidebar-primary': action.sidebarPrimary,
  'sidebar-primary-foreground': action.sidebarPrimaryForeground,
  'sidebar-ring': action.ring
})

export function deriveTheme(theme: Theme): ThemeTokens {
  // copia: un tema que retoca la rampa no puede contaminar a los demás
  const ramp: Ramp = { ...DEFAULT_RAMP, ...theme.surface.ramp }
  const destructive = theme.destructive ?? DEFAULT_DESTRUCTIVE

  return {
    light: {
      ...surfaceTokens(LIGHT_SURFACES, ramp, theme.surface),
      ...actionTokens(theme.light),
      destructive: destructive.light
    },
    dark: {
      ...surfaceTokens(DARK_SURFACES, ramp, theme.surface),
      ...actionTokens(theme.dark),
      destructive: destructive.dark,
      border: DARK_BORDER,
      input: DARK_INPUT,
      'sidebar-border': DARK_BORDER
    }
  }
}
