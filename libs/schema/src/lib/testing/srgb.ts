/**
 * Conversión OKLCH → sRGB, SOLO para los tests (no se exporta en el índice del
 * paquete). Existe para un guard concreto: fuera del gamut sRGB el navegador
 * recorta el color, así que un token con más croma del que su luminancia admite
 * se dibuja neutro y el tema se ve gris por mucho color que declare.
 *
 * Matriz de Björn Ottosson (https://bottosson.github.io/posts/oklab/).
 */
const OKLCH = /^oklch\(([\d.]+) ([\d.]+) ([\d.]+)(?: \/ .+)?\)$/

function toLinearSrgb(lightness: number, chroma: number, hue: number): [number, number, number] {
  const rad = (hue * Math.PI) / 180
  const a = chroma * Math.cos(rad)
  const b = chroma * Math.sin(rad)

  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3

  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s
  ]
}

/**
 * Tokens que NO se derivan de la rampa: son colores de identidad escogidos a
 * mano. Ahí un recorte de un pelo es tolerable (el `destructive` de shadcn, que
 * heredamos del esqueleto, ya se sale un poco). El guard cubre las superficies,
 * que es donde un recorte mata el tema en silencio.
 */
const ACTION_TOKENS = [
  'primary',
  'primary-foreground',
  'ring',
  'sidebar-primary',
  'sidebar-primary-foreground',
  'sidebar-ring',
  'destructive'
]

export const isSurfaceToken = (name: string): boolean => !ACTION_TOKENS.includes(name)

/** Un valor que no case con oklch(L C H) se da por bueno: no es un color derivado. */
export function insideSrgb(value: string): boolean {
  const match = OKLCH.exec(value)
  if (!match) return true

  const channels = toLinearSrgb(Number(match[1]), Number(match[2]), Number(match[3]))

  // tolerancia de un redondeo: el recorte visible empieza bastante más allá
  return channels.every(channel => channel >= -0.002 && channel <= 1.002)
}
