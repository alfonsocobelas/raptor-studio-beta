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
    addRedisToCompose(tree, context)
    addCloudRedis(tree, context)
  }
})

/**
 * Redis en el compose local (6379) y en el de test (6380, para convivir con el local —
 * mismo split que 5433/5434 de postgres). Sin volumen a propósito: el estado es efímero
 * (sesiones, rate limit) y perderlo en un restart es aceptable.
 */
function addRedisToCompose(tree: Tree, context: PluginContext): void {
  const localPath = path.join(context.root, 'docker/docker-compose.local.yml')
  const local = tree.read(localPath, 'utf-8')
  if (local && !local.includes('redis-local:')) {
    tree.write(
      localPath,
      local.replace(
        /(  postgres-local:[\s\S]*?\n)(\n)/,
        `$1
  # Sin volumen a propósito: solo guarda estado efímero (rate limit, sesiones);
  # perderlo en un restart es aceptable y mantiene el contenedor desechable.
  redis-local:
    image: redis:7-alpine
    container_name: ${context.appName}-redis-local
    ports:
      - '6379:6379'
$2`
      )
    )
  }

  const testPath = path.join(context.root, 'docker/docker-compose.test.yml')
  const test = tree.read(testPath, 'utf-8')
  if (test && !test.includes('redis-test:')) {
    tree.write(
      testPath,
      test.replace(
        /$(?![\s\S])/,
        `
  # 6380 en el host para convivir con el redis local del 6379 (mismo split que 5433/5434).
  redis-test:
    image: redis:7-alpine
    container_name: ${context.appName}-redis-test
    ports:
      - '6380:6379'
`
      )
    )
  }
}

/**
 * IaC del store: solo azure tiene pieza escrita (Azure Managed Redis, calcada de la
 * referencia). Con aws/raptor el hueco se declara en el README de iac/ — mejor un
 * pendiente honesto que un Terraform sin probar (fuera de scope de la spec 55).
 */
function addCloudRedis(tree: Tree, context: PluginContext): void {
  const iacDir = path.join(context.root, 'iac')
  const isAzure = tree.exists(path.join(iacDir, 'key-vault.tf'))
  const readmePath = path.join(iacDir, 'README.md')

  if (!isAzure) {
    const readme = tree.read(readmePath, 'utf-8')
    if (readme && !readme.includes('Redis pendiente de IaC')) {
      tree.write(
        readmePath,
        readme +
          `
## Redis pendiente de IaC en este proveedor

La app usa Redis para sesiones y rate limit (\`sessionStore: redis\`), pero este proveedor
aún no tiene la pieza de Terraform. Apunta \`redis.host\`/\`redis.password\` de los entornos
cloud a una instancia gestionada (ElastiCache, contenedor propio…) hasta que exista.
`
      )
    }
    return
  }

  if (!tree.exists(path.join(iacDir, 'managed-redis.tf'))) {
    tree.write(path.join(iacDir, 'managed-redis.tf'), MANAGED_REDIS_TF)
    const variables = tree.read(path.join(iacDir, 'variables.tf'), 'utf-8')
    if (variables && !variables.includes('managed_redis_name')) {
      tree.write(
        path.join(iacDir, 'variables.tf'),
        variables +
          `
variable "managed_redis_name" {
  description = "Name of the Azure Managed Redis instance."
  type        = string
}
`
      )
    }
  }
}

// Calcado de la referencia (docs/referencia/iac/terraform/managed-redis.tf).
const MANAGED_REDIS_TF = `# Azure Managed Redis (AMR) — estado efímero de la app: rate limit y sesiones.
# AMR y no Azure Cache for Redis: este último se retira el 30/09/2028.
# El backend conecta por el endpoint público con access key + TLS (puerto 10000, fijo en AMR),
# igual que Postgres hoy; red privada es un rediseño aparte.
resource "azurerm_managed_redis" "this" {
  name                = var.managed_redis_name
  resource_group_name = data.azurerm_resource_group.this.name
  location            = data.azurerm_resource_group.this.location
  sku_name            = "Balanced_B0"
  tags                = var.tags

  # El default es true (2 nodos, ~2x coste). Con el backend en réplica única, pagar HA en
  # Redis es proteger el eslabón equivocado; revisar si algún día sube max_replicas.
  high_availability_enabled = false

  default_database {
    # La app se autentica con la access key (secreto en KV); el default del recurso es false.
    access_keys_authentication_enabled = true
    client_protocol                    = "Encrypted"

    # NoEviction, no el default VolatileLRU: este Redis guarda sesiones como fuente de
    # verdad; bajo presión de memoria queremos escrituras que fallan a gritos (503), no
    # sesiones desalojadas en silencio.
    eviction_policy = "NoEviction"

    # El cliente es un ioredis plano (new Redis, no Redis.Cluster); el default OSSCluster
    # expone el protocolo de cluster y provocaría errores MOVED.
    clustering_policy = "NoCluster"
  }
}

# La app resuelve \`vault.redis.host\` y \`vault.redis.password\` (el config-loader convierte los
# puntos en guiones para el nombre del secreto). El puerto (10000) y tls van en claro en el JSON.
resource "azurerm_key_vault_secret" "redis_host" {
  name         = "redis-host"
  value        = azurerm_managed_redis.this.hostname
  key_vault_id = azurerm_key_vault.this.id

  depends_on = [azurerm_key_vault_access_policy.terraform]
}

resource "azurerm_key_vault_secret" "redis_password" {
  name         = "redis-password"
  value        = azurerm_managed_redis.this.default_database[0].primary_access_key
  key_vault_id = azurerm_key_vault.this.id

  depends_on = [azurerm_key_vault_access_policy.terraform]
}
`

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
