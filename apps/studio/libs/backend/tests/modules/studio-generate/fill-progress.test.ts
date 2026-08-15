import { describeFillLine } from '@app/backend/contexts/studio/generate/fill-progress'

/**
 * Spec 45 TASK-02: la consola del generador de relleno, traducida a eventos NDJSON para
 * la pantalla de obra — mismo patrón que describeProgress con la generación.
 */
describe('describeFillLine', () => {
  it('la propuesta en curso', () => {
    expect(describeFillLine('→ flow-cie: proponiendo por bridge…')).toEqual({
      type: 'slot',
      id: 'flow-cie',
      status: 'proposing'
    })
  })

  it('el hueco aceptado por el gate', () => {
    expect(describeFillLine('✓ flow-cie relleno y aceptado por el gate')).toEqual({
      type: 'slot',
      id: 'flow-cie',
      status: 'filled'
    })
  })

  it('el hueco rechazado, con su motivo', () => {
    expect(describeFillLine("✗ flow-cie: el ejecutor no propuso nada para 'flow-cie'")).toEqual({
      type: 'slot',
      id: 'flow-cie',
      status: 'rejected',
      reason: "el ejecutor no propuso nada para 'flow-cie'"
    })
  })

  it('la línea base en rojo se distingue de un rechazo', () => {
    expect(describeFillLine('✗ La app ya estaba en rojo ANTES de rellenar, así que no se ha intentado nada:')).toEqual({
      type: 'baseline'
    })
  })

  it('el ruido no produce eventos', () => {
    expect(describeFillLine('  El hueco vuelve a quedar vacío.')).toBeNull()
    expect(describeFillLine('3 hueco(s) de paso pendiente(s) en apps/x:')).toBeNull()
  })
})
