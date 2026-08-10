import type { ResourceDefinition } from '@acc/schema'
import { buildDragTree } from './drag-tree'
import { buildSubstitutions } from './build-substitutions'
import { MODELS } from './models/registry'

/**
 * Spec 38 · TASK-02: el ÁRBOL DE ARRASTRE. Quién cae cuando cae un padre se deriva del
 * registro (la misma derivación que alimenta las tablas relacionadas de la ficha,
 * ADR-002 punto 4) y se resuelve AL EMITIR, no en runtime: el use case recibe niveles
 * ya calculados y los marca en orden dentro de una sola transacción.
 */
describe('árbol de arrastre del borrado suave (spec 38)', () => {
  const entity = (name: string, refs?: { to: string; field: string }, softDelete?: boolean): ResourceDefinition =>
    ({
      schemaVersion: 1,
      name,
      plural: `${name}s`,
      context: 'demo',
      schemaName: 'demo',
      ...(softDelete === false ? { softDelete: false } : {}),
      fields: {
        id: { type: 'uuid', pk: true },
        ...(refs ? { [refs.field]: { type: 'uuid', relation: { to: refs.to, kind: 'reference' } } } : {})
      }
    }) as unknown as ResourceDefinition

  const cliente = entity('cliente')
  const instalacion = entity('instalacion', { to: 'cliente', field: 'clienteId' })
  const parte = entity('parte', { to: 'instalacion', field: 'instalacionId' })
  const registry = [cliente, instalacion, parte]

  it('un padre arrastra a sus hijos y a los hijos de sus hijos, por niveles', () => {
    expect(buildDragTree(cliente, registry)).toEqual([
      { entity: 'instalacion', plural: 'instalacions', fkField: 'clienteId', parent: 'cliente' },
      { entity: 'parte', plural: 'partes', fkField: 'instalacionId', parent: 'instalacion' }
    ])
  })

  it('el nivel intermedio arrastra solo lo que cuelga de él', () => {
    expect(buildDragTree(instalacion, registry)).toEqual([
      { entity: 'parte', plural: 'partes', fkField: 'instalacionId', parent: 'instalacion' }
    ])
  })

  it('una hoja no arrastra nada', () => {
    expect(buildDragTree(parte, registry)).toEqual([])
  })

  // Un hijo FÍSICO no tiene estado que marcar: se queda fuera del árbol, y con él su rama.
  it('un hijo con la escotilla física no entra en el árbol, ni sus descendientes', () => {
    const fisico = entity('material', { to: 'cliente', field: 'clienteId' }, false)
    const linea = entity('linea', { to: 'material', field: 'materialId' })

    expect(buildDragTree(cliente, [cliente, fisico, linea])).toEqual([])
  })

  // Sin esta guarda, un ciclo de referencias colgaría el generador
  it('un ciclo de referencias no repite entidades ni se cuelga', () => {
    const a = entity('a', { to: 'b', field: 'bId' })
    const b = entity('b', { to: 'a', field: 'aId' })

    expect(buildDragTree(a, [a, b]).map(level => level.entity)).toEqual(['b'])
  })
})

/**
 * El árbol viaja en las sustituciones ya calculado: la plantilla del use case solo
 * interpola niveles (regla 8), nunca recorre el registro.
 */
describe('el árbol viaja en las sustituciones', () => {
  it('la demo Solaris: cliente arrastra instalaciones y partes; material no arrastra (es físico)', () => {
    const registry = [MODELS['account'], MODELS['installation'], MODELS['worklog'], MODELS['material']]

    expect(buildSubstitutions(MODELS['account'], registry).dragTree).toEqual([
      { entity: 'installation', plural: 'installations', fkField: 'accountId', parent: 'account' },
      { entity: 'worklog', plural: 'worklogs', fkField: 'installationId', parent: 'installation' }
    ])
    expect(buildSubstitutions(MODELS['material'], registry).dragTree).toEqual([])
  })
})
