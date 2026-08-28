import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { DESIGN_HOOKS } from '@raptor/schema'
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

/**
 * El espejo del `design-drift.spec.ts` del generador (spec 68, TASK-09). Los bloques están
 * implementados DOS veces —aquí y en las plantillas— y esa duplicación es deuda declarada
 * (ROADMAP idea 32). Lo que estos dos tests garantizan es que el desfase sea RUIDOSO: un bloque
 * nuevo del lienzo que pinte cromo sin hook rompe la suite, con su fichero en el mensaje.
 */
describe('hooks de piel — anti-desfase del lienzo', () => {
  /** Cromo que hace visible una superficie: si un bloque lo escribe, la piel debe alcanzarlo */
  const CHROME = /\brounded-|\bshadow-|\bbg-card\b|\bbg-muted\b|\bbg-popover\b/

  /**
   * Componentes del lienzo con cromo que NO son bloques, con su motivo. Son el SHELL del mock:
   * la piel real los emite el generador en `files-design/<id>/`, y el lienzo dibuja su
   * aproximación a propósito (fuera de scope de la spec 68).
   */
  const EXEMPT: Record<string, string> = {
    'canvas-header.component.ts': 'barra del mock: shell, no bloque',
    'canvas-controls.component.ts': 'controles de zoom del LIENZO, no de la app dibujada',
    'canvas-shell.component.ts': 'ES el shell del mock (spec 69): lo viste el descriptor de la piel, no un hook',
    'canvas-session-footer.component.ts': 'pie de sesión del mock: shell',
    'canvas-admin-nav-group.component.ts': 'menú de administración del mock: shell',
    'canvas-page.component.ts': 'compone bloques y dibuja el papel del lienzo; el cromo es suyo',
    'canvas-kpi-row.component.ts':
      'compone celdas (que sí llevan sus hooks); su cromo es el «+» y su menú, mobiliario del estudio',
    'canvas-notice.service.ts': 'avisos del estudio, no de la app dibujada'
  }

  const blocks = (): { file: string; content: string }[] =>
    readdirSync(__dirname)
      .filter(file => file.startsWith('canvas-') && file.endsWith('.ts') && !file.includes('.spec.'))
      .map(file => ({ file, content: readFileSync(join(__dirname, file), 'utf-8') }))

  it('ningún bloque del lienzo con cromo se queda sin hook de piel', () => {
    const naked = blocks()
      .filter(block => CHROME.test(block.content))
      .filter(block => !DESIGN_HOOKS.some(hook => block.content.includes(hook)))
      .map(block => block.file)
      .filter(file => !(file in EXEMPT))

    // si esto falla: ese bloque se dibuja igual en las tres pieles. Mira la tabla de colocación
    // de .claude/specs/68-el-canvas-lleva-la-piel/DESIGN.md y ponle sus hooks.
    expect(naked).toEqual([])
  })

  it('ningún hook del vocabulario queda sin usar en el lienzo', () => {
    const all = blocks()
      .map(block => block.content)
      .join('\n')
      .concat(readFileSync(join(__dirname, '..', '..', '..', 'shared/components/kpi-card.ts'), 'utf-8'))

    for (const hook of DESIGN_HOOKS) {
      expect(all).toContain(hook)
    }
  })
})
