import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import type { Tree } from '@nx/devkit'
import { registerModels, MODELS } from './models/registry'
import { resourceGenerator } from './resource'

/**
 * Defecto vivo (demo veterinaria 2026-08-24): el arrastre del borrado suave (spec 38)
 * hace que el módulo del PADRE importe a sus hijos, y la desnormalización (spec 60)
 * hace que el módulo CONSUMIDOR importe a su origen. Con cualquier ref entre dos
 * entidades con borrado suave, las dos direcciones conviven y el ciclo de imports ES
 * deja la clase del módulo `undefined` al evaluar: tsc compila, Nest muere al arrancar
 * («The module at index [0] of the ... "imports" array is undefined»).
 *
 * La salida canónica de Nest es forwardRef(() => Modulo) en los imports cruzados: los
 * tokens de los repositorios viven en ficheros de dominio sin ciclo, así que basta con
 * diferir la evaluación de la clase del módulo.
 */
describe('resource generator — imports cruzados de módulo con forwardRef', () => {
  const emit = async (name: string): Promise<Tree> => {
    registerModels([MODELS['account'], MODELS['installation'], MODELS['worklog'], MODELS['material']])
    const tree: Tree = createTreeWithEmptyWorkspace()
    await resourceGenerator(tree, { name, directory: 'out' })
    return tree
  }
  const read = (tree: Tree, path: string): string => tree.read(path, 'utf-8') ?? ''

  it('el módulo del padre difiere los módulos de su árbol de arrastre', async () => {
    const module = read(await emit('account'), 'out/backend/accounts.module.ts')

    expect(module).toContain("import { forwardRef, Module } from '@nestjs/common'")
    expect(module).toMatch(
      /imports: \[[^\]]*forwardRef\(\(\) => InstallationsModule\), forwardRef\(\(\) => WorklogsModule\)/
    )
    expect(module).not.toMatch(/imports: \[[^\]]*(?<!\(\) => )InstallationsModule/)
  })

  it('el módulo consumidor difiere el módulo de su origen de denormalización', async () => {
    const module = read(await emit('installation'), 'out/backend/installations.module.ts')

    expect(module).toMatch(/forwardRef\(\(\) => AccountsModule\)/)
  })

  it('un módulo sin imports cruzados no arrastra forwardRef', async () => {
    const module = read(await emit('material'), 'out/backend/materials.module.ts')

    expect(module).toContain("import { Module } from '@nestjs/common'")
    expect(module).not.toContain('forwardRef')
  })
})
