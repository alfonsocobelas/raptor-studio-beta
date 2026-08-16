import { describe, expect, it } from 'vitest'
import { productMark } from './product-mark'

describe('productMark', () => {
  it('en claro la marca es una pastilla oscura con la R naranja', () => {
    expect(productMark('light')).toEqual({ background: '#1b1917', letter: '#c86647' })
  })

  it('en noche se invierte: pastilla naranja con la R en negro', () => {
    expect(productMark('dark')).toEqual({ background: '#c86647', letter: '#1b1917' })
  })

  it('los dos temas usan los mismos dos colores, solo cambian de sitio', () => {
    const claro = productMark('light')
    const noche = productMark('dark')

    expect(noche.background).toBe(claro.letter)
    expect(noche.letter).toBe(claro.background)
  })
})
