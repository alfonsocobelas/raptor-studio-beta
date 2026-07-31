import type { Tree } from '@nx/devkit'
import * as path from 'path'
import { definePlugin, type PluginContext } from './plugin'

/**
 * Telemetría con Azure Monitor (Application Insights), verbatim de la referencia:
 * `instrument.ts` debe ser el PRIMER import del bundle para que OpenTelemetry
 * parchee los módulos antes de que nadie los cargue. Solo emite en dev/prod
 * (gobernado por NODE_ENV); en local/test se auto-desactiva y lo dice por stdout.
 *
 * Config por entorno: APPLICATIONINSIGHTS_CONNECTION_STRING (el job/app del
 * despliegue la inyecta; nunca va en los JSON de config).
 */
export const observabilityPlugin = definePlugin({
  name: 'observability',
  description: 'Azure Monitor (App Insights): trazas, métricas y logs OTel en dev/prod',
  assets: 'assets-observability',
  dependencies: {
    '@azure/monitor-opentelemetry': '^1.18.2'
  },

  apply(tree: Tree, context: PluginContext): void {
    const mainPath = path.join(context.root, 'apps/backend-api/src/main.ts')
    const source = tree.read(mainPath, 'utf-8')
    if (!source || source.includes('telemetry/instrument')) {
      return
    }
    tree.write(
      mainPath,
      `// La telemetría se inicializa antes que cualquier otro import: el SDK de Azure
// Monitor debe parchear los módulos (http, pg…) antes de que la app los cargue.
import '${context.scope}/backend/contexts/shared/infrastructure/telemetry/instrument'
${source}`
    )
  }
})
