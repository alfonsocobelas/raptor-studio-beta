import type { Tree } from '@nx/devkit'
import * as path from 'path'
import { definePlugin, type PluginContext } from './plugin'

/**
 * Métricas HTTP tras el MetricsPort del catálogo (spec 51). Primer consumidor real del
 * puerto: emite el adapter de Prometheus, su módulo global y —en TASK-02/03— el endpoint
 * protegido por token y el interceptor que mide cada petición.
 *
 * Plugin aditivo a propósito: ranura implicaría elegir entre proveedores de métricas (no
 * hay dos) y kernel forzaría prom-client en toda app generada.
 */
export const metricsPlugin = definePlugin({
  name: 'metrics',
  description: 'Métricas HTTP en formato Prometheus tras MetricsPort (endpoint con token)',
  assets: 'assets-metrics',
  dependencies: {
    // Misma versión que el canon del catálogo (libs/infra/metrics-prometheus); el test de
    // paridad del plugin falla si se separan.
    'prom-client': '15.1.3'
  },

  apply(tree: Tree, context: PluginContext): void {
    addMetricsConfigSection(tree, context)
    registerMetricsModule(tree, context)
    skipRateLimitOnScrape(tree, context)
  }
})

/**
 * Con rate limiting activo (lo emite auth, spec 55), el raspado queda fuera del límite
 * global: Alloy pega cada pocos segundos y computaría contra el límite por IP. El decorador
 * no puede vivir en el asset — sin auth no existe @nestjs/throttler y el import rompería —
 * así que se parchea aquí, solo si el módulo de rate limit está en el árbol (las ranuras se
 * aplican antes que los aditivos: si auth lo emitió, ya está).
 */
function skipRateLimitOnScrape(tree: Tree, context: PluginContext): void {
  const hasRateLimit = tree.exists(
    path.join(context.backendSrc, 'contexts/shared/infrastructure/rate-limit/rate-limit.module.ts')
  )
  if (!hasRateLimit) {
    return
  }
  const controllerPath = path.join(context.backendSrc, 'contexts/shared/infrastructure/metrics/metrics.controller.ts')
  const source = tree.read(controllerPath, 'utf-8')
  if (!source || source.includes('SkipThrottle')) {
    return
  }
  tree.write(
    controllerPath,
    source
      .replace(/(\nimport [^\n]*\n)(?![\s\S]*\nimport )/, "$1import { SkipThrottle } from '@nestjs/throttler'\n")
      // ancla con @Controller: el comentario del asset también dice "@Public()" y no debe ganar
      .replace(
        "@Public()\n@Controller('metrics')",
        "@Public()\n@SkipThrottle({ global: true })\n@Controller('metrics')"
      )
  )
}

/**
 * Sección opcional `metrics` en tipos y validación. El token es obligatorio DENTRO de la
 * sección: una sección presente sin token sería un endpoint expuesto sin querer, y eso debe
 * morir en el arranque, no descubrirse en producción.
 */
function addMetricsConfigSection(tree: Tree, context: PluginContext): void {
  const typesPath = path.join(context.backendSrc, 'contexts/shared/infrastructure/config/config-types.ts')
  const types = tree.read(typesPath, 'utf-8')
  if (types && !types.includes('MetricsConfig')) {
    tree.write(
      typesPath,
      types
        .replace(
          'export interface StorageConfig {',
          `export interface MetricsConfig {
  /** Bearer token the scraper must present; the /metrics route only exists with this section */
  token: string
  /** Prefix for every metric name (e.g. 'app_') */
  prefix?: string
  /** Collect Node.js default metrics (event loop, heap, GC). Default: true */
  defaultMetrics?: boolean
}

export interface StorageConfig {`
        )
        .replace('  storage?: StorageConfig', '  storage?: StorageConfig\n  metrics?: MetricsConfig')
    )
  }

  const validationPath = path.join(context.backendSrc, 'contexts/shared/infrastructure/config/config-validation.ts')
  const validation = tree.read(validationPath, 'utf-8')
  if (validation && !validation.includes('MetricsValidator')) {
    tree.write(
      validationPath,
      validation
        .replace(
          'class StorageValidator {',
          `class MetricsValidator {
  @IsString()
  token!: string

  @IsOptional()
  @IsString()
  prefix?: string

  @IsOptional()
  @IsBoolean()
  defaultMetrics?: boolean
}

class StorageValidator {`
        )
        .replace(
          '  storage?: StorageValidator\n}',
          `  storage?: StorageValidator

  @IsOptional()
  @ValidateNested()
  @Type(() => MetricsValidator)
  metrics?: MetricsValidator
}`
        )
    )
  }
}

/** El módulo entra en el root junto a los del kernel, detrás de LoggerModule. */
function registerMetricsModule(tree: Tree, context: PluginContext): void {
  const rootPath = path.join(context.backendSrc, 'root.module.ts')
  const source = tree.read(rootPath, 'utf-8')
  if (!source || source.includes('MetricsModule')) {
    return
  }
  tree.write(
    rootPath,
    source
      .replace(
        "from './contexts/shared/infrastructure/logger/logger.module'",
        "from './contexts/shared/infrastructure/logger/logger.module'\nimport { MetricsModule } from './contexts/shared/infrastructure/metrics/metrics.module'"
      )
      // Ancla SIN indentación: cuando el plugin corre por CLI, el root.module ya pasó por
      // prettier y el array imports puede estar colapsado en una línea (con pocos modelos
      // cabe en los 120 chars). La primera coincidencia de 'LoggerModule,' está siempre
      // dentro del array — la línea de import no lleva coma — y formatFiles re-normaliza
      // después. Bug real: el árbol de test conserva la forma cruda multilínea y el ancla
      // indentada pasaba los tests mientras la app generada por CLI quedaba sin registrar.
      .replace('LoggerModule,', 'LoggerModule,\n    MetricsModule,')
  )
}
