import { Tree } from '@nx/devkit'
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import { authPlugin } from './auth.plugin'
import type { PluginContext } from './plugin'

const APP_CONFIG = `import { apiBaseUrlInterceptor } from '@app/frontend/core/http/api-base-url.interceptor'
import { routes } from './app.routes'
import { devAuthProvider } from './dev-auth'

export const appConfig = {
  providers: [
    // Sin authInterceptor: el proyecto generado no trae módulo de auth todavía.
    provideHttpClient(withInterceptors([apiBaseUrlInterceptor])),
    devAuthProvider,
    { provide: LOCALE_ID, useValue: 'es-ES' }
  ]
}
`

const context: PluginContext = {
  root: 'apps/demo',
  appName: 'demo',
  backendSrc: 'apps/demo/libs/backend/src',
  frontendSrc: 'apps/demo/libs/frontend/src',
  models: [],
  scope: '@app',
  sessionStore: 'postgres',
  infra: 'none'
}

describe('authPlugin — cableado del app.config frontend', () => {
  let tree: Tree

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace()
    tree.write('apps/demo/apps/frontend-app/src/app.config.ts', APP_CONFIG)
    tree.write('apps/demo/apps/frontend-app/src/dev-auth.ts', '// stub')
  })

  it('añade el authInterceptor y elimina el comentario que dice que no hay auth', () => {
    authPlugin.apply?.(tree, context)

    const config = tree.read('apps/demo/apps/frontend-app/src/app.config.ts', 'utf-8') ?? ''
    expect(config).toContain('withInterceptors([apiBaseUrlInterceptor, authInterceptor])')
    // el comentario del esqueleto quedaría mintiendo al lado del interceptor real
    expect(config).not.toContain('Sin authInterceptor')
  })

  it('retira el proveedor de auth de desarrollo', () => {
    authPlugin.apply?.(tree, context)

    const config = tree.read('apps/demo/apps/frontend-app/src/app.config.ts', 'utf-8') ?? ''
    expect(config).not.toContain('devAuthProvider')
    expect(tree.exists('apps/demo/apps/frontend-app/src/dev-auth.ts')).toBe(false)
  })
})
