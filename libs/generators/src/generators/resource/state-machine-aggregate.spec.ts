import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import type { Tree } from '@nx/devkit'
import { resourceGenerator } from './resource'

/**
 * Spec 43 TASK-08: el agregado gana un método por transición (patrón archive() de la
 * referencia: no-op en destino, guarda por estado, salto) y el campo promovido deja de
 * pedirse: nace en initial() y sale del alta y de la edición en TODO el backend emitido.
 */
describe('el agregado con máquina de estados', () => {
  let tree: Tree
  const read = (path: string): string => tree.read(`out/${path}`, 'utf-8') ?? ''

  beforeAll(async () => {
    tree = createTreeWithEmptyWorkspace()
    await resourceGenerator(tree, { name: 'contract', directory: 'out' })
  })

  it('emite un método por transición con no-op, guarda y salto', () => {
    const aggregate = read('backend/domain/contract.ts')

    // terminate: from múltiple (active | expiring)
    expect(aggregate).toContain('terminate(): void {')
    expect(aggregate).toContain('if (this._status.isTerminated()) {')
    expect(aggregate).toMatch(/if \(!this\._status\.isActive\(\) && !this\._status\.isExpiring\(\)\)/)
    expect(aggregate).toContain('this._status = ContractStatus.terminated()')
    // expire: from simple
    expect(aggregate).toContain('expire(): void {')
    expect(aggregate).toMatch(/if \(!this\._status\.isExpiring\(\)\)/)
  })

  it('la guarda lanza el error de transición tipado, con el estado real en el mensaje', () => {
    const aggregate = read('backend/domain/contract.ts')
    const errors = read('backend/domain/contract-errors.ts')

    expect(aggregate).toContain('throw new ContractInvalidTransitionError(')
    expect(aggregate).toContain('`Cannot terminate a contract in status "${this._status.value}"`')
    expect(errors).toContain('export class ContractInvalidTransitionError')
  })

  it('la entidad nace en initial: el alta ya no pide el campo', () => {
    const aggregate = read('backend/domain/contract.ts')
    const types = read('backend/domain/contract-types.ts')

    expect(aggregate).toContain('ContractStatus.initial()')
    expect(types).not.toMatch(/RegisterContractProps[\s\S]{0,600}status/)
  })

  it('la edición tampoco lo toca: fuera de updateDetails y de sus props', () => {
    const aggregate = read('backend/domain/contract.ts')
    const types = read('backend/domain/contract-types.ts')

    expect(aggregate).not.toContain('updates.status')
    expect(types).toMatch(/UpdateProps = Partial<[\s\S]{0,400}'status'/)
  })

  it('los DTOs HTTP del alta y la edición dejan de ofrecerlo', () => {
    expect(read('backend/infrastructure/entrypoints/dtos/register-contract.dto.ts')).not.toContain('status')
    expect(read('backend/infrastructure/entrypoints/dtos/update-contract.dto.ts')).not.toContain('status')
  })

  it('la persistencia no cambia: el estado sigue viajando en primitives', () => {
    const aggregate = read('backend/domain/contract.ts')

    expect(aggregate).toContain('status: this._status.value')
    expect(aggregate).toMatch(/fromPrimitives[\s\S]*ContractStatus\.create\(props\.status\)/)
  })
})

/**
 * Bug cazado por typecheck-emitted (spec 46): el builder de tests pasaba el campo de
 * estado a Aggregate.create(), pero AggregateProps lo excluye (toda entidad nueva nace
 * en initial) → TS2353 en el emitido. El create() del builder no debe citarlo; el
 * build() (fromPrimitives) sí, que es como los tests montan un estado concreto.
 */
describe('el builder de tests con máquina de estados', () => {
  it('create() no pasa el campo de estado; build() lo conserva vía primitives', async () => {
    const tree = createTreeWithEmptyWorkspace()
    await resourceGenerator(tree, { name: 'contract', directory: 'out' })
    const builder = tree.read('out/backend-tests/contract.builder.ts', 'utf-8') ?? ''

    expect(builder).not.toContain('status: ContractStatus.create(this.props.status)')
    // el default de primitives y el withStatus siguen: build() monta cualquier estado
    expect(builder).toContain("status: 'active'")
    expect(builder).toContain('withStatus(status: string)')
  })
})
