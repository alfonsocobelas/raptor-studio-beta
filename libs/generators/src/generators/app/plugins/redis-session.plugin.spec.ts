import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import type { Tree } from '@nx/devkit'
import { appGenerator } from '../app'

/**
 * TASK-05 (spec 55): el proveedor redis de la ranura sessionStore trae su manifiesto:
 * el cliente ioredis compartido (una conexión para toda la app), la sección de config
 * por entorno, y el health check bloqueante — sin Redis no hay auth, así que el
 * readiness debe decir la verdad y sacar la réplica de rotación.
 */
describe('redisSession.plugin — infraestructura compartida de redis', () => {
  const generate = async (options: Parameters<typeof appGenerator>[1]): Promise<Tree> => {
    const tree: Tree = createTreeWithEmptyWorkspace()
    await appGenerator(tree, options)
    return tree
  }

  const base = { name: 'demo', models: 'contract', skipInstall: true, auth: 'single-tenant' } as const
  const SHARED = 'apps/demo/libs/backend/src/contexts/shared'
  const CONFIG = `${SHARED}/infrastructure/config`

  describe('sessionStore=redis', () => {
    let tree: Tree

    beforeAll(async () => {
      tree = await generate({ ...base, sessionStore: 'redis' })
    })

    it('emite el cliente compartido: módulo no global, opciones y token de inyección', () => {
      const module = tree.read(`${SHARED}/infrastructure/persistence/redis/redis.module.ts`, 'utf-8') ?? ''

      expect(module).toContain('REDIS_CLIENT')
      expect(module).toContain('onApplicationShutdown')
      expect(module).toContain('quit()')
      expect(module).not.toContain('@Global()')
      expect(tree.exists(`${SHARED}/infrastructure/persistence/redis/redis-client-options.ts`)).toBe(true)
      expect(tree.exists(`${SHARED}/infrastructure/persistence/redis/redis.constants.ts`)).toBe(true)
    })

    it('la sección redis entra en tipos, validación y entornos (prod vía vault, test en 6380)', () => {
      expect(tree.read(`${CONFIG}/config-types.ts`, 'utf-8') ?? '').toContain('RedisConfig')
      expect(tree.read(`${CONFIG}/config-validation.ts`, 'utf-8') ?? '').toContain('RedisValidator')

      const env = (name: string): { redis?: { host: string; port: number; tls: boolean } } =>
        JSON.parse(tree.read(`${CONFIG}/environments/${name}.json`, 'utf-8') ?? '{}')

      expect(env('local').redis).toEqual({ host: 'localhost', port: 6379, password: '', tls: false })
      expect(env('test').redis).toEqual({ host: 'localhost', port: 6380, password: '', tls: false })
      expect(env('prod').redis).toEqual({ host: 'vault.redis.host', port: 10000, password: 'vault.redis.password', tls: true })
    })

    it('el readiness hace PING a redis y es bloqueante (down ⇒ 503, la réplica sale de rotación)', () => {
      expect(tree.exists(`${SHARED}/infrastructure/health/redis-health.indicator.ts`)).toBe(true)

      const controller = tree.read(`${SHARED}/infrastructure/health/health.controller.ts`, 'utf-8') ?? ''
      expect(controller).toContain("this.redis.pingCheck('redis'")

      const module = tree.read(`${SHARED}/infrastructure/health/health.module.ts`, 'utf-8') ?? ''
      expect(module).toContain('RedisHealthIndicator')
      expect(module).toContain('RedisModule')
    })

    it('auth.module importa RedisModule (el repositorio inyecta el cliente compartido)', () => {
      const module = tree.read('apps/demo/libs/backend/src/contexts/iam/modules/auth/auth.module.ts', 'utf-8') ?? ''

      expect(module).toContain('RedisModule')
    })

    it('el compose local levanta redis 7 en 6379 y el de test en 6380 (convivencia local/test)', () => {
      const local = tree.read('apps/demo/docker/docker-compose.local.yml', 'utf-8') ?? ''
      const test = tree.read('apps/demo/docker/docker-compose.test.yml', 'utf-8') ?? ''

      expect(local).toContain('redis-local:')
      expect(local).toContain('image: redis:7-alpine')
      expect(local).toContain("'6379:6379'")
      // sin volumen a propósito: el estado es efímero (sesiones, rate limit)
      expect(local).not.toMatch(/redis-local-data/)
      expect(test).toContain('redis-test:')
      expect(test).toContain("'6380:6379'")
    })

    it('declara ioredis en el package.json emitido', () => {
      const pkg = JSON.parse(tree.read('apps/demo/package.json', 'utf-8') ?? '{}') as {
        dependencies?: Record<string, string>
      }

      expect(pkg.dependencies?.['ioredis']).toBeDefined()
    })
  })

  it('con infra=azure emite Azure Managed Redis con NoEviction y los secretos en Key Vault', async () => {
    const tree = await generate({ ...base, sessionStore: 'redis', infra: 'azure' })

    const managedRedis = tree.read('apps/demo/iac/managed-redis.tf', 'utf-8') ?? ''
    expect(managedRedis).toContain('azurerm_managed_redis')
    // fuente de verdad de sesiones: bajo presión de memoria, escrituras que fallan a gritos
    expect(managedRedis).toContain('eviction_policy = "NoEviction"')
    expect(managedRedis).toContain('"redis-host"')
    expect(managedRedis).toContain('"redis-password"')
    expect(tree.read('apps/demo/iac/variables.tf', 'utf-8') ?? '').toContain('managed_redis_name')
  })

  it('con infra=aws el hueco de IaC queda declarado en el README, no en silencio', async () => {
    const tree = await generate({ ...base, sessionStore: 'redis', infra: 'aws' })

    expect(tree.exists('apps/demo/iac/managed-redis.tf')).toBe(false)
    expect(tree.read('apps/demo/iac/README.md', 'utf-8') ?? '').toContain('Redis pendiente de IaC')
  })

  it('con el store por defecto no hay rastro de redis en infra, config ni health', async () => {
    const tree = await generate(base)

    expect(tree.exists(`${SHARED}/infrastructure/persistence/redis/redis.module.ts`)).toBe(false)
    expect(tree.read('apps/demo/docker/docker-compose.local.yml', 'utf-8') ?? '').not.toContain('redis')
    expect(tree.read(`${CONFIG}/config-types.ts`, 'utf-8') ?? '').not.toContain('RedisConfig')
    expect(tree.read(`${SHARED}/infrastructure/health/health.controller.ts`, 'utf-8') ?? '').not.toContain('redis')
    const pkg = JSON.parse(tree.read('apps/demo/package.json', 'utf-8') ?? '{}') as {
      dependencies?: Record<string, string>
    }
    expect(pkg.dependencies?.['ioredis']).toBeUndefined()
  })
})
