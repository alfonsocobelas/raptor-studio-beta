import { Tree } from '@nx/devkit'
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import { applyPluginManifests } from '../app'
import { authPlugin } from './auth.plugin'
import { definePlugin } from './plugin'

const SKELETON_MAKEFILE = `.PHONY: help up down seed local-setup

seed:
\tNODE_ENV=local npm run seed

# Onboarding en un comando: base de datos + esquema + datos + API
local-setup: up
\tnpm install
\tsleep 6
\t$(MAKE) migrate
\t$(MAKE) seed
\t@echo "Listo. 'make api' (http://localhost:3000/api/v1) y 'make web' (http://localhost:4200)"
`

describe('applyPluginManifests — local-setup', () => {
  let tree: Tree

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace()
    tree.write('apps/demo/package.json', JSON.stringify({ scripts: {} }))
    tree.write('apps/demo/Makefile', SKELETON_MAKEFILE)
  })

  it('chains the plugin localSetupSteps into local-setup before the final echo', () => {
    applyPluginManifests(tree, 'apps/demo', [authPlugin])

    const makefile = tree.read('apps/demo/Makefile', 'utf-8') ?? ''
    const localSetup = makefile.slice(makefile.indexOf('local-setup: up'))
    const seedAuthAt = localSetup.indexOf('$(MAKE) seed-auth')
    expect(seedAuthAt).toBeGreaterThan(-1)
    expect(seedAuthAt).toBeGreaterThan(localSetup.indexOf('$(MAKE) seed'))
    expect(seedAuthAt).toBeLessThan(localSetup.indexOf('@echo'))
  })

  it('auth plugin declares seed-auth as a local-setup step', () => {
    expect(authPlugin.localSetupSteps).toEqual(['seed-auth'])
  })

  /**
   * Spec 76: el esqueleto invoca `$(MAKE) migrate`, pero el target lo aporta el plugin de
   * migraciones — que el motor mongo excluye. Sin plugin que lo declare, `make local-setup`
   * moría con "No rule to make target 'migrate'" en toda app mongo.
   */
  it('strips the migrate step when no plugin provides the migrate target', () => {
    const bare = definePlugin({ name: 'bare', description: 'sin migrate', makeTargets: { extra: '\techo extra' } })

    applyPluginManifests(tree, 'apps/demo', [bare], { mongoose: '^8.0.0' })

    const makefile = tree.read('apps/demo/Makefile', 'utf-8') ?? ''
    expect(makefile).not.toContain('$(MAKE) migrate')
    expect(makefile).toContain('$(MAKE) seed')
  })

  it('keeps the migrate step when a plugin provides the target', () => {
    const migrations = definePlugin({
      name: 'migrations',
      description: 'aporta migrate',
      makeTargets: { migrate: '\tNODE_ENV=local npm run migration:run' }
    })

    applyPluginManifests(tree, 'apps/demo', [migrations])

    const makefile = tree.read('apps/demo/Makefile', 'utf-8') ?? ''
    expect(makefile).toContain('$(MAKE) migrate')
  })

  it('leaves local-setup untouched for plugins without localSetupSteps', () => {
    const bare = definePlugin({ name: 'bare', description: 'sin pasos', makeTargets: { extra: '\techo extra' } })

    applyPluginManifests(tree, 'apps/demo', [bare])

    const makefile = tree.read('apps/demo/Makefile', 'utf-8') ?? ''
    expect(makefile).toContain('extra:\n\techo extra')
    const localSetup = makefile.slice(makefile.indexOf('local-setup: up'), makefile.indexOf('@echo'))
    expect(localSetup).not.toContain('extra')
  })
})
