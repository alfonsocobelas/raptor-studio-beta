import { describe, expect, it } from 'vitest'
import { VIEW_PRESETS, type DesignPage } from '@app/shared/domain'
import { viewIcon } from './view-icon'

const page = (blocks: DesignPage['blocks'], drillDown = false): DesignPage => ({
  title: 'X',
  blocks,
  ...(drillDown ? { drillDown: true } : {})
})

describe('viewIcon', () => {
  it('una ficha se ve como ficha, aunque lleve tabla dentro', () => {
    expect(viewIcon(page([{ kind: 'fields', resource: 'producto' }], true))).toBe('lucideIdCard')
  })

  it('un panel de KPIs NO es una tabla', () => {
    const icono = viewIcon(page([{ kind: 'kpis', resources: ['producto'] }]))

    expect(icono).toBe('lucideChartNoAxesColumn')
    expect(icono).not.toBe('lucideTable')
  })

  it('manda el PRIMER bloque: en un panel son los KPIs, con tabla debajo o sin ella', () => {
    const panel = page([{ kind: 'kpis', resources: ['producto'] }, { kind: 'table', resource: 'producto' }])

    expect(viewIcon(panel)).toBe('lucideChartNoAxesColumn')
  })

  it('un listado con KPIs debajo sigue siendo un listado', () => {
    const listado = page([{ kind: 'table', resource: 'producto' }, { kind: 'kpis', resources: ['producto'] }])

    expect(viewIcon(listado)).toBe('lucideTable')
  })

  it('el preset Panel del catálogo NO se dibuja como tabla', () => {
    const preset = VIEW_PRESETS.find(p => p.id === 'panel')
    if (!preset) throw new Error('falta el preset panel')

    expect(viewIcon(page(preset.blocks('producto')))).toBe('lucideChartNoAxesColumn')
  })

  it('una galería se ve como galería', () => {
    expect(viewIcon(page([{ kind: 'cards', resource: 'producto' }]))).toBe('lucideLayoutGrid')
  })

  it('una vista de solo ficheros se ve como ficheros', () => {
    expect(viewIcon(page([{ kind: 'attachments', resource: 'producto' }]))).toBe('lucidePaperclip')
  })

  it('una vista en blanco no finge tener contenido', () => {
    expect(viewIcon(page([]))).toBe('lucideSquareDashed')
  })

  it('ningún preset del catálogo se queda sin icono propio', () => {
    for (const preset of VIEW_PRESETS) {
      const blocks = preset.blocks('producto')
      expect(viewIcon(page(blocks, preset.drillDown)), `preset ${preset.id}`).toBeTruthy()
    }
  })
})
