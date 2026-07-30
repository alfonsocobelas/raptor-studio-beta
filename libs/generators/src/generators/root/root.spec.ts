import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import { Tree } from '@nx/devkit'
import { rootGenerator } from './root'

describe('root generator', () => {
  let tree: Tree

  beforeEach(async () => {
    tree = createTreeWithEmptyWorkspace()
    await rootGenerator(tree, {})
  })

  it('emits the composition root files', () => {
    expect(tree.exists('tmp/generated/root/root.module.ts')).toBe(true)
    expect(tree.exists('tmp/generated/root/main.ts')).toBe(true)
    expect(tree.exists('tmp/generated/root/environments/local.json')).toBe(true)
    expect(tree.exists('tmp/generated/root/environments/prod.json')).toBe(true)
  })

  it('wires one module per registered resource model', () => {
    const content = tree.read('tmp/generated/root/root.module.ts', 'utf-8') ?? ''
    for (const module of ['ContractsModule', 'CustomersModule', 'LicensesModule', 'ProjectsModule']) {
      expect(content).toMatch(new RegExp(`^    ${module},?$`, 'm'))
      expect(content).toContain(`import { ${module} }`)
    }
  })

  it('keeps secrets out of the prod template (vault markers only)', () => {
    const prod = tree.read('tmp/generated/root/environments/prod.json', 'utf-8') ?? ''
    expect(prod).toContain('vault.DB-PASSWORD')
    expect(prod).not.toMatch(/password":\s*"(?!vault\.)/)
  })
})
