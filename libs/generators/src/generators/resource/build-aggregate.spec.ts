import type { ResourceDefinition } from '@acc/schema'
import { renderAggregate } from './build-aggregate'

/**
 * Bug cazado por el typecheck del estudio (spec 08): los campos SIN VO (snapshots
 * numéricos como currentUnits) emitían `this._x = .create(updates.x)` en update().
 * La fixture de oro congeló esa emisión rota en un re-baseline pasado.
 */
describe('renderAggregate — update() con campos sin VO', () => {
  const definition = {
    schemaVersion: 1,
    name: 'license',
    plural: 'licenses',
    context: 'crm',
    schemaName: 'crm',
    fields: {
      id: { type: 'uuid', pk: true },
      code: {
        type: 'string',
        vo: { name: 'LicenseCode', fieldName: 'License code' }
      },
      currentUnits: {
        type: 'number',
        column: { type: 'numeric', precision: 15, scale: 2, default: 0, transformer: 'numeric' }
      }
    }
  } as unknown as ResourceDefinition

  it('asigna el valor crudo cuando el campo no declara VO', () => {
    const guards = renderAggregate(definition).updateGuardBlocks.join('\n')

    expect(guards).toContain('this._currentUnits = updates.currentUnits')
    expect(guards).not.toContain('= .create(')
  })

  it('mantiene la creación por VO cuando el campo lo declara', () => {
    const guards = renderAggregate(definition).updateGuardBlocks.join('\n')

    expect(guards).toContain('this._code = LicenseCode.create(updates.code)')
  })
})
