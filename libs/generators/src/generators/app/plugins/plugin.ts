import type { Tree } from '@nx/devkit'
import { ResourceDefinition } from '@raptor/schema'
import type { SessionStore } from './slots'

/** Lo que un plugin sabe de la app que se está generando. */
export interface PluginContext {
  /** Raíz del proyecto emitido */
  root: string
  appName: string
  /** libs/backend/src */
  backendSrc: string
  /** libs/frontend/src */
  frontendSrc: string
  /** Recursos incluidos en la app */
  models: ResourceDefinition[]
  /** Alias de importación del proyecto emitido (fijo: @app) */
  scope: string
  /** Almacén de sesiones elegido (spec 55); solo lo mira el plugin de auth */
  sessionStore: SessionStore
}

/**
 * Un plugin añade una capacidad transversal a la app generada (migraciones, auth,
 * observabilidad…). No hay decoradores a propósito: un manifiesto tipado da la misma
 * ergonomía sin registro global ni reflect-metadata en el build del plugin Nx.
 */
export interface AppPlugin {
  /** Identificador usado en la opción del generador */
  name: string
  /** Una línea, la que ve el usuario en el formulario */
  description: string
  /** Dependencias que el plugin añade al package.json emitido */
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  /** Scripts npm que el plugin añade */
  scripts?: Record<string, string>
  /** Targets que el plugin añade al Makefile (nombre → cuerpo) */
  makeTargets?: Record<string, string>
  /** Targets (de makeTargets) que local-setup debe encadenar tras migrar y sembrar */
  localSetupSteps?: string[]
  /** Schemas de PostgreSQL que el plugin necesita */
  schemas?: string[]
  /** Restricciones contra las ranuras (p.ej. auth emite persistencia TypeORM ⇒ { database: 'postgres' }); sin valor = agnóstico */
  requires?: Record<string, string>
  /** Carpeta de assets copiada literalmente (relativa al directorio del plugin) */
  assets?: string
  /** Cableado libre sobre el árbol: ficheros derivados de los modelos, parches de config… */
  apply?(tree: Tree, context: PluginContext): void
}

export function definePlugin(plugin: AppPlugin): AppPlugin {
  return plugin
}
