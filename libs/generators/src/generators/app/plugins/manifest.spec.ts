import { buildSlotsManifest } from './manifest'
import { SLOTS } from './slots'
import { PLUGINS } from './registry'

/**
 * TASK-09 (spec 23): el manifiesto es la fuente única de las opciones para el estudio.
 * Solo datos serializables — los manifiestos de emisión (funciones, assets) NO viajan.
 */
describe('buildSlotsManifest', () => {
  const manifest = buildSlotsManifest()

  it('publishes one entry per registered slot, in registry order', () => {
    expect(manifest.slots.map(slot => slot.name)).toEqual(Object.keys(SLOTS))
  })

  it('publishes label, default and providers of each slot', () => {
    const database = manifest.slots.find(slot => slot.name === 'database')

    expect(database).toEqual({
      name: 'database',
      label: 'Base de datos',
      default: 'postgres',
      providers: [
        { value: 'postgres', label: 'PostgreSQL (TypeORM)' },
        { value: 'mongo', label: 'MongoDB (Mongoose)' }
      ]
    })
  })

  it('carries the requires of a provider so the wizard can disable invalid combinations', () => {
    const auth = manifest.slots.find(slot => slot.name === 'auth')
    const singleTenant = auth?.providers.find(provider => provider.value === 'single-tenant')

    expect(singleTenant?.requires).toEqual({ database: 'postgres' })
    expect(singleTenant?.description).toBeDefined()
  })

  it('publishes the additive plugins with their description', () => {
    expect(manifest.plugins).toEqual(
      Object.values(PLUGINS).map(plugin => ({ name: plugin.name, description: plugin.description }))
    )
  })

  it('leaves out everything that is not data (emission manifests stay in the generator)', () => {
    const serialized = JSON.stringify(manifest)

    expect(serialized).not.toContain('assets')
    expect(serialized).not.toContain('dependencies')
    expect(JSON.parse(serialized)).toEqual(manifest)
  })
})
