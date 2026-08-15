/**
 * La consola del generador de relleno (fill-flow-slots, spec 39) traducida a los eventos
 * que consume la pantalla de obra (spec 45) — mismo patrón que describeProgress con la
 * generación: el generador habla por consola, el borde lo vuelve NDJSON.
 */
export type FillEvent =
  | { type: 'slot'; id: string; status: 'proposing' | 'filled'; reason?: undefined }
  | { type: 'slot'; id: string; status: 'rejected'; reason: string }
  | { type: 'baseline' }

export function describeFillLine(line: string): FillEvent | null {
  const proposing = line.match(/^→ (flow-[a-z0-9-]+): proponiendo/)
  if (proposing) return { type: 'slot', id: proposing[1], status: 'proposing' }

  const filled = line.match(/^✓ (flow-[a-z0-9-]+) relleno/)
  if (filled) return { type: 'slot', id: filled[1], status: 'filled' }

  if (line.startsWith('✗ La app ya estaba en rojo')) return { type: 'baseline' }

  const rejected = line.match(/^✗ (flow-[a-z0-9-]+): (.+)$/)
  if (rejected) return { type: 'slot', id: rejected[1], status: 'rejected', reason: rejected[2] }

  return null
}
