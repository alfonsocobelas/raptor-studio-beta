import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import { Tree } from '@nx/devkit'
import { frontendKernelGenerator } from './frontend-kernel'

describe('frontend-kernel generator', () => {
  let tree: Tree

  beforeEach(async () => {
    tree = createTreeWithEmptyWorkspace()
    await frontendKernelGenerator(tree, {})
  })

  it('scaffolds the pieces the emitted components import', () => {
    for (const file of [
      'tmp/generated/frontend-kernel/shared/components/data-table.ts',
      'tmp/generated/frontend-kernel/shared/utils/download-file.ts',
      'tmp/generated/frontend-kernel/core/http/auth.interceptor.ts',
      'tmp/generated/frontend-kernel/core/guards/auth.guard.ts',
      'tmp/generated/frontend-kernel/core/services/auth.service.ts'
    ]) {
      expect(tree.exists(file)).toBe(true)
    }
  })

  it('parametrizes the shared DTO alias', async () => {
    const guard = tree.read('tmp/generated/frontend-kernel/core/guards/auth.guard.ts', 'utf-8') ?? ''
    expect(guard).toContain("from '@raptor/shared/domain'")
    expect(guard).not.toContain('sap-licenses')

    const custom = createTreeWithEmptyWorkspace()
    await frontendKernelGenerator(custom, { sharedDomainAlias: '@cliente/shared' })
    expect(custom.read('tmp/generated/frontend-kernel/core/guards/auth.guard.ts', 'utf-8')).toContain(
      "from '@cliente/shared'"
    )
  })
})
