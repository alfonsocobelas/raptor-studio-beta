import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import type { Tree } from '@nx/devkit'
import resourceGenerator from './resource'
import { MODELS, registerModels } from './models/registry'
import type { ResourceDefinition } from '@raptor/schema'

/**
 * Spec 59 (mock 22E): el calendario es OTRA LECTURA del listado — mismo
 * servicio, mismo endpoint — con cada registro como tira en su día.
 */
describe('resource generator — calendario', () => {
  const withCalendar = (extra: Partial<ResourceDefinition> = {}): ResourceDefinition => {
    const base = MODELS['supplier']
    return {
      ...base,
      name: 'order',
      plural: 'orders',
      fields: {
        ...base.fields,
        deliveryDate: {
          type: 'date',
          table: { show: true, label: 'Entrega' },
          form: { control: 'date', label: 'Fecha de entrega' }
        }
      },
      calendar: { date: 'deliveryDate' },
      ...extra
    } as ResourceDefinition
  }

  const generate = async (model: ResourceDefinition): Promise<Tree> => {
    registerModels([model])
    const tree = createTreeWithEmptyWorkspace()
    await resourceGenerator(tree, { name: model.name, directory: 'out' })
    return tree
  }

  const emitted = async (model: ResourceDefinition): Promise<string> => {
    const tree = await generate(model)
    return tree.read('out/frontend/orders-calendar.component.ts', 'utf-8') ?? ''
  }

  it('no emite calendario si el modelo no lo declara', async () => {
    const tree = await generate(withCalendar({ calendar: undefined }))

    expect(tree.exists('out/frontend/orders-calendar.component.ts')).toBe(false)
  })

  it('emite el componente de calendario cuando se declara', async () => {
    const tree = await generate(withCalendar())

    expect(tree.exists('out/frontend/orders-calendar.component.ts')).toBe(true)
  })

  it('reutiliza el servicio del recurso: ni endpoint ni estado propios', async () => {
    const calendar = await emitted(withCalendar())

    expect(calendar).toContain('OrderService')
    expect(calendar).not.toContain('HttpClient')
  })

  it('agrupa por el campo fecha elegido y etiqueta la tira con el campo derivado', async () => {
    const calendar = await emitted(withCalendar())

    expect(calendar).toContain('deliveryDate')
    expect(calendar).toContain('stripLabel')
  })

  it('ofrece las tres vistas y la navegación de mes', async () => {
    const calendar = await emitted(withCalendar())

    expect(calendar).toMatch(/'month'.*'week'.*'day'|month' \| 'week' \| 'day/s)
    expect(calendar).toContain('previousPeriod')
    expect(calendar).toContain('nextPeriod')
  })

  it('sin fin de semana la rejilla queda en cinco días', async () => {
    const calendar = await emitted(withCalendar({ calendar: { date: 'deliveryDate', weekends: false } }))

    expect(calendar).toContain('weekends = false')
    expect(calendar).not.toContain("'SÁB'")
  })

  it('con color por enum emite la leyenda con sus etiquetas', async () => {
    const base = withCalendar()
    const calendar = await emitted({
      ...base,
      fields: {
        ...base.fields,
        status: {
          type: 'string',
          vo: { name: 'OrderStatus', fieldName: 'Status', values: ['expected', 'attention'] },
          table: {
            show: true,
            type: 'badge',
            badgeMap: {
              expected: { label: 'Entrega prevista', variant: 'default' },
              attention: { label: 'Requiere atención', variant: 'destructive' }
            }
          },
          form: { control: 'select', label: 'Estado' },
          column: { type: 'varchar', length: 40 }
        }
      },
      calendar: { date: 'deliveryDate', color: 'status' }
    } as ResourceDefinition)

    expect(calendar).toContain('Entrega prevista')
    expect(calendar).toContain('Requiere atención')
    expect(calendar).toContain('status')
  })
})
