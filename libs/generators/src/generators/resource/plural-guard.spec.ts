import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import resourceGenerator from './resource'
import { MODELS, registerModels } from './models/registry'
import type { ResourceDefinition } from '@raptor/schema'

/**
 * GUARD de pluralización. Los cuatro modelos de oro pluralizan todos en «+s»
 * (customers, contracts, licenses, projects), así que el gate no puede ver un
 * `${name}s` escrito a mano — y en castellano lo normal es lo contrario:
 * propiedad→propiedades, reparación→reparaciones, mes→meses.
 *
 * Este test genera una entidad de plural irregular con un hijo que la
 * referencia y BARRE todo lo emitido buscando el plural ingenuo. Cada vez que
 * alguien vuelva a escribir `${...}s`, esto falla; no hace falta otra demo.
 */
describe('guard de pluralización — nada emite «name + s»', () => {
  const propiedad = {
    ...MODELS['supplier'],
    name: 'propiedad',
    plural: 'propiedades',
    labels: { singular: 'Propiedad', plural: 'Propiedades' },
    detail: {},
    gallery: {}
  } as ResourceDefinition

  const visita = {
    ...MODELS['supplier'],
    name: 'visita',
    plural: 'visitas',
    labels: { singular: 'Visita', plural: 'Visitas' },
    detail: {},
    fields: {
      ...MODELS['supplier'].fields,
      propiedadId: {
        type: 'uuid',
        required: true,
        relation: { to: 'propiedad', kind: 'reference' },
        vo: { name: 'PropiedadId', fieldName: 'Propiedad' },
        form: {
          control: 'select',
          label: 'Propiedad',
          section: 'general',
          lookup: { resource: 'propiedad', labelField: 'name', denormalizes: 'propiedadName' }
        }
      },
      propiedadName: { type: 'string', table: { show: true, label: 'Propiedad' } }
    }
  } as unknown as ResourceDefinition

  /** Todo lo emitido para un recurso, concatenado con su ruta. */
  const emitAll = async (name: string): Promise<{ path: string; content: string }[]> => {
    registerModels([propiedad, visita])
    const tree = createTreeWithEmptyWorkspace()
    await resourceGenerator(tree, { name, directory: 'out' })
    return tree
      .listChanges()
      .filter(change => change.type !== 'DELETE')
      .map(change => ({ path: change.path, content: tree.read(change.path, 'utf-8') ?? '' }))
  }

  it('ningún fichero del hijo menciona «propiedads»', async () => {
    const files = await emitAll('visita')
    const offenders = files.filter(file => file.content.includes('propiedads') || file.path.includes('propiedads'))

    expect(offenders.map(file => file.path)).toEqual([])
  })

  it('ningún fichero del padre menciona «propiedads»', async () => {
    const files = await emitAll('propiedad')
    const offenders = files.filter(file => file.content.includes('propiedads') || file.path.includes('propiedads'))

    expect(offenders.map(file => file.path)).toEqual([])
  })

  it('el plural correcto sí aparece: el guard no pasa por estar vacío', async () => {
    const files = await emitAll('propiedad')

    expect(files.some(file => file.content.includes('propiedades'))).toBe(true)
  })
})
