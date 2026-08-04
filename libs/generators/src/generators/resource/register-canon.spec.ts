import { renderAggregate } from './build-aggregate'
import { project } from './models/project.model'
import { contract } from './models/contract.model'
import { license } from './models/license.model'
import { renderDomainTests } from './build-tests'

/**
 * TASK-04 (spec 26): qué campos pide el ALTA.
 *
 * El canon (`docs/referencia/.../project.ts:116`) no toma del llamante los campos que un registro
 * recién creado no puede conocer — los datos de oleada los rellena el sync después: los inicializa
 * a `null` literal. El generador los pasaba desde `props`, donde el tipo los declara opcionales, y
 * por eso el agregado emitido no compilaba.
 *
 * La regla se midió contra el canon campo por campo: `optionalPrimitive` + `nullable` ⟺ el alta no
 * lo pide (6 de 6 en project), y su ausencia ⟺ sí lo pide (6 de 6, incluido `customerName`, que no
 * tiene formulario pero sí es dato del alta).
 */
describe('renderAggregate — el alta sigue al canon', () => {
  it('project: los campos que el sync rellena entran como null literal', () => {
    const args = renderAggregate(project).registerArgs

    for (const field of ['sapProjectId', 'atRisk', 'inEscalation', 'nbrOfWaves', 'waveStage', 'waveStatus']) {
      expect(args).toContain(`${field}: null`)
    }
  })

  it('project: y no aparecen en el tipo de entrada del alta', () => {
    const lines = renderAggregate(project).registerPropsLines.join('\n')

    expect(lines).not.toMatch(/waveStage/)
    expect(lines).not.toMatch(/atRisk/)
  })

  it('lo que el alta sí conoce se sigue tomando de props, con su default', () => {
    const args = renderAggregate(project).registerArgs

    expect(args).toContain("description: ProjectDescription.create(props.description ?? '')")
    expect(args).toContain("status: ProjectStatus.create(props.status ?? 'planning')")
    expect(args.some(arg => arg.startsWith('customerName:'))).toBe(true)
  })

  it('no cambia nada en un modelo sin campos de ese tipo', () => {
    const args = renderAggregate(contract).registerArgs.join('\n')

    expect(args).toMatch(/create\(props\./)
  })
})

/**
 * TASK-04 (spec 26), segunda mitad: el valor de relleno tiene que ser del tipo del campo.
 *
 * `defaultLiteral` devolvía `''` para cualquier campo sin default de columna, así que un entero
 * salía como `LicensedUnits.create(props.licensedUnits ?? '')`. Y los campos SIN VO no recibían
 * relleno en el alta (`materialId: props.materialId`) aunque su primitive es opcional, mientras
 * `fromPrimitives` sí lo aplicaba: la misma decisión, dos respuestas.
 *
 * Canon: `docs/referencia/.../license.builder.ts:91` → `materialId: this.props.materialId ?? ''`.
 */
describe('renderAggregate — el relleno respeta el tipo del campo', () => {
  it('license: un entero se rellena con 0, no con la cadena vacía', () => {
    const args = renderAggregate(license).registerArgs.join('\n')

    expect(args).toContain('LicensedUnits.create(props.licensedUnits ?? 0)')
    expect(args).not.toContain("props.licensedUnits ?? ''")
  })

  it('license: los campos sin VO también reciben relleno en el alta', () => {
    const args = renderAggregate(license).registerArgs.join('\n')

    expect(args).toContain("materialId: props.materialId ?? ''")
    expect(args).toContain('currentUnits: props.currentUnits ?? 0')
  })
})

/**
 * TASK-04 (spec 26), tercera mitad: `unset()` sólo se invoca en los VOs que lo declaran.
 *
 * El builder emitido llamaba `SapProjectId.unset()` — un método que ese VO no tiene. El canon
 * distingue: `planToGoLive: … : ContractDate.unset()` (ContractDate lo declara) frente a
 * `sapProjectId: … : null` (`sap-project-id.vo.ts` no lo declara).
 */
describe('renderDomainTests — unset() sólo donde existe', () => {
  it('project: el builder usa null cuando el VO no declara unset()', () => {
    const args = renderDomainTests(project).builderCreateArgs.join('\n')

    expect(args).toContain('sapProjectId: this.props.sapProjectId != null ? SapProjectId.create(this.props.sapProjectId) : null')
  })

  it('project: y usa unset() en el VO que sí lo declara', () => {
    const args = renderDomainTests(project).builderCreateArgs.join('\n')

    expect(args).toContain('ContractDate.unset()')
  })

  it('license: un campo crudo no nulable se rellena con el literal de su tipo', () => {
    const args = renderDomainTests(license).builderCreateArgs.join('\n')

    expect(args).toContain("materialId: this.props.materialId ?? ''")
  })
})

/**
 * TASK-04 (spec 26), cuarta mitad: `unset` describe la CLASE del VO, no la nulabilidad del campo.
 *
 * `contract-value.vo.ts` declara `static unset(): Nullable<ContractValue>`, pero el agregado tiene
 * `_totalValue: ContractValue` (no nulable), así que el canon rellena con el default de la columna:
 * `docs/referencia/.../contract.ts:184` → `totalValue: ContractValue.create(props.totalValue ?? 0)`.
 * El generador emitía `ContractValue.unset()` y el agregado no compilaba.
 */
describe('renderAggregate — unset() sólo en campos nulables', () => {
  it('contract: un campo no nulable con VO que declara unset se rellena con su default', () => {
    const args = renderAggregate(contract).registerArgs.join('\n')

    expect(args).toContain('totalValue: ContractValue.create(props.totalValue ?? 0)')
    expect(args).not.toContain('totalValue: props.totalValue')
  })
})
