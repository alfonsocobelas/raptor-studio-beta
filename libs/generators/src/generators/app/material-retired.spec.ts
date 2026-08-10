import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import type { Tree } from '@nx/devkit'
import { appGenerator } from './app'
import { SLOTS } from './plugins/slots'

/**
 * Spec 36: se retira la piel material. Medido el 2026-08-09, las dos pieles emitían apps
 * indistinguibles (12 ficheros distintos de ~750; listado y diálogo idénticos byte a byte),
 * y mantenerla costaba una segunda implementación por cada componente del kernel.
 *
 * La variedad visual la lleva ahora la ranura `design` (presets, spec 37). Lo que NO se retira:
 * los contratos UI neutrales ni la ranura `ui` — es el punto de re-entrada si un cliente exige
 * Angular Material. Recuperable de git: último commit con material vivo en `103f24d`.
 */
describe('app generator — la piel material está retirada (spec 36)', () => {
  it('la ranura ui solo ofrece spartan', () => {
    expect(SLOTS['ui'].providers.map(p => p.value)).toEqual(['spartan'])
  })

  it('--ui=material falla antes de emitir nada, diciendo qué queda disponible', async () => {
    const tree: Tree = createTreeWithEmptyWorkspace()
    const preexisting = tree.listChanges().length

    // el tipo UiLibrary ya solo admite 'spartan' (rechazado en compilación); un valor no
    // registrado llega igual desde el CLI real, así que el runtime debe rechazarlo también
    await expect(
      appGenerator(tree, { name: 'demo', models: 'contract', ui: 'material' as never, skipInstall: true })
    ).rejects.toThrow(/Unknown ui 'material'.*spartan/)
    expect(tree.listChanges()).toHaveLength(preexisting)
  })

  it('el package.json emitido no declara Angular Material como dependencia', async () => {
    const tree: Tree = createTreeWithEmptyWorkspace()
    await appGenerator(tree, { name: 'demo', models: 'contract', skipInstall: true })

    const pkg = JSON.parse(tree.read('apps/demo/package.json', 'utf-8') ?? '{}') as {
      dependencies: Record<string, string>
    }
    expect(pkg.dependencies['@angular/material']).toBeUndefined()
    expect(pkg.dependencies['@fontsource/roboto']).toBeUndefined()
    // @angular/cdk SÍ se conserva: lo usan las primitivas headless de spartan (brain)
    expect(pkg.dependencies['@angular/cdk']).toBeDefined()
  })

  it('el guard de límites de UI sigue vigilando que ninguna pantalla importe Angular Material', async () => {
    // el script grepa el literal a propósito: si alguien reintroduce la piel a mano, esto lo caza
    const tree: Tree = createTreeWithEmptyWorkspace()
    await appGenerator(tree, { name: 'demo', models: 'contract', skipInstall: true })

    const pkg = JSON.parse(tree.read('apps/demo/package.json', 'utf-8') ?? '{}') as {
      scripts: Record<string, string>
    }
    expect(pkg.scripts['lint:ui-boundaries']).toContain('@angular/material')
  })
})
