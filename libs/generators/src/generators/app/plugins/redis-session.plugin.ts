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
    ioredis: '5.11.1',
    // storage del throttler compartido entre réplicas; el fail-open lo envuelve
    '@nest-lab/throttler-storage-redis': '1.2.0'
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
 * IaC del store por proveedor de infra (spec 63): azure (Azure Managed Redis, calcado
 * de la referencia) y aws (ElastiCache, espejo del patrón de rds.tf). Un proveedor sin
 * pieza escrita declara el hueco en el README de iac/ — mejor un pendiente honesto que
 * un Terraform sin probar.
 */
function addCloudRedis(tree: Tree, context: PluginContext): void {
  const iacDir = path.join(context.root, 'iac')
  const readmePath = path.join(iacDir, 'README.md')

  // infra=none o --provisionedInfra (el cliente aprovisiona): no hay iac/ donde cablear
  if (!tree.exists(readmePath)) {
    return
  }

  if (context.infra === 'azure') {
    addAzureRedis(tree, iacDir)
    return
  }
  if (context.infra === 'aws') {
    addAwsRedis(tree, iacDir)
    return
  }
  if (context.infra === 'raptor') {
    addRaptorRedis(tree, iacDir)
    return
  }

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
}

function addAzureRedis(tree: Tree, iacDir: string): void {
  if (tree.exists(path.join(iacDir, 'managed-redis.tf'))) {
    return
  }
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

/**
 * ElastiCache + secretos redis-host/redis-password en Secrets Manager. La policy IAM
 * del backend enumera los ARNs uno a uno (iam.tf), así que se amplía aquí: sin eso el
 * GetSecretValue de los secretos nuevos falla en el arranque.
 */
function addAwsRedis(tree: Tree, iacDir: string): void {
  if (tree.exists(path.join(iacDir, 'elasticache.tf'))) {
    return
  }
  tree.write(path.join(iacDir, 'elasticache.tf'), ELASTICACHE_TF)

  const iamPath = path.join(iacDir, 'iam.tf')
  const iam = tree.read(iamPath, 'utf-8')
  if (iam && !iam.includes('redis_host')) {
    tree.write(
      iamPath,
      iam.replace(
        '"${aws_secretsmanager_secret.db_name.arn}"]',
        '"${aws_secretsmanager_secret.db_name.arn}", "${aws_secretsmanager_secret.redis_host.arn}", "${aws_secretsmanager_secret.redis_password.arn}"]'
      )
    )
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
 * En raptor no hay Terraform de Redis: el store es un servicio más del compose de prod
 * del VPS, como Postgres. La password sigue el mismo doble viaje que POSTGRES_PASSWORD
 * (.env del servidor para el contenedor + secreto en Infisical para el backend), y el
 * README documenta las dos altas a mano.
 */
function addRaptorRedis(tree: Tree, iacDir: string): void {
  const composePath = path.join(iacDir, 'docker-compose.prod.yml')
  const compose = tree.read(composePath, 'utf-8')
  if (compose && !compose.includes('redis:7-alpine')) {
    tree.write(
      composePath,
      compose
        // la lista de variables del .env de la cabecera, para que el operador no la descubra a golpes
        .replace('POSTGRES_PASSWORD, METRICS_TOKEN,', 'POSTGRES_PASSWORD, REDIS_PASSWORD, METRICS_TOKEN,')
        // sin sesiones no hay backend sano: que espere también a redis
        .replace(
          /(depends_on:\n      postgres:\n        condition: service_healthy\n)/,
          `$1      redis:
        condition: service_started
`
        )
        // el servicio, a continuación de postgres (sin volumen: el estado es efímero)
        .replace(
          /(      - \/srv\/data\/postgres:\/var\/lib\/postgresql\/data\n)/,
          `$1
  # Sin volumen a propósito: solo estado efímero (rate limit, sesiones); perderlo en un
  # restart es aceptable. noeviction: las sesiones son fuente de verdad, mejor un 503
  # que desalojos en silencio. La password viaja por el .env, como POSTGRES_PASSWORD.
  redis:
    image: redis:7-alpine
    restart: unless-stopped
    command: ['redis-server', '--requirepass', '\${REDIS_PASSWORD}', '--maxmemory-policy', 'noeviction']
`
        )
    )
  }

  const readmePath = path.join(iacDir, 'README.md')
  const readme = tree.read(readmePath, 'utf-8')
  if (readme && !readme.includes('## Redis de sesiones y rate limit')) {
    tree.write(
      readmePath,
      readme +
        `
## Redis de sesiones y rate limit (\`sessionStore: redis\`)

El compose de prod levanta un \`redis:7-alpine\` con \`requirepass\` y \`noeviction\`. Dos
altas a mano, el mismo doble viaje que la contraseña de Postgres:

- \`REDIS_PASSWORD\` en el \`.env\` del servidor (lo usa el contenedor).
- En Infisical: \`REDIS_HOST\` = \`redis\` (el nombre del servicio en el compose) y
  \`REDIS_PASSWORD\` = el mismo valor del \`.env\` — el backend los resuelve por
  \`vault.redis.host\` / \`vault.redis.password\`.
`
    )
  }
}

// Espejo de managed-redis.tf en AWS, con el estilo de rds.tf. Pendiente de un
// `terraform plan` real (sin cuenta aws desde la spec 47).
const ELASTICACHE_TF = `# ElastiCache Redis — estado efímero de la app: rate limit y sesiones.
# Nodo único sin failover: con el backend en réplica única, pagar HA en Redis es
# proteger el eslabón equivocado (mismo razonamiento que high_availability en Azure).
resource "random_password" "redis" {
  length = 32
  # el auth token de ElastiCache no admite caracteres especiales arbitrarios
  special = false
}

resource "aws_elasticache_subnet_group" "redis" {
  name       = "\${local.name}-redis"
  subnet_ids = data.aws_subnets.default.ids
}

resource "aws_security_group" "redis" {
  name   = "\${local.name}-redis"
  vpc_id = data.aws_vpc.default.id

  ingress {
    description     = "Redis desde los servicios App Runner (via VPC connector)"
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.apprunner.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_elasticache_parameter_group" "redis" {
  name   = "\${local.name}-redis7"
  family = "redis7"

  # noeviction, no el default volatile-lru: este Redis guarda sesiones como fuente de
  # verdad; bajo presión de memoria queremos escrituras que fallan a gritos (503), no
  # sesiones desalojadas en silencio.
  parameter {
    name  = "maxmemory-policy"
    value = "noeviction"
  }
}

resource "aws_elasticache_replication_group" "redis" {
  replication_group_id = "\${local.name}-redis"
  description          = "Sesiones y rate limit (estado efimero)"

  engine         = "redis"
  engine_version = "7.1"
  node_type      = "cache.t4g.micro"

  num_cache_clusters         = 1
  automatic_failover_enabled = false

  port                 = 6379
  parameter_group_name = aws_elasticache_parameter_group.redis.name
  subnet_group_name    = aws_elasticache_subnet_group.redis.name
  security_group_ids   = [aws_security_group.redis.id]

  # el auth token obliga cifrado in-transit (la app conecta con TLS, ver prod.json)
  transit_encryption_enabled = true
  auth_token                 = random_password.redis.result
}

# La app resuelve \`vault.redis.host\` y \`vault.redis.password\` (el config-loader aplana los
# puntos en guiones y antepone AWS_SECRETS_PREFIX). El puerto (6379) y tls van en claro en el JSON.
resource "aws_secretsmanager_secret" "redis_host" {
  name = "\${local.name}/redis-host"
}

resource "aws_secretsmanager_secret_version" "redis_host" {
  secret_id     = aws_secretsmanager_secret.redis_host.id
  secret_string = aws_elasticache_replication_group.redis.primary_endpoint_address
}

resource "aws_secretsmanager_secret" "redis_password" {
  name = "\${local.name}/redis-password"
}

resource "aws_secretsmanager_secret_version" "redis_password" {
  secret_id     = aws_secretsmanager_secret.redis_password.id
  secret_string = random_password.redis.result
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

  // El puerto y el TLS de los entornos cloud son del proveedor de infra: AMR expone un
  // puerto fijo (10000) y solo acepta TLS; ElastiCache con auth token obliga TLS in-transit
  // en el 6379; en raptor el redis vive en la red interna del compose, sin TLS.
  const cloudByInfra: Record<string, { port: number; tls: boolean }> = {
    azure: { port: 10000, tls: true },
    aws: { port: 6379, tls: true },
    raptor: { port: 6379, tls: false }
  }
  const cloudShape = cloudByInfra[context.infra] ?? { port: 6379, tls: true }
  const cloud = { host: 'vault.redis.host', password: 'vault.redis.password', ...cloudShape }
  const perEnvironment: Record<string, { host: string; port: number; password: string; tls: boolean }> = {
    local: { host: 'localhost', port: 6379, password: '', tls: false },
    test: { host: 'localhost', port: 6380, password: '', tls: false },
    dev: cloud,
    qa: cloud,
    prod: cloud
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
        .replace(
          'controllers: [HealthController]',
          'controllers: [HealthController],\n  providers: [RedisHealthIndicator]'
        )
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
