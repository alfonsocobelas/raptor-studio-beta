import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import { Tree } from '@nx/devkit'
import { resourceGenerator } from './resource'

describe('local seed emission', () => {
  let tree: Tree

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace()
  })

  it('emits seeder + bootstrap + derived fixtures for writable resources', async () => {
    await resourceGenerator(tree, { name: 'customer' })

    const base = 'tmp/generated/customers/backend/infrastructure/seed'
    expect(tree.exists(`${base}/local-seeder.ts`)).toBe(true)
    expect(tree.exists(`${base}/local-seed.ts`)).toBe(true)

    const fixtures = tree.read(`${base}/local-seed.fixtures.ts`, 'utf-8') ?? ''
    expect(fixtures).toContain("sapId: 'SEED-CUSTOMER-1'")
    expect(fixtures).toContain('// @ai:begin seed-data')

    const seed = tree.read(`${base}/local-seed.ts`, 'utf-8') ?? ''
    expect(seed).toContain("if (env !== 'local')")
  })

  it('skips seed for read-only resources (no form)', async () => {
    await resourceGenerator(tree, { name: 'license' })
    expect(tree.exists('tmp/generated/licenses/backend/infrastructure/seed/local-seed.ts')).toBe(false)
  })

  it('derives relation ids with the related resource category (joinable across seeds)', async () => {
    await resourceGenerator(tree, { name: 'contract' })
    await resourceGenerator(tree, { name: 'customer' })

    const contractSeed =
      tree.read('tmp/generated/contracts/backend/infrastructure/seed/local-seed.fixtures.ts', 'utf-8') ?? ''
    const customerSeed =
      tree.read('tmp/generated/customers/backend/infrastructure/seed/local-seed.fixtures.ts', 'utf-8') ?? ''

    const customerIdInContract = contractSeed.match(/customerId: '([^']+)'/)?.[1]
    expect(customerIdInContract).toBeDefined()
    expect(customerSeed).toContain(`id: '${customerIdInContract}'`)
  })
})
