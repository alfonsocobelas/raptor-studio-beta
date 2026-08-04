import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import type { Tree } from '@nx/devkit'
import { readFileSync } from 'fs'
import * as path from 'path'
import { appGenerator } from './app'

/**
 * La app entregada al cliente debe formatear en el MISMO estilo que el código que
 * emitimos (sin punto y coma, comillas simples, 120 columnas). Sin config propia, el
 * prettier del editor del cliente reformatea a punto y coma y 80 columnas al primer
 * guardado: el estilo del acelerador se pierde en la primera sesión de trabajo.
 */
describe('app generator — estilo de la app emitida', () => {
  let tree: Tree

  beforeAll(async () => {
    tree = createTreeWithEmptyWorkspace()
    await appGenerator(tree, { name: 'demo', models: 'contract', skipInstall: true })
  })

  it('emite un .prettierrc con la convención del proyecto', () => {
    const config = JSON.parse(tree.read('apps/demo/.prettierrc', 'utf-8') ?? '{}')

    expect(config).toEqual({
      printWidth: 120,
      singleQuote: true,
      semi: false,
      trailingComma: 'none',
      arrowParens: 'avoid'
    })
  })

  it('usa la misma convención que el acelerador (una sola verdad de estilo)', () => {
    const emitted = JSON.parse(tree.read('apps/demo/.prettierrc', 'utf-8') ?? '{}')
    const own = JSON.parse(readFileSync(path.join(__dirname, '../../../../../.prettierrc'), 'utf-8'))

    expect(emitted).toEqual(own)
  })

  it('ignora los componentes Spartan vendorizados, que no son código del cliente', () => {
    const ignore = tree.read('apps/demo/.prettierignore', 'utf-8') ?? ''

    expect(ignore).toContain('/libs/ui')
    expect(ignore).toContain('/dist')
  })

  it('trae la herramienta y los scripts, para que la config no sea decorativa', () => {
    const pkg = JSON.parse(tree.read('apps/demo/package.json', 'utf-8') ?? '{}')

    expect(pkg.devDependencies.prettier).toBeDefined()
    expect(pkg.scripts.format).toBe('prettier --write .')
    expect(pkg.scripts['format:check']).toBe('prettier --check .')
  })
})
