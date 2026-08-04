import type { Tree } from '@nx/devkit'
import type { PluginContext } from '../plugins/plugin'

/**
 * Manifiesto de un proveedor de INFRAESTRUCTURA (spec 24): qué añade a la app emitida para
 * hablar con una nube concreta — resolución de secretos, telemetría, almacenamiento de ficheros.
 *
 * Mismo estilo que `PersistenceProvider` y que los plugins: datos y funciones, sin decoradores.
 * Todo campo es opcional a propósito: `none` no declara ninguno, y así una app sin infra no
 * arrastra el SDK de ninguna nube (que era el bug que abrió esta spec).
 */
export interface InfraProvider {
  /** Valor del flag CLI (`none`, `azure`…) */
  value: string
  /** Etiqueta que ve el usuario en el formulario */
  label: string
  description?: string
  /** Subárbol de plantillas que el proveedor añade al emitido */
  files?: string
  /** Dependencias que añade al package.json emitido (los SDK de su nube) */
  dependencies?: Record<string, string>
  /** Cableado libre sobre el árbol: primer import de main.ts, binding del StorageModule… */
  apply?(tree: Tree, context: PluginContext): void
}

export function defineInfra(provider: InfraProvider): InfraProvider {
  return provider
}
