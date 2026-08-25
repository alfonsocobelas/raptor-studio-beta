import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Spec 68: los bloques del lienzo nombran los hooks de piel, igual que las plantillas emitidas.
 *
 * El CSS real del preset ya llega acotado al lienzo (`preset-canvas-css.ts`), y los tokens
 * arreglan solos las esquinas de todo lo que use utilidades Tailwind. Lo que el token no alcanza
 * —fondo, borde, densidad, tipografía de un panel o de una pastilla— sólo lo alcanza el hook.
 *
 * Se lee el FUENTE del componente en vez de renderizarlo: lo que se comprueba es que el literal
 * esté escrito, que es exactamente lo que se olvida cuando se añade un bloque nuevo.
 */
const source = (file: string): string => readFileSync(join(__dirname, file), 'utf-8')
const studioComponent = (file: string): string => readFileSync(join(__dirname, '..', '..', '..', file), 'utf-8')

describe('hooks de piel en los bloques del lienzo', () => {
  describe('tira de KPIs', () => {
    // la copia del estudio se quedó en la versión anterior a los hooks (ROADMAP idea 31)
    const kpi = (): string => studioComponent('shared/components/kpi-card.ts')

    it('la tarjeta KPI nombra superficie, cabecera y cifra', () => {
      expect(kpi()).toContain('app-panel')
      expect(kpi()).toContain('app-panel-head')
      expect(kpi()).toContain('app-metric')
    })
  })

  describe('calendario', () => {
    const calendar = (): string => source('canvas-calendar.component.ts')

    it('nombra los cinco hooks que le tocan', () => {
      for (const hook of ['app-panel', 'app-panel-head', 'app-cell', 'app-chip', 'app-toolbar']) {
        expect(calendar()).toContain(hook)
      }
    })
  })

  describe('tabla', () => {
    const table = (): string => source('canvas-table.component.ts')

    it('la envoltura de la tabla es una superficie y sus tiras de controles toolbars', () => {
      expect(table()).toContain('app-panel')
      expect(table()).toContain('app-toolbar')
    })

    it('el badge de estado es una pastilla', () => {
      expect(table()).toContain('app-chip')
    })
  })
})
