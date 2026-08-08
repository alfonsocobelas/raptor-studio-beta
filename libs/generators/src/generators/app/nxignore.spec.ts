import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import { ignoreNestedWorkspace } from './nxignore'

/**
 * Una app generada es un workspace Nx ANIDADO: si el workspace padre la escanea,
 * sus libs de UI chocan por nombre con las de cualquier otra app generada y
 * rompen el grafo de proyectos (visto al generar la segunda demo).
 */
describe('ignoreNestedWorkspace', () => {
  it('crea .nxignore con la app cuando no existe', () => {
    const tree = createTreeWithEmptyWorkspace()

    ignoreNestedWorkspace(tree, 'apps/vetcare')

    expect(tree.read('.nxignore', 'utf-8')).toContain('apps/vetcare')
  })

  it('añade la app al .nxignore existente sin tocar lo demás', () => {
    const tree = createTreeWithEmptyWorkspace()
    tree.write('.nxignore', '.angular\napps/boutique\n')

    ignoreNestedWorkspace(tree, 'apps/vetcare')

    const content = tree.read('.nxignore', 'utf-8') ?? ''
    expect(content).toContain('.angular')
    expect(content).toContain('apps/boutique')
    expect(content).toContain('apps/vetcare')
  })

  it('no duplica una entrada ya presente', () => {
    const tree = createTreeWithEmptyWorkspace()
    tree.write('.nxignore', 'apps/vetcare\n')

    ignoreNestedWorkspace(tree, 'apps/vetcare')

    expect((tree.read('.nxignore', 'utf-8') ?? '').match(/apps\/vetcare/g)).toHaveLength(1)
  })

  it('normaliza rutas con barra final', () => {
    const tree = createTreeWithEmptyWorkspace()
    tree.write('.nxignore', 'apps/vetcare\n')

    ignoreNestedWorkspace(tree, 'apps/vetcare/')

    expect((tree.read('.nxignore', 'utf-8') ?? '').match(/apps\/vetcare/g)).toHaveLength(1)
  })

  it('no añade nada si un patrón con comodín ya cubre la ruta', () => {
    // los tmp por ejecución del gate de oro (tmp/generated-<pid>/…) se cubren con
    // un glob; sin esto, cada corrida del gate añadía dos líneas al .nxignore
    const tree = createTreeWithEmptyWorkspace()
    tree.write('.nxignore', 'tmp/generated-*\n')

    ignoreNestedWorkspace(tree, 'tmp/generated-83014/app-golden')

    expect(tree.read('.nxignore', 'utf-8')).toBe('tmp/generated-*\n')
  })

  it('un patrón que no cubre la ruta no impide añadirla', () => {
    const tree = createTreeWithEmptyWorkspace()
    tree.write('.nxignore', 'tmp/generated-*\n')

    ignoreNestedWorkspace(tree, 'apps/vetcare')

    expect(tree.read('.nxignore', 'utf-8')).toContain('apps/vetcare')
  })

  it('no toca nada si la app se genera en la raíz del propio workspace', () => {
    const tree = createTreeWithEmptyWorkspace()

    ignoreNestedWorkspace(tree, '')

    expect(tree.exists('.nxignore')).toBe(false)
  })
})
