import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import type { Tree } from '@nx/devkit'
import resourceGenerator from './resource'
import { MODELS, registerModels } from './models/registry'
import type { ResourceDefinition } from '@raptor/schema'

/**
 * Spec 64: el calendario gana escritura — alta desde el día con la fecha
 * precargada, reutilizando el diálogo CRUD y el service del listado.
 * Cero endpoints nuevos.
 */
describe('resource generator — calendario interactivo (alta)', () => {
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

  const emitted = async (model: ResourceDefinition): Promise<string> => {
    registerModels([model])
    const tree: Tree = createTreeWithEmptyWorkspace()
    await resourceGenerator(tree, { name: model.name, directory: 'out' })
    return tree.read('out/frontend/orders-calendar.component.ts', 'utf-8') ?? ''
  }

  it('ofrece el alta desde el día: botón, diálogo compartido y fecha precargada', async () => {
    const calendar = await emitted(withCalendar())

    expect(calendar).toContain('openCreate(')
    expect(calendar).toContain('app-order-dialog')
    expect(calendar).toContain('[initialValue]')
    expect(calendar).toMatch(/createDate\(\)[\s\S]*\{ deliveryDate: date \}/)
  })

  it('guarda con el service del listado: create con id nuevo y update, con sus toasts', async () => {
    const calendar = await emitted(withCalendar())

    expect(calendar).toContain('generateId()')
    expect(calendar).toContain('this._service.create')
    expect(calendar).toContain('this._service.update')
    expect(calendar).toContain('NotificationService')
    expect(calendar).not.toContain('HttpClient')
  })

  it('sin matriz de accesos el alta se guarda tras canWrite()', async () => {
    const calendar = await emitted(withCalendar())

    expect(calendar).toContain('canWrite()')
    expect(calendar).not.toContain('CAN_CREATE_ROLES')
  })

  it('con matriz de accesos el alta obedece a CAN_CREATE_ROLES', async () => {
    const calendar = await emitted(
      withCalendar({ access: { view: ['user', 'viewer'], create: ['user'], edit: ['user'], delete: [] } })
    )

    expect(calendar).toContain('canCreate()')
    expect(calendar).toContain('CAN_CREATE_ROLES')
  })

  it('sin ficha, la tira abre el diálogo de edición', async () => {
    const calendar = await emitted(withCalendar())

    expect(calendar).toContain('edit(item)')
    expect(calendar).toContain('this.editingOrder.set(item)')
  })

  it('con ficha la tira sigue navegando al detalle, sin gesto de edición', async () => {
    const calendar = await emitted(withCalendar({ detail: {} }))

    expect(calendar).toContain('open(item)')
    expect(calendar).not.toContain('edit(item)')
  })

  it('con matriz de accesos la edición obedece a CAN_EDIT_ROLES', async () => {
    const calendar = await emitted(
      withCalendar({ access: { view: ['user', 'viewer'], create: ['user'], edit: ['user'], delete: [] } })
    )

    expect(calendar).toContain('CAN_EDIT_ROLES')
    expect(calendar).toContain('canEdit()')
  })

  it('ensancha la lectura compartida para pintar TODOS los registros y la restaura al salir', async () => {
    const calendar = await emitted(withCalendar())

    expect(calendar).toMatch(/pageSize: 500/)
    expect(calendar).toContain('DestroyRef')
    expect(calendar).toMatch(/onDestroy/)
  })

  it('sin features.edit el calendario sigue siendo de solo lectura', async () => {
    const calendar = await emitted(withCalendar({ list: { features: { edit: false } } }))

    expect(calendar).not.toContain('openCreate')
    expect(calendar).not.toContain('app-dialog')
  })
})
