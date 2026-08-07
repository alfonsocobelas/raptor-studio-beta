import { seedTheme } from './seed-theme'
import { deriveTheme } from './derive-theme'
import { insideSrgb, isSurfaceToken } from './testing/srgb'

/**
 * Fase 4 (spec 20): un tema COMPLETO derivado del color de marca del cliente. La receta es la del
 * catálogo (mismos escalones L de hortensia/océano); del color solo se toma el TONO — el croma y
 * la luz los fija la receta, porque un flúor corporativo a pelo no es un tema, es un accidente.
 */
describe('seedTheme — el tema del color de marca', () => {
  it('deriva el tono del hex y aplica la receta del catálogo', () => {
    const theme = seedTheme('#1a6dff') // un azul corporativo

    // el tono aterriza en la zona azul (oklch ~262 para ese hex)
    expect(theme.surface.hue).toBeGreaterThan(230)
    expect(theme.surface.hue).toBeLessThan(280)
    // superficies con el croma bajo del catálogo, tarjeta blanca
    expect(theme.surface.chroma).toBeCloseTo(0.016, 3)
    expect(theme.surface.untinted).toEqual(['base'])
    // acción con la receta: primaria clara L .53, oscura L .72
    expect(theme.light.primary).toMatch(/^oklch\(0\.53 /)
    expect(theme.dark.primary).toMatch(/^oklch\(0\.72 /)
  })

  it('acepta el hex con y sin almohadilla, en mayúsculas o minúsculas', () => {
    expect(seedTheme('1A6DFF').surface.hue).toBeCloseTo(seedTheme('#1a6dff').surface.hue, 5)
  })

  it('el id nombra la semilla: la clase del body delata el tema', () => {
    expect(seedTheme('#1a6dff').id).toBe('seed-1a6dff')
  })

  it('todo el tema derivado cabe en sRGB: nada se recorta a gris', () => {
    for (const seed of ['#1a6dff', '#e63946', '#2a9d8f', '#f4a261', '#7209b7']) {
      const tokens = deriveTheme(seedTheme(seed))
      for (const [name, value] of [...Object.entries(tokens.light), ...Object.entries(tokens.dark)]) {
        if (!isSurfaceToken(name)) continue
        expect({ seed, name, ok: insideSrgb(value) }).toEqual({ seed, name, ok: true })
      }
      // y la acción también: un primario recortado se pinta gris
      expect(insideSrgb(tokens.light['primary'])).toBe(true)
      expect(insideSrgb(tokens.dark['primary'])).toBe(true)
    }
  })

  it('un hex inválido revienta con un mensaje claro', () => {
    expect(() => seedTheme('azulito')).toThrow(/hex/i)
    expect(() => seedTheme('#12345')).toThrow(/hex/i)
  })

  it('un gris de marca (croma ~0) produce un tema neutro digno, no un NaN', () => {
    const theme = seedTheme('#808080')

    expect(Number.isFinite(theme.surface.hue)).toBe(true)
    expect(theme.light.primary).toMatch(/^oklch\(/)
  })
})
