import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import type { Tree } from '@nx/devkit'
import resourceGenerator from './resource'
import { MODELS, registerModels } from './models/registry'
import type { ResourceDefinition } from '@acc/schema'

/**
 * Spec 16: declarar `detail` emite la ficha del registro — el destino que la
 * acción «ver» del listado ya buscaba. Todo se deriva de los campos: la v1 no
 * conoce relaciones (eso es la spec 15).
 */
describe('resource generator — ficha', () => {
  const withDetail = (extra: Partial<ResourceDefinition> = {}): ResourceDefinition =>
    ({ ...MODELS['supplier'], name: 'invoice', plural: 'invoices', detail: {}, ...extra }) as ResourceDefinition

  const generate = async (model: ResourceDefinition): Promise<Tree> => {
    registerModels([model])
    const tree = createTreeWithEmptyWorkspace()
    await resourceGenerator(tree, { name: model.name, directory: 'out' })
    return tree
  }

  it('no emite ficha si el modelo no la declara', async () => {
    const tree = await generate({ ...withDetail(), detail: undefined })

    expect(tree.exists('out/frontend/invoice-detail.component.ts')).toBe(false)
  })

  it('emite el componente de ficha y su test cuando el modelo la declara', async () => {
    const tree = await generate(withDetail())

    expect(tree.exists('out/frontend/invoice-detail.component.ts')).toBe(true)
    expect(tree.exists('out/frontend/invoice-detail.component.spec.ts')).toBe(true)
  })

  it('carga el registro por el id de la ruta y muestra sus estados', async () => {
    const tree = await generate(withDetail())
    const detail = tree.read('out/frontend/invoice-detail.component.ts', 'utf-8')

    expect(detail).toContain('ActivatedRoute')
    expect(detail).toContain('findOne')
    expect(detail).toContain('loading')
    expect(detail).toContain('notFound')
  })

  it('titula la ficha con el campo declarado', async () => {
    const tree = await generate(withDetail({ detail: { title: 'email' } }))
    const detail = tree.read('out/frontend/invoice-detail.component.ts', 'utf-8')

    expect(detail).toContain('.email')
  })

  it('muestra los campos del listado con su etiqueta', async () => {
    const tree = await generate(withDetail())
    const detail = tree.read('out/frontend/invoice-detail.component.ts', 'utf-8')

    expect(detail).toContain('Email')
  })

  it('respeta el orden y la selección de campos declarados', async () => {
    const tree = await generate(withDetail({ detail: { fields: ['email'] } }))
    const detail = tree.read('out/frontend/invoice-detail.component.ts', 'utf-8')
    const rows = (detail ?? '').match(/label: '/g) ?? []

    expect(rows).toHaveLength(1)
  })

  it('ofrece volver al listado y las acciones de escritura del recurso', async () => {
    const tree = await generate(withDetail())
    const detail = tree.read('out/frontend/invoice-detail.component.ts', 'utf-8')

    expect(detail).toContain('Volver')
    expect(detail).toContain('Editar')
  })

  it('invoca el componente de adjuntos con SU selector real (plural) y le pasa el registro', async () => {
    registerModels([{ ...withDetail(), attachments: true } as ResourceDefinition])
    const tree = createTreeWithEmptyWorkspace()
    await resourceGenerator(tree, { name: 'invoice', directory: 'out' })
    const detail = tree.read('out/frontend/invoice-detail.component.ts', 'utf-8') ?? ''
    const component = tree.read('out/frontend/invoice-attachments.component.ts', 'utf-8') ?? ''

    const selector = component.match(/selector: '([^']+)'/)?.[1]
    expect(selector).toBe('app-invoices-attachments')
    expect(detail).toContain(`<${selector} [invoiceId]=`)
  })

  it('deja un hueco de IA para lo que la ficha no puede derivar', async () => {
    const tree = await generate(withDetail())
    const detail = tree.read('out/frontend/invoice-detail.component.ts', 'utf-8')

    expect(detail).toContain('@ai:begin detail-extra')
    expect(detail).toContain('@ai:end')
  })

  /**
   * Spec 15 · fase 3: la ficha de un registro muestra los registros que le
   * apuntan. Consulta filtrada por el id del padre (ADR-002 punto 4), nunca join.
   */
  it('lista los registros hijos que referencian a este', async () => {
    const paciente = { ...withDetail(), name: 'paciente', plural: 'pacientes' } as ResourceDefinition
    const cita = {
      ...MODELS['supplier'],
      name: 'cita',
      plural: 'citas',
      labels: { singular: 'Cita', plural: 'Citas' },
      fields: {
        id: { type: 'uuid', pk: true },
        motivo: { type: 'string', table: { show: true, label: 'Motivo' } },
        pacienteId: { type: 'uuid', relation: { to: 'paciente', kind: 'reference' } }
      }
    } as unknown as ResourceDefinition

    registerModels([paciente, cita])
    const tree = createTreeWithEmptyWorkspace()
    await resourceGenerator(tree, { name: 'paciente', directory: 'out' })
    const detail = tree.read('out/frontend/paciente-detail.component.ts', 'utf-8') ?? ''

    expect(detail).toContain('app-related-table')
    expect(detail).toContain("field=\"pacienteId\"")
    expect(detail).toContain('Citas')
  })

  it('sin hijos que lo referencien, la ficha no monta tablas relacionadas', async () => {
    const tree = await generate(withDetail())

    expect(tree.read('out/frontend/invoice-detail.component.ts', 'utf-8')).not.toContain('app-related-table')
  })

  it('la ficha no enseña el uuid de una referencia: solo su nombre', async () => {
    const conRef = {
      ...withDetail(),
      fields: {
        ...withDetail().fields,
        propietarioId: {
          type: 'uuid',
          required: true,
          relation: { to: 'propietario', kind: 'reference' },
          form: { control: 'select', label: 'Propietario' }
        },
        propietarioName: {
          type: 'string',
          required: true,
          table: { show: true, label: 'Propietario' }
        }
      }
    } as unknown as ResourceDefinition
    const tree = await generate(conRef)
    const detail = tree.read('out/frontend/invoice-detail.component.ts', 'utf-8') ?? ''

    expect(detail).toContain("key: 'propietarioName'")
    expect(detail).not.toContain("key: 'propietarioId'")
  })
})
