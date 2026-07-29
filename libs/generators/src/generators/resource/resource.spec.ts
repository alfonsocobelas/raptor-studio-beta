import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import { Tree } from '@nx/devkit'
import { resourceGenerator } from './resource'

describe('resource generator', () => {
  let tree: Tree

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace()
  })

  it('throws a helpful error for an unknown model', async () => {
    await expect(resourceGenerator(tree, { name: 'nonexistent' })).rejects.toThrow(
      "Unknown resource model 'nonexistent'"
    )
  })

  it('expands the templates for a registered model into the default output dir', async () => {
    // WHEN
    await resourceGenerator(tree, { name: 'contract' })

    // THEN — the golden-diff working area receives the expanded templates
    const generated = tree.children('tmp/generated/contracts')
    expect(generated.length).toBeGreaterThan(0)
  })

  it('respects an explicit output directory', async () => {
    await resourceGenerator(tree, { name: 'contract', directory: 'tmp/probe' })

    expect(tree.children('tmp/probe').length).toBeGreaterThan(0)
  })
})
