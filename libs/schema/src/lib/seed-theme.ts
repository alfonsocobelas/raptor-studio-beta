import type { NamedTheme } from './themes'

/**
 * Tema completo derivado del color de marca del cliente (spec 20, fase 4).
 *
 * Del color solo se toma el TONO: el croma y la luz de cada pieza los fija la misma receta que el
 * catálogo (los escalones de hortensia/océano), porque el hex corporativo a pelo suele ser un flúor
 * que ni cabe en el gamut a la luminancia de un botón ni sostiene una página teñida. El resultado
 * es «el tema que un diseñador habría hecho con ese azul», no «ese azul por todas partes».
 */

const HEX = /^#?([0-9a-fA-F]{6})$/

/** Croma de las superficies del catálogo: bajo a propósito (un fondo flúor no es un tema). */
const SURFACE_CHROMA = 0.016

/** Escalones claros de los temas teñidos del catálogo (ver themes.ts). */
const TINTED_RAMP = { page: 0.965, subtle: 0.955, wash: 0.93, line: 0.89 }

/**
 * La receta de acción, medida del catálogo: primaria clara L .53 (hortensia .53, océano .55),
 * oscura L .72 (ambos), ring L .62. Los cromas son techos: se recortan hasta caber en sRGB.
 */
const RECIPE = {
  light: { l: 0.53, chroma: 0.16 },
  dark: { l: 0.72, chroma: 0.13 },
  ring: { l: 0.62, chroma: 0.13 }
}

export function seedTheme(seed: string): NamedTheme {
  const match = HEX.exec(seed.trim())
  if (!match) {
    throw new Error(`theme.seed: '${seed}' is not a hex colour (expected #RRGGBB)`)
  }
  const hex = match[1].toLowerCase()
  const hue = hexToOklchHue(hex)

  const light = fitChroma(RECIPE.light.l, RECIPE.light.chroma, hue)
  const dark = fitChroma(RECIPE.dark.l, RECIPE.dark.chroma, hue)
  const ring = fitChroma(RECIPE.ring.l, RECIPE.ring.chroma, hue)

  const lightPrimary = oklch(RECIPE.light.l, light, hue)
  const darkPrimary = oklch(RECIPE.dark.l, dark, hue)
  const ringColor = oklch(RECIPE.ring.l, ring, hue)

  return {
    id: `seed-${hex}`,
    label: `Marca #${hex}`,
    surface: { chroma: SURFACE_CHROMA, hue, ramp: TINTED_RAMP, untinted: ['base'] },
    light: {
      primary: lightPrimary,
      primaryForeground: 'oklch(0.99 0 0)',
      ring: ringColor,
      sidebarPrimary: lightPrimary,
      sidebarPrimaryForeground: 'oklch(0.99 0 0)'
    },
    dark: {
      primary: darkPrimary,
      primaryForeground: 'oklch(0.17 0 0)',
      ring: ringColor,
      sidebarPrimary: darkPrimary,
      sidebarPrimaryForeground: 'oklch(0.17 0 0)'
    }
  }
}

const oklch = (l: number, chroma: number, hue: number): string => `oklch(${round(l)} ${round(chroma)} ${round(hue)})`

const round = (value: number): number => Math.round(value * 1000) / 1000

/** Baja el croma hasta que el color cabe en sRGB a esa luminancia: recortar pinta gris. */
function fitChroma(l: number, target: number, hue: number): number {
  let chroma = target
  while (chroma > 0 && !insideSrgb(l, chroma, hue)) {
    chroma -= 0.005
  }
  return Math.max(chroma, 0)
}

// ── Matemática de color (matrices de Björn Ottosson, https://bottosson.github.io/posts/oklab/) ──

function hexToOklchHue(hex: string): number {
  const [r, g, b] = [0, 2, 4].map(i => toLinearChannel(parseInt(hex.slice(i, i + 2), 16) / 255))

  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)

  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
  const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s

  // un gris de marca no tiene tono definido: atan2(0,0) da 0, que es un tema neutro digno
  const degrees = (Math.atan2(bb, a) * 180) / Math.PI
  return round((degrees + 360) % 360)
}

const toLinearChannel = (channel: number): number =>
  channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4

function insideSrgb(lightness: number, chroma: number, hue: number): boolean {
  const rad = (hue * Math.PI) / 180
  const a = chroma * Math.cos(rad)
  const b = chroma * Math.sin(rad)

  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3

  const channels = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s
  ]
  return channels.every(channel => channel >= 0 && channel <= 1)
}
