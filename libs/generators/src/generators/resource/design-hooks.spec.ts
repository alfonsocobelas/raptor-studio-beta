import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import type { ResourceDefinition } from '@raptor/schema'
import type { Tree } from '@nx/devkit'
import resourceGenerator from './resource'
import { MODELS, registerModels } from './models/registry'

/**
 * Spec 67: las plantillas NOMBRAN los hooks de piel; los presets los VISTEN. Sin estos
 * literales, `cabina` y `suite` sólo alcanzaban la tabla y los KPIs — el resto de la app era
 * idéntica en las tres pieles, porque su cromo es Tailwind escrito a mano en la plantilla.
 *
 * Cada bloque comprueba lo mismo: el componente emitido lleva los hooks que le tocan según la
 * tabla de colocación del DESIGN, y conserva su cromo Tailwind — los hooks se AÑADEN, no
 * sustituyen, así que la piel neutra no cambia de aspecto.
 */
describe('resource generator — hooks de piel', () => {
  const emit = async (extra: Partial<ResourceDefinition>, file: string): Promise<string> => {
    registerModels([{ ...MODELS['contract'], ...extra } as ResourceDefinition])
    const tree: Tree = createTreeWithEmptyWorkspace()
    await resourceGenerator(tree, { name: 'contract', directory: 'out' })
    return tree.read(`out/frontend/${file}`, 'utf-8') ?? ''
  }

  afterEach(() => registerModels([MODELS['contract']]))

  describe('kanban', () => {
    const kanban = (): Promise<string> => emit({ kanban: { field: 'status' } }, 'contracts-kanban.component.ts')

    it('cada columna es una superficie con su cabecera', async () => {
      const html = await kanban()

      expect(html).toContain('class="app-panel bg-card flex min-h-40 flex-col rounded-lg border transition-opacity"')
      expect(html).toContain('app-panel-head')
    })

    it('la tarjeta arrastrable es una pastilla y el pie una tira de controles', async () => {
      const html = await kanban()

      expect(html).toContain('class="app-chip bg-background rounded-md border p-2 text-sm shadow-sm"')
      expect(html).toContain('app-toolbar')
    })
  })

  describe('calendario', () => {
    const calendar = (extra: Partial<ResourceDefinition> = {}): Promise<string> =>
      emit({ calendar: { date: 'startDate' }, ...extra }, 'contracts-calendar.component.ts')

    it('la tarjeta del mes es una superficie de piel, con su cabecera', async () => {
      const html = await calendar()

      // el hook va delante y el cromo Tailwind se queda: el neutro se ve igual que antes
      expect(html).toContain('class="app-panel bg-card rounded-lg border"')
      expect(html).toContain('app-panel-head')
    })

    it('el día es una celda de rejilla no-tabla y el evento una pastilla', async () => {
      const html = await calendar()

      expect(html).toContain('app-cell')
      // dos pastillas: la tira de la rejilla y la de la vista de día
      expect(html.match(/app-chip/g)?.length).toBeGreaterThanOrEqual(2)
    })

    it('el pie de vistas y la leyenda de colores son tiras de controles', async () => {
      const html = await calendar({ calendar: { date: 'startDate', color: 'status' } })

      expect(html.match(/app-toolbar/g)?.length).toBeGreaterThanOrEqual(2)
    })
  })
})
