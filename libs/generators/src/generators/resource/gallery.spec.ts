import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import type { Tree } from '@nx/devkit'
import resourceGenerator from './resource'
import { MODELS, registerModels } from './models/registry'
import type { ResourceDefinition } from '@acc/schema'

/**
 * Spec 17: la galería es OTRA LECTURA del listado — mismo servicio, mismo
 * endpoint — pintada como tarjetas. Sin backend nuevo.
 */
describe('resource generator — galería', () => {
  const withGallery = (extra: Partial<ResourceDefinition> = {}): ResourceDefinition =>
    ({ ...MODELS['supplier'], name: 'invoice', plural: 'invoices', gallery: {}, ...extra }) as ResourceDefinition

  const generate = async (model: ResourceDefinition): Promise<Tree> => {
    registerModels([model])
    const tree = createTreeWithEmptyWorkspace()
    await resourceGenerator(tree, { name: model.name, directory: 'out' })
    return tree
  }

  it('no emite galería si el modelo no la declara', async () => {
    const tree = await generate({ ...withGallery(), gallery: undefined })

    expect(tree.exists('out/frontend/invoices-gallery.component.ts')).toBe(false)
  })

  it('emite el componente de galería cuando se declara', async () => {
    const tree = await generate(withGallery())

    expect(tree.exists('out/frontend/invoices-gallery.component.ts')).toBe(true)
  })

  it('reutiliza el servicio del recurso: ni endpoint ni estado propios', async () => {
    const tree = await generate(withGallery())
    const gallery = tree.read('out/frontend/invoices-gallery.component.ts', 'utf-8') ?? ''

    expect(gallery).toContain('InvoiceService')
    expect(gallery).not.toContain('HttpClient')
  })

  it('la tarjeta muestra título, subtítulo y métrica derivados', async () => {
    const tree = await generate(withGallery())
    const gallery = tree.read('out/frontend/invoices-gallery.component.ts', 'utf-8') ?? ''

    expect(gallery).toContain('cardTitle')
    expect(gallery).toContain('cardSubtitle')
    expect(gallery).toContain('cardMetric')
  })

  it('respeta los campos fijados en el modelo', async () => {
    const tree = await generate(withGallery({ gallery: { title: 'email' } }))
    const gallery = tree.read('out/frontend/invoices-gallery.component.ts', 'utf-8') ?? ''

    expect(gallery).toContain("cardTitle = 'email'")
  })

  it('navega a la ficha solo si el recurso la declara', async () => {
    const conDetalle = await generate(withGallery({ detail: {} }))
    const sinDetalle = await generate(withGallery())

    expect(conDetalle.read('out/frontend/invoices-gallery.component.ts', 'utf-8')).toContain('navigate')
    expect(sinDetalle.read('out/frontend/invoices-gallery.component.ts', 'utf-8')).not.toContain('navigate')
  })

  it('mantiene búsqueda y paginación del listado', async () => {
    const tree = await generate(withGallery())
    const gallery = tree.read('out/frontend/invoices-gallery.component.ts', 'utf-8') ?? ''

    expect(gallery).toContain('onSearch')
    expect(gallery).toContain('onPage')
  })
})
