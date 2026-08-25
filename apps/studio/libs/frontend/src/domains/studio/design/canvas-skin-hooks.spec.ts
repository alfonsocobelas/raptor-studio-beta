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

  describe('formulario y su diálogo', () => {
    it('el formulario nombra cabecera y botonera, y su marco NO es superficie', () => {
      const form = source('canvas-form.component.ts')

      expect(form).toContain('app-panel-head')
      expect(form).toContain('app-toolbar')
      // lección de la spec 67: el marco del formulario no tiene padding lateral propio
      expect(form).not.toContain('class="app-panel bg-background')
    })

    it('el diálogo SÍ es superficie: es una tarjeta flotante con su botonera', () => {
      const dialog = source('canvas-form-dialog.component.ts')

      expect(dialog).toContain('app-panel')
      expect(dialog).toContain('app-panel-head')
      expect(dialog).toContain('app-toolbar')
    })
  })

  describe('ficha de detalle', () => {
    const detail = (): string => source('canvas-detail.component.ts')

    it('la rejilla de campos es superficie y la tira de acciones un toolbar', () => {
      expect(detail()).toContain('app-panel')
      expect(detail()).toContain('app-toolbar')
    })
  })

  describe('kanban y tarjetas', () => {
    it('el kanban nombra tablero, columna, cabecera y tarjeta', () => {
      const kanban = source('canvas-kanban.component.ts')

      expect(kanban.match(/app-panel[^-]/g)?.length).toBeGreaterThanOrEqual(2)
      expect(kanban).toContain('app-panel-head')
      expect(kanban).toContain('app-chip')
      expect(kanban).toContain('app-toolbar')
    })

    it('la galería de tarjetas nombra tarjeta, etiqueta y su tira de filtros', () => {
      const cards = source('canvas-cards.component.ts')

      expect(cards).toContain('app-panel')
      expect(cards).toContain('app-chip')
      expect(cards).toContain('app-toolbar')
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
