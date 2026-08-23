import type { Tree } from '@nx/devkit'
import * as path from 'path'
import { definePlugin, type PluginContext } from './plugin'

/**
 * Manifiesto del proveedor `redis` de la ranura sessionStore (spec 55): la
 * infraestructura transversal que el repositorio de sesiones necesita. Una sola
 * conexión ioredis para toda la app (REDIS_CLIENT), sección de config por entorno,
 * y health check bloqueante: las sesiones viven en Redis, sin él no hay auth y el
 * readiness debe decir la verdad (down ⇒ 503 y la réplica sale de rotación).
 *
 * El repositorio de sesiones en sí lo emite el plugin de auth (assets-auth-session-redis):
 * este plugin es dueño solo de lo compartido. Se aplica DESPUÉS de auth (orden de SLOTS),
 * así que auth.module y health ya existen para parchearlos.
 */
export const redisSessionPlugin = definePlugin({
  name: 'session-redis',
  description: 'Sesiones en Redis: cliente compartido, config por entorno y health bloqueante',
  requires: { auth: 'single-tenant' },
  assets: 'assets-redis-infra',
  dependencies: {
    ioredis: '5.11.1'
  },

  apply(tree: Tree, context: PluginContext): void {
    addRedisConfigSection(tree, context)
    wireHealthCheck(tree, context)
    importRedisModuleInAuth(tree, context)
  }
})

/**
 * Sección `redis` en tipos, validación y TODOS los entornos. En prod los valores son
 * referencias `vault.redis.*` que resuelve el config-loader del proveedor de infra;
 * test apunta al redis de test (6380) para convivir con el local (6379).
 */
function addRedisConfigSection(tree: Tree, context: PluginContext): void {
  const configDir = path.join(context.backendSrc, 'contexts/shared/infrastructure/config')

  const typesPath = path.join(configDir, 'config-types.ts')
  const types = tree.read(typesPath, 'utf-8')
  if (types && !types.includes('RedisConfig')) {
    tree.write(
      typesPath,
      types
        .replace(
          'export interface RateLimitConfig {',
          `export interface RedisConfig {
  host: string
  port: number
  /** Vacía en local/test (sin auth); secreto del proveedor en dev/prod */
  password: string
  /** false en local/test; true en cloud (Azure Managed Redis solo acepta TLS) */
  tls: boolean
}

export interface RateLimitConfig {`
        )
        .replace('  rateLimit: RateLimitConfig', '  redis: RedisConfig\n  rateLimit: RateLimitConfig')
    )
  }

  const validationPath = path.join(configDir, 'config-validation.ts')
  const validation = tree.read(validationPath, 'utf-8')
  if (validation && !validation.includes('RedisValidator')) {
    tree.write(
      validationPath,
      validation
        .replace(
          'class RateLimitValidator {',
          `class RedisValidator {
  @IsString()
  host!: string

  @IsNumber()
  port!: number

  @IsString()
  password!: string

  @IsBoolean()
  tls!: boolean
}

class RateLimitValidator {`
        )
        .replace(
          '  @ValidateNested()\n  @Type(() => RateLimitValidator)',
          `  @ValidateNested()
  @Type(() => RedisValidator)
  redis!: RedisValidator

  @ValidateNested()
  @Type(() => RateLimitValidator)`
        )
    )
  }

  const perEnvironment: Record<string, { host: string; port: number; password: string; tls: boolean }> = {
    local: { host: 'localhost', port: 6379, password: '', tls: false },
    test: { host: 'localhost', port: 6380, password: '', tls: false },
    dev: { host: 'vault.redis.host', port: 10000, password: 'vault.redis.password', tls: true },
    qa: { host: 'vault.redis.host', port: 10000, password: 'vault.redis.password', tls: true },
    prod: { host: 'vault.redis.host', port: 10000, password: 'vault.redis.password', tls: true }
  }
  for (const [environment, redis] of Object.entries(perEnvironment)) {
    const environmentPath = path.join(configDir, 'environments', `${environment}.json`)
    const raw = tree.read(environmentPath, 'utf-8')
    if (!raw) {
      continue
    }
    const config = JSON.parse(raw) as Record<string, unknown>
    if (!config['redis']) {
      config['redis'] = redis
      tree.write(environmentPath, JSON.stringify(config, null, 2) + '\n')
    }
  }
}

/** El PING entra en el readiness junto al de la base de datos, con el mismo timeout. */
function wireHealthCheck(tree: Tree, context: PluginContext): void {
  const healthDir = path.join(context.backendSrc, 'contexts/shared/infrastructure/health')

  const controllerPath = path.join(healthDir, 'health.controller.ts')
  const controller = tree.read(controllerPath, 'utf-8')
  if (controller && !controller.includes('RedisHealthIndicator')) {
    tree.write(
      controllerPath,
      controller
        .replace(
          "import { Public } from '../auth/public.decorator'",
          "import { Public } from '../auth/public.decorator'\nimport { RedisHealthIndicator } from './redis-health.indicator'"
        )
        .replace(
          /(private readonly db: TypeOrmHealthIndicator,)(\s*)/,
          (_, line: string, sep: string) => `${line}${sep}private readonly redis: RedisHealthIndicator,${sep}`
        )
        .replace(
          /(\(\) => this\.db\.pingCheck\('database', \{ timeout: HEALTH_TIMEOUT_MS \}\),)(\s*)/,
          (_, line: string, sep: string) =>
            `${line}${sep}() => this.redis.pingCheck('redis', { timeout: HEALTH_TIMEOUT_MS }),${sep}`
        )
    )
  }

  const modulePath = path.join(healthDir, 'health.module.ts')
  const module = tree.read(modulePath, 'utf-8')
  if (module && !module.includes('RedisHealthIndicator')) {
    tree.write(
      modulePath,
      module
        .replace(
          "import { HealthController } from './health.controller'",
          `import { HealthController } from './health.controller'
import { RedisHealthIndicator } from './redis-health.indicator'
import { RedisModule } from '../persistence/redis/redis.module'`
        )
        .replace('imports: [TerminusModule, HttpModule],', 'imports: [TerminusModule, HttpModule, RedisModule],')
        .replace('controllers: [HealthController]', 'controllers: [HealthController],\n  providers: [RedisHealthIndicator]')
    )
  }
}

/** El repositorio de sesiones inyecta REDIS_CLIENT: auth.module importa el módulo que lo provee. */
function importRedisModuleInAuth(tree: Tree, context: PluginContext): void {
  const modulePath = path.join(context.backendSrc, 'contexts/iam/modules/auth/auth.module.ts')
  const source = tree.read(modulePath, 'utf-8')
  if (!source || source.includes('RedisModule')) {
    return
  }
  tree.write(
    modulePath,
    source
      .replace(
        /(\nimport [^\n]*\n)(?![\s\S]*\nimport )/,
        "$1import { RedisModule } from '../../../shared/infrastructure/persistence/redis/redis.module'\n"
      )
      .replace('@Module({', '@Module({\n  imports: [RedisModule],')
  )
}
