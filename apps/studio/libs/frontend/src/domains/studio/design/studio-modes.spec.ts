import { describe, expect, it } from 'vitest'
import { STUDIO_MODES } from './studio-modes'

describe('STUDIO_MODES', () => {
  it('pone Vistas primero y Accesos al final', () => {
    expect(STUDIO_MODES.map(tab => tab.label)).toEqual(['Vistas', 'Modelo', 'Flujos', 'Accesos'])
  })

  it('conserva los ids de modo que ya consumen los smoke tools', () => {
    expect(STUDIO_MODES.map(tab => tab.mode)).toEqual(['views', 'model', 'flows', 'access'])
  })
})
