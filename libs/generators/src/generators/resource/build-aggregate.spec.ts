import type { ResourceDefinition } from '@raptor/schema'
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

/**
 * Spec 27, TASK-07: un campo `date` con voShared y nullable — sin `unset`, sin ser maintenance —
 * caía en la rama de los strings: `ContractDate.create(props.contractEndDate ?? \'\')` no compila
 * (create espera Date). El canon construye con `new Date(...)` y cae a null (license.ts:131/151/216).
 */
describe('renderAggregate — date compartido nullable (contractEndDate del canon)', () => {
  const definition = {
    schemaVersion: 1,
    name: 'license',
    plural: 'licenses',
    context: 'crm',
    schemaName: 'crm',
    fields: {
      id: { type: 'uuid', pk: true },
      // sin al menos un VO propio el agregado no se emite (emptyBindings)
      code: { type: 'string', vo: { name: 'LicenseCode', fieldName: 'License code' } },
      contractEndDate: {
        type: 'date',
        nullable: true,
        voShared: { name: 'ContractDate' },
        column: { type: 'date', tsType: 'Nullable<string>' }
      }
    }
  } as unknown as ResourceDefinition

  it('register construye con new Date y cae a null', () => {
    const args = renderAggregate(definition).registerArgs.join('\n')

    expect(args).toContain(
      'contractEndDate: props.contractEndDate ? ContractDate.create(new Date(props.contractEndDate)) : null'
    )
  })

  it('fromPrimitives construye con new Date y cae a null', () => {
    const args = renderAggregate(definition).fromPrimitivesArgs.join('\n')

    expect(args).toContain('props.contractEndDate ? ContractDate.create(new Date(props.contractEndDate)) : null')
  })

  it('update construye con new Date y cae a null', () => {
    const guards = renderAggregate(definition).updateGuardBlocks.join('\n')

    expect(guards).toContain(
      'this._contractEndDate = updates.contractEndDate ? ContractDate.create(new Date(updates.contractEndDate)) : null'
    )
  })

  it('con unset declarado, el vacío es el null con nombre (upcomingMaintenanceEnd del canon)', () => {
    const withUnset = {
      ...definition,
      fields: {
        id: { type: 'uuid', pk: true },
        code: { type: 'string', vo: { name: 'LicenseCode', fieldName: 'License code' } },
        upcomingMaintenanceEnd: {
          type: 'date',
          nullable: true,
          voShared: { name: 'ContractDate', unset: true },
          column: { type: 'date', tsType: 'Nullable<string>' }
        }
      }
    } as unknown as ResourceDefinition
    const rendered = renderAggregate(withUnset)

    expect(rendered.registerArgs.join('\n')).toContain(
      'props.upcomingMaintenanceEnd ? ContractDate.create(new Date(props.upcomingMaintenanceEnd)) : ContractDate.unset()'
    )
  })
})
