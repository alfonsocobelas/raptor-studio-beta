import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import { stripAiSlotsGenerator } from './strip-ai-slots'

describe('strip-ai-slots generator (paso de entrega)', () => {
  it('strips the marker lines from every file under the directory, keeping the content', async () => {
    const tree = createTreeWithEmptyWorkspace()
    tree.write(
      'apps/demo/libs/backend/customer.ts',
      'class Customer {\n  // @ai:begin domain-extra — métodos de negocio\n  hasTaxId(): boolean {\n    return true\n  }\n  // @ai:end\n}\n'
    )
    tree.write(
      'apps/demo/libs/frontend/dashboard.component.ts',
      '<section>\n  <!-- @ai:begin dashboard-extra — secciones de dominio -->\n  <p>Ventas</p>\n  <!-- @ai:end -->\n</section>\n'
    )

    await stripAiSlotsGenerator(tree, { directory: 'apps/demo' })

    expect(tree.read('apps/demo/libs/backend/customer.ts', 'utf-8')).toBe(
      'class Customer {\n  hasTaxId(): boolean {\n    return true\n  }\n}\n'
    )
    expect(tree.read('apps/demo/libs/frontend/dashboard.component.ts', 'utf-8')).toBe(
      '<section>\n  <p>Ventas</p>\n</section>\n'
    )
  })

  it('does not touch files outside the requested directory', async () => {
    const tree = createTreeWithEmptyWorkspace()
    tree.write('apps/otra/a.ts', '// @ai:begin x\n// @ai:end\n')
    tree.write('apps/demo/b.ts', '// @ai:begin y\n// @ai:end\n')

    await stripAiSlotsGenerator(tree, { directory: 'apps/demo' })

    expect(tree.read('apps/otra/a.ts', 'utf-8')).toBe('// @ai:begin x\n// @ai:end\n')
    expect(tree.read('apps/demo/b.ts', 'utf-8')).toBe('')
  })

  it('strips apps listed in .nxignore (la app emitida es un workspace anidado ignorado)', async () => {
    // GIVEN: la app emitida siempre entra en .nxignore — el strip no puede saltársela
    const tree = createTreeWithEmptyWorkspace()
    tree.write('.nxignore', 'apps/demo\n')
    tree.write('apps/demo/a.ts', 'const a = 1\n// @ai:begin x\n// @ai:end\n')

    await stripAiSlotsGenerator(tree, { directory: 'apps/demo' })

    expect(tree.read('apps/demo/a.ts', 'utf-8')).toBe('const a = 1\n')
  })

  it('fails loudly when the directory does not exist (guardarraíl de entrega)', async () => {
    const tree = createTreeWithEmptyWorkspace()

    await expect(stripAiSlotsGenerator(tree, { directory: 'apps/no-existe' })).rejects.toThrow('apps/no-existe')
  })
})
