import { readFileSync } from 'node:fs'
import { join } from 'node:path'
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

  // Las superficies COMPARTIDAS: el diálogo de alta/edición sale en todas las pantallas, así
  // que dejarlo neutro se lleva por delante media spec. Viven en el frontend-kernel, no en el
  // generador de recursos, y por eso se comprueban leyendo la plantilla.
  describe('superficies compartidas del kernel', () => {
    const kernelTemplate = (relative: string): string =>
      readFileSync(join(__dirname, '..', 'frontend-kernel', relative), 'utf-8')

    it('la tarjeta KPI nombra superficie, cabecera y cifra', () => {
      const html = kernelTemplate('files-ui/spartan/shared/components/kpi-card.ts.template')

      expect(html).toContain('app-panel')
      expect(html).toContain('app-panel-head')
      // la cifra es el sexto hook: antes la piel la buscaba por p.text-2xl, clase de Tailwind
      expect(html).toContain('app-metric')
    })

    it('el diálogo de alta y edición es una superficie de piel', () => {
      const html = kernelTemplate('files-ui/spartan/shared/components/ui/dialog.ts.template')

      expect(html).toContain('app-panel')
    })

    it('el desplegable del lookup es una superficie de piel', () => {
      const html = kernelTemplate('files-ui/spartan/shared/components/ui/lookup.ts.template')

      expect(html).toContain('app-panel')
    })

    it('la tabla de relacionados es una superficie de piel', () => {
      const html = kernelTemplate('files/shared/components/related-table.ts.template')

      expect(html).toContain('app-panel')
    })
  })

  describe('adjuntos', () => {
    const attachments = (): Promise<string> => emit({ attachments: true }, 'contract-attachments.component.ts')

    it('la zona de arrastre es una superficie con su cabecera', async () => {
      const html = await attachments()

      expect(html).toContain('app-panel')
      expect(html).toContain('app-panel-head')
    })

    it('cada fichero de la lista es una pastilla', async () => {
      const html = await attachments()

      expect(html).toContain('class="app-chip flex items-center justify-between rounded-md border px-3 py-2 text-sm"')
    })
  })

  describe('importación CSV', () => {
    const importCsv = (): Promise<string> =>
      emit(
        { list: { ...MODELS['contract'].list, features: { ...MODELS['contract'].list?.features, import: true } } },
        'contracts-import.component.ts'
      )

    it('el panel de errores es una superficie y el selector de fichero un control de piel', async () => {
      const html = await importCsv()

      expect(html).toContain(
        'class="app-panel border-destructive/40 max-h-48 space-y-1 overflow-y-auto rounded-md border p-3"'
      )
      expect(html).toContain('class="app-toolbar border-input w-full rounded-md border px-3 py-2 text-sm"')
    })

    it('el pie del diálogo es un toolbar', async () => {
      const html = await importCsv()

      expect(html).toContain('class="app-toolbar flex justify-end gap-2"')
    })
  })

  describe('ficha de detalle', () => {
    const detail = (): Promise<string> => emit({ history: true }, 'contract-detail.component.ts')

    it('la rejilla de campos y el historial son superficies, con su cabecera', async () => {
      const html = await detail()

      expect(html).toContain(
        'class="app-panel bg-card grid grid-cols-1 gap-x-8 gap-y-4 rounded-lg border p-6 sm:grid-cols-2"'
      )
      expect(html).toContain('class="app-panel bg-card rounded-lg border p-4"')
      expect(html).toContain('app-panel-head')
    })

    it('la tira de acciones es un toolbar y los cambios del historial pastillas', async () => {
      const html = await detail()

      expect(html).toContain('app-toolbar')
      expect(html).toContain('class="app-chip bg-muted rounded-full px-2 py-0.5 text-xs"')
    })
  })

  describe('página-formulario', () => {
    const formPage = (): Promise<string> => emit({ form: {} }, 'contract-form-page.component.ts')

    it('el <form> NO es una superficie: sólo sus secciones y su botonera llevan hook', async () => {
      const html = await formPage()

      // visto en navegador (2026-08-25): con app-panel, el borde de la piel quedaba pegado a
      // los campos — el <form> lleva padding vertical pero no lateral, no es una superficie.
      expect(html).toContain('class="space-y-6 py-6"')
      expect(html).not.toContain('class="app-panel space-y-6')
      expect(html).toContain('app-panel-head')
    })

    it('la botonera de guardar es un toolbar', async () => {
      const html = await formPage()

      expect(html).toContain('class="app-toolbar flex justify-end gap-2 pt-2"')
    })
  })

  describe('galería', () => {
    const gallery = (): Promise<string> => emit({ gallery: {} }, 'contracts-gallery.component.ts')

    it('cada tarjeta es una superficie y sus etiquetas pastillas', async () => {
      const html = await gallery()

      expect(html).toContain(
        'class="app-panel bg-card flex flex-col gap-2 rounded-lg border p-4 transition-shadow hover:shadow-md"'
      )
      expect(html).toContain('class="app-chip bg-muted rounded-full px-2 py-0.5 text-xs"')
    })

    it('el buscador y la paginación son controles de piel', async () => {
      const html = await gallery()

      expect(html).toContain('class="app-toolbar border-input w-full max-w-sm rounded-md border px-3 py-2 text-sm"')
      expect(html.match(/app-toolbar/g)?.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('cronograma', () => {
    const gantt = (): Promise<string> => emit({}, 'contracts-gantt.component.ts')

    it('el lienzo es una superficie, su eje la cabecera y cada fila una celda', async () => {
      const html = await gantt()

      expect(html).toContain('class="app-panel bg-card overflow-x-auto rounded-lg border"')
      expect(html).toContain('app-panel-head')
      expect(html).toContain('app-cell')
    })

    it('la barra de tarea es una pastilla', async () => {
      const html = await gantt()

      expect(html).toContain('class="app-chip bg-primary absolute top-2 h-4 rounded-sm"')
    })

    it('el buscador y la paginación son controles de piel', async () => {
      const html = await gantt()

      // el buscador es un <input> suelto sin contrato neutro: el hook va en el propio control
      expect(html).toContain('class="app-toolbar border-input w-full max-w-sm rounded-md border px-3 py-2 text-sm"')
      expect(html.match(/app-toolbar/g)?.length).toBeGreaterThanOrEqual(2)
    })
  })

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
