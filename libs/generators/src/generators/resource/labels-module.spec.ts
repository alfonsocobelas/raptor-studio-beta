import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import type { Tree } from '@nx/devkit'
import { resourceGenerator } from './resource'

/**
 * Resto de la spec 04: `labelsModule: true` promete un `<entity>-labels.ts` que el
 * dialog y el listado ya importan — pero ningún generador lo emitía y la app de oro
 * no compilaba al servir. Las etiquetas salen del propio modelo: badgeMap del
 * listado, options del formulario y el valor capitalizado como último recurso.
 */
describe('resource generator — módulo de labels (spec 04)', () => {
  const emit = async (name: string): Promise<Tree> => {
    const tree: Tree = createTreeWithEmptyWorkspace()
    await resourceGenerator(tree, { name, directory: 'out' })
    return tree
  }

  it('contract emite contract-labels.ts con un Record exhaustivo por enum', async () => {
    const tree = await emit('contract')

    const labels = tree.read('out/frontend/contract-labels.ts', 'utf-8') ?? ''
    expect(labels).toContain('ContractTypeEnum,')
    expect(labels).toContain("/shared/domain'")
    expect(labels).toContain('export const CONTRACT_TYPE_LABELS: Record<ContractTypeEnum, string> = {')
    // la etiqueta sale de las options del formulario…
    expect(labels).toContain("[ContractTypeEnum.CLOUD]: 'Cloud'")
    expect(labels).toContain("[ContractTypeEnum.ONPREM]: 'On-premise'")
    // …y los valores que el formulario no ofrece (los siembra el sync) del badgeMap o capitalizados
    expect(labels).toMatch(/\[ContractTypeEnum\.MIXED\]: '/)
    expect(labels).toMatch(/\[ContractTypeEnum\.MAINTENANCE\]: '/)
    expect(labels).toContain('export const RENEWAL_TYPE_LABELS: Record<RenewalTypeEnum, string> = {')
    expect(labels).toContain('export const BILLING_FREQUENCY_LABELS: Record<BillingFrequencyEnum, string> = {')
  })

  it('customer (sin labelsModule) no emite el fichero', async () => {
    const tree = await emit('customer')

    expect(tree.exists('out/frontend/customer-labels.ts')).toBe(false)
  })

  it('el mock emitido solo usa como VALOR los enums reales; las unions van como literal', async () => {
    const customer = await emit('customer')
    const contract = await emit('contract')

    // CustomerClassification es un type union (canon): usarlo como valor no compila al servir
    const customerMock = customer.read('out/frontend/mocks/customer.mock.ts', 'utf-8') ?? ''
    expect(customerMock).not.toContain('CustomerClassification.')
    expect(customerMock).not.toContain('import { CustomerDto, CustomerClassification')
    expect(customerMock).toMatch(/customerType: '(cloud|onprem|hybrid)'/)

    const contractMock = contract.read('out/frontend/mocks/contract.mock.ts', 'utf-8') ?? ''
    expect(contractMock).toContain('ContractTypeEnum.CLOUD')
  })
})
