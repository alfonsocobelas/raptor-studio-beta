import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import type { Tree } from '@nx/devkit'
import { appGenerator } from './app'

/**
 * TASK-03 (spec 55): toda app con auth emite rate limiting por IP — global por config
 * y límites duros en los endpoints sensibles a abuso. Sin auth no hay superficie
 * pública que proteger y no se emite nada del throttler.
 */
describe('app generator — rate limiting con auth', () => {
  const generate = async (options: Parameters<typeof appGenerator>[1]): Promise<Tree> => {
    const tree: Tree = createTreeWithEmptyWorkspace()
    await appGenerator(tree, options)
    return tree
  }

  const base = { name: 'demo', models: 'contract', skipInstall: true } as const
  const BACKEND = 'apps/demo/libs/backend'
  const RATE_LIMIT = `${BACKEND}/src/contexts/shared/infrastructure/rate-limit`

  describe('con auth single-tenant', () => {
    let tree: Tree

    beforeAll(async () => {
      tree = await generate({ ...base, auth: 'single-tenant' })
    })

    it('emite el módulo de rate limit con sus piezas', () => {
      expect(tree.exists(`${RATE_LIMIT}/rate-limit.module.ts`)).toBe(true)
      expect(tree.exists(`${RATE_LIMIT}/client-ip.ts`)).toBe(true)
      expect(tree.exists(`${RATE_LIMIT}/rate-limit.constants.ts`)).toBe(true)
    })

    it('el storage por defecto es la memoria del throttler (una réplica, caso canónico)', () => {
      const module = tree.read(`${RATE_LIMIT}/rate-limit.module.ts`, 'utf-8') ?? ''

      expect(module).toContain('ThrottlerModule.forRootAsync')
      expect(module).not.toContain('Redis')
    })

    it('registra RateLimitModule en el root ANTES de AuthModule (corta el flood antes de tocar la DB)', () => {
      const root = tree.read(`${BACKEND}/src/root.module.ts`, 'utf-8') ?? ''

      expect(root).toContain('RateLimitModule')
      expect(root.indexOf('RateLimitModule,')).toBeLessThan(root.indexOf('AuthModule,'))
    })

    it('registra el módulo aunque prettier colapse el array imports en una línea (trampa spec 51)', async () => {
      // simulate la forma prettificada: se genera y se re-aplana el root antes de volver a comprobar
      const root = tree.read(`${BACKEND}/src/root.module.ts`, 'utf-8') ?? ''
      // la ancla no puede depender de la indentación: la primera coincidencia de 'HealthModule,'
      // está siempre dentro del array (la línea de import lleva '}')
      expect(root).toMatch(/HealthModule,\s*RateLimitModule,\s*AuthModule,/)
    })

    it('la sección rateLimit entra en tipos, validación y todos los entornos', () => {
      const types = tree.read(`${BACKEND}/src/contexts/shared/infrastructure/config/config-types.ts`, 'utf-8') ?? ''
      const validation =
        tree.read(`${BACKEND}/src/contexts/shared/infrastructure/config/config-validation.ts`, 'utf-8') ?? ''

      expect(types).toContain('RateLimitConfig')
      expect(types).toContain('trustedProxyHops')
      expect(validation).toContain('RateLimitValidator')

      for (const env of ['local', 'dev', 'qa', 'prod', 'test']) {
        const raw = tree.read(`${BACKEND}/src/contexts/shared/infrastructure/config/environments/${env}.json`, 'utf-8')
        const config = JSON.parse(raw ?? '{}') as { rateLimit?: { globalLimit: number; trustedProxyHops: number } }

        expect(config.rateLimit).toBeDefined()
        // el default emitido es 0 saltos: sin proxy delante, la IP del socket es la buena.
        // El 3 de la referencia era SU topología medida — cada despliegue re-mide la suya.
        expect(config.rateLimit?.trustedProxyHops).toBe(0)
      }
    })

    it('la suite e2e no se auto-limita: el límite global de test es varios órdenes mayor', () => {
      const test = JSON.parse(
        tree.read(`${BACKEND}/src/contexts/shared/infrastructure/config/environments/test.json`, 'utf-8') ?? '{}'
      ) as { rateLimit?: { globalLimit: number } }
      const local = JSON.parse(
        tree.read(`${BACKEND}/src/contexts/shared/infrastructure/config/environments/local.json`, 'utf-8') ?? '{}'
      ) as { rateLimit?: { globalLimit: number } }

      expect((test.rateLimit?.globalLimit ?? 0) / (local.rateLimit?.globalLimit ?? 1)).toBeGreaterThanOrEqual(1000)
    })

    it('los endpoints sensibles llevan @Throttle con los límites de las constantes', () => {
      const controller =
        tree.read(`${BACKEND}/src/contexts/iam/modules/auth/infrastructure/entrypoints/auth.controller.ts`, 'utf-8') ??
        ''

      expect(controller).toContain('AUTH_RATE_LIMITS.LOGIN')
      expect(controller).toContain('AUTH_RATE_LIMITS.FORGOT_PASSWORD')
      expect(controller).toContain('AUTH_RATE_LIMITS.TOKEN_REDEMPTION')
    })

    it('health queda fuera del límite global (las sondas de readiness no son abuso)', () => {
      const health =
        tree.read(`${BACKEND}/src/contexts/shared/infrastructure/health/health.controller.ts`, 'utf-8') ?? ''

      expect(health).toContain('@SkipThrottle({ global: true })')
    })

    it('declara @nestjs/throttler en el package.json emitido', () => {
      const pkg = JSON.parse(tree.read('apps/demo/package.json', 'utf-8') ?? '{}') as {
        dependencies?: Record<string, string>
      }

      expect(pkg.dependencies?.['@nestjs/throttler']).toBeDefined()
    })

    it('emite el test del extractor de IP junto al resto de la suite del emitido', () => {
      expect(tree.exists(`${BACKEND}/tests/shared/rate-limit/client-ip.test.ts`)).toBe(true)
    })
  })

  it('con metrics activo, el raspado queda fuera del límite global (tráfico interno cada pocos segundos)', async () => {
    const tree = await generate({ ...base, auth: 'single-tenant', plugins: 'metrics' })
    const controller =
      tree.read('apps/demo/libs/backend/src/contexts/shared/infrastructure/metrics/metrics.controller.ts', 'utf-8') ??
      ''

    expect(controller).toContain('@SkipThrottle({ global: true })')
  })

  it('metrics sin auth (mongo) no importa el throttler (la dependencia no existe en esa app)', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined)
    const tree = await generate({ ...base, database: 'mongo', plugins: 'metrics' })
    warn.mockRestore()
    const controller =
      tree.read('apps/demo/libs/backend/src/contexts/shared/infrastructure/metrics/metrics.controller.ts', 'utf-8') ??
      ''

    expect(controller).not.toContain('throttler')
  })

  it('sin auth (mongo, downgrade spec 58) no se emite nada del throttler', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined)
    const tree = await generate({ ...base, database: 'mongo' })
    warn.mockRestore()

    expect(tree.exists(`${RATE_LIMIT}/rate-limit.module.ts`)).toBe(false)
    const root = tree.read(`${BACKEND}/src/root.module.ts`, 'utf-8') ?? ''
    expect(root).not.toContain('RateLimitModule')
    const pkg = JSON.parse(tree.read('apps/demo/package.json', 'utf-8') ?? '{}') as {
      dependencies?: Record<string, string>
    }
    expect(pkg.dependencies?.['@nestjs/throttler']).toBeUndefined()
  })
})
