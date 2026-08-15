import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import type { Tree } from '@nx/devkit'
import resourceGenerator from './resource'
import { MODELS, registerModels } from './models/registry'
import type { ResourceDefinition } from '@raptor/schema'

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
    expect(detail).toContain('field="pacienteId"')
    expect(detail).toContain('Citas')
  })

  it('las columnas de la tabla relacionada viajan con su tipo: una fecha no se lee en ISO crudo (defecto 21)', async () => {
    const paciente = { ...withDetail(), name: 'paciente', plural: 'pacientes' } as ResourceDefinition
    const visita = {
      ...MODELS['supplier'],
      name: 'visita',
      plural: 'visitas',
      labels: { singular: 'Visita', plural: 'Visitas' },
      fields: {
        id: { type: 'uuid', pk: true },
        motivo: { type: 'string', table: { show: true, label: 'Motivo' } },
        fecha: { type: 'date', table: { show: true, label: 'Fecha', type: 'date' } },
        importe: { type: 'number', table: { show: true, label: 'Importe' } },
        pacienteId: { type: 'uuid', relation: { to: 'paciente', kind: 'reference' } }
      }
    } as unknown as ResourceDefinition

    registerModels([paciente, visita])
    const tree = createTreeWithEmptyWorkspace()
    await resourceGenerator(tree, { name: 'paciente', directory: 'out' })
    const detail = tree.read('out/frontend/paciente-detail.component.ts', 'utf-8') ?? ''

    expect(detail).toContain(`{ key: 'fecha', label: 'Fecha', type: 'date' }`)
    expect(detail).toContain(`{ key: 'importe', label: 'Importe', type: 'number' }`)
    expect(detail).toContain(`{ key: 'motivo', label: 'Motivo' }`)
  })

  /**
   * Defecto cazado por la demo Solaris (2026-08-10): la ficha de instalación no COMPILABA.
   * Una columna badge del hijo viajaba como `type: 'badge'`, que es del DataTable pero no del
   * contrato de RelatedColumn ('date' | 'number' | 'boolean') → TS2322 al servir la app.
   * Un conjunto cerrado se lee con sus etiquetas, igual que en el listado.
   */
  it('una columna badge del hijo viaja como etiquetas, no como un tipo que el contrato no admite', async () => {
    const paciente = { ...withDetail(), name: 'paciente', plural: 'pacientes' } as ResourceDefinition
    const ingreso = {
      ...MODELS['supplier'],
      name: 'ingreso',
      plural: 'ingresos',
      labels: { singular: 'Ingreso', plural: 'Ingresos' },
      fields: {
        id: { type: 'uuid', pk: true },
        estado: {
          type: 'string',
          table: {
            show: true,
            label: 'Estado',
            type: 'badge',
            badgeMap: {
              abierto: { label: 'Abierto', variant: 'default' },
              cerrado: { label: 'Cerrado', variant: 'secondary' }
            }
          }
        },
        pacienteId: { type: 'uuid', relation: { to: 'paciente', kind: 'reference' } }
      }
    } as unknown as ResourceDefinition

    registerModels([paciente, ingreso])
    const tree = createTreeWithEmptyWorkspace()
    await resourceGenerator(tree, { name: 'paciente', directory: 'out' })
    const detail = tree.read('out/frontend/paciente-detail.component.ts', 'utf-8') ?? ''

    expect(detail).not.toContain(`type: 'badge'`)
    expect(detail).toContain(`{ key: 'estado', label: 'Estado', labels: { abierto: 'Abierto', cerrado: 'Cerrado' } }`)
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

  it('la ficha no formatea por su cuenta: delega en el formateador del kernel', async () => {
    const tree = await generate(withDetail())
    const detail = tree.read('out/frontend/invoice-detail.component.ts', 'utf-8') ?? ''

    // el «2.019» del año salió justo de tener aquí un formateador propio
    expect(detail).toContain('formatValue')
    expect(detail).not.toContain('DecimalPipe')
    expect(detail).not.toContain('useGrouping')
  })

  it('la ficha muestra la ETIQUETA de un enum, no el valor de la base', async () => {
    const conEnum = {
      ...withDetail(),
      fields: {
        ...withDetail().fields,
        estado: {
          type: 'string',
          required: true,
          vo: { name: 'InvoiceEstado', fieldName: 'Estado', values: ['abierta', 'en_curso'] },
          table: {
            show: true,
            label: 'Estado',
            type: 'badge',
            badgeMap: { abierta: { label: 'Abierta', variant: 'default' }, en_curso: { label: 'En curso', variant: 'secondary' } }
          }
        }
      }
    } as unknown as ResourceDefinition
    const tree = await generate(conEnum)
    const detail = tree.read('out/frontend/invoice-detail.component.ts', 'utf-8') ?? ''

    // el listado pinta «En curso»; la ficha no puede decir «en_curso»
    expect(detail).toContain("labels: { abierta: 'Abierta', en_curso: 'En curso' }")
    expect(detail).toContain('row.labels')
  })

  it('el test emitido declara el componente como proveedor: TestBed no lo inventa', async () => {
    const tree = await generate(withDetail())
    const spec = tree.read('out/frontend/invoice-detail.component.spec.ts', 'utf-8') ?? ''

    // sin esta línea el spec emitido falla con NG0201 en cualquier app generada
    expect(spec).toMatch(/providers: \[[\s\S]*InvoiceDetailComponent[\s\S]*\]/)
  })
})
