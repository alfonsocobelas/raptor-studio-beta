import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import resourceGenerator from './resource'
import { MODELS, registerModels } from './models/registry'
import type { ResourceDefinition } from '@acc/schema'

/**
 * Defecto 17 (visto en fincaraiz): el VO de una referencia se importaba de
 * `value-objects/propiedads/`, pluralizando el nombre a mano. El plural del
 * modelo referenciado es DATO — sale del registro, no de añadir una «s».
 */
describe('resource generator — ruta del VO de una referencia', () => {
  const propiedad = {
    ...MODELS['supplier'],
    name: 'propiedad',
    plural: 'propiedades',
    labels: { singular: 'Propiedad', plural: 'Propiedades' }
  } as ResourceDefinition

  const visita = {
    ...MODELS['supplier'],
    name: 'visita',
    plural: 'visitas',
    labels: { singular: 'Visita', plural: 'Visitas' },
    // se parte de un modelo real para no quedarse sin campos filtrables/ordenables
    fields: {
      ...MODELS['supplier'].fields,
      propiedadId: {
        type: 'uuid',
        required: true,
        relation: { to: 'propiedad', kind: 'reference' },
        vo: { name: 'PropiedadId', fieldName: 'Propiedad' }
      }
    }
  } as unknown as ResourceDefinition

  it('importa el VO del padre por su plural real', async () => {
    registerModels([propiedad, visita])
    const tree = createTreeWithEmptyWorkspace()
    await resourceGenerator(tree, { name: 'visita', directory: 'out' })

    const aggregate = tree.read('out/backend/domain/visita.ts', 'utf-8') ?? ''
    const types = tree.read('out/backend/domain/visita-types.ts', 'utf-8') ?? ''

    for (const emitted of [aggregate, types]) {
      expect(emitted).toContain('value-objects/propiedades/propiedad-id.vo')
      expect(emitted).not.toContain('value-objects/propiedads/')
    }
  })
})
