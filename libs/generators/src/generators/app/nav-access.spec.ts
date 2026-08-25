import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import type { Tree } from '@nx/devkit'
import type { ResourceDefinition } from '@raptor/schema'
import { applyNavAccess, shellSubstitutions } from './app'
import { composeFlat } from './composition'

/**
 * Spec 46 TASK-04: la nav oculta la entrada de una entidad si el rol de sesión no tiene
 * Ver. Solo cuando ALGÚN modelo declara matriz cambia lo emitido (ausente = política
 * actual: todos ven todo y el golden no se mueve).
 */
const model = (name: string, plural: string, access?: ResourceDefinition['access']): ResourceDefinition =>
  ({
    schemaVersion: 1,
    name,
    plural,
    context: 'crm',
    schemaName: 'crm',
    fields: { id: { type: 'uuid', pk: true } },
    ...(access ? { access } : {})
  }) as ResourceDefinition

describe('shellSubstitutions — roles de Ver en la nav (spec 46)', () => {
  it('la entrada de un modelo con matriz lleva sus roles de Ver (admin implícito)', () => {
    const subs = shellSubstitutions(composeFlat([model('permit', 'permits', { view: ['user'] })], false))

    expect(subs.navItems).toContain("route: '/crm/permits', roles: [UserRoleEnum.ADMIN, UserRoleEnum.USER]")
    expect(subs.accessAnywhere).toBe(true)
  })

  it('sin matriz en ningún modelo, las entradas quedan como hoy', () => {
    const subs = shellSubstitutions(composeFlat([model('customer', 'customers')], false))

    expect(subs.navItems).not.toContain('roles:')
    expect(subs.accessAnywhere).toBe(false)
  })

  it('con matrices mezcladas, solo la entrada del modelo con matriz lleva roles', () => {
    const subs = shellSubstitutions(
      composeFlat([model('permit', 'permits', { view: [] }), model('customer', 'customers')], false)
    )

    expect(subs.navItems).toContain("route: '/crm/permits', roles: [UserRoleEnum.ADMIN]")
    expect(subs.navItems).toContain("{ label: 'customers', route: '/crm/customers' }")
    expect(subs.accessAnywhere).toBe(true)
  })
})

describe('applyNavAccess — el shell filtra la nav por rol de sesión', () => {
  const shell = [
    "import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core'",
    "import { NAV_ITEMS } from './nav'",
    'template: `',
    '          @for (item of navItems; track item.route) {',
    '`',
    'export class AppComponent {',
    '  protected readonly navItems = NAV_ITEMS',
    '}'
  ].join('\n')

  const patchedTree = (): Tree => {
    const tree = createTreeWithEmptyWorkspace()
    tree.write('apps/demo/apps/frontend-app/src/app.component.ts', shell)
    applyNavAccess(tree, 'apps/demo', '@app')
    return tree
  }

  it('inyecta AuthService y filtra NAV_ITEMS por el rol de sesión', () => {
    const patched = patchedTree().read('apps/demo/apps/frontend-app/src/app.component.ts', 'utf-8') ?? ''

    expect(patched).toContain("import { AuthService } from '@app/frontend/core/services/auth.service'")
    expect(patched).toContain('@for (item of navItems(); track item.route) {')
    expect(patched).toMatch(
      /NAV_ITEMS\.filter\(item => !item\.roles \|\| \(role !== undefined && item\.roles\.includes\(role\)\)\)/
    )
  })

  it('es idempotente: aplicarlo dos veces no duplica nada', () => {
    const tree = patchedTree()
    applyNavAccess(tree, 'apps/demo', '@app')
    const patched = tree.read('apps/demo/apps/frontend-app/src/app.component.ts', 'utf-8') ?? ''

    expect(patched.match(/AuthService/g)?.length).toBe(2)
  })
})
