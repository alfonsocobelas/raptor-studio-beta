import type { Tree } from '@nx/devkit'
import * as path from 'path'
import { defineInfra, type InfraProvider } from './provider'
import type { PluginContext } from '../plugins/plugin'

/**
 * Sin infraestructura: la app se lleva su config en los JSON por entorno, registra en stdout y
 * guarda ficheros en disco. Es el default a propósito — una app entregada sin elegir nube no
 * debe arrastrar el SDK de ninguna.
 */
export const noneInfra = defineInfra({
  value: 'none',
  label: 'Ninguna (sin adapters de nube ni IaC)'
})

/**
 * Azure: los secretos se resuelven contra Key Vault (los JSON solo llevan marcadores
 * `vault.*`), y el almacenamiento de ficheros va a Blob Storage. La telemetría con App
 * Insights la añade TASK-05.
 *
 * Las dependencias se declaran aquí porque los ficheros que emite las importan: cuando
 * vivían en el kernel base, el emitido las importaba SIN declararlas y solo compilaba
 * dentro de este monorepo, por hoisting.
 */
export const azureInfra = defineInfra({
  value: 'azure',
  label: 'Azure (Key Vault, Blob Storage, App Insights)',
  files: 'files-infra-azure',
  dependencies: {
    '@azure/identity': '4.13.1',
    '@azure/keyvault-secrets': '4.11.2',
    '@azure/storage-blob': '12.33.0'
  },

  apply(tree: Tree, context: PluginContext): void {
    useAzureConfigLoader(tree, context)
  }
})

/**
 * El loader es la costura de resolución de secretos que el módulo de config deja abierta:
 * con Azure se cambia por el que resuelve `vault.*` contra Key Vault.
 */
function useAzureConfigLoader(tree: Tree, context: PluginContext): void {
  const modulePath = path.join(context.backendSrc, 'contexts/shared/infrastructure/config/config.module.ts')
  const source = tree.read(modulePath, 'utf-8')
  if (!source || source.includes('azure-config-loader')) {
    return
  }
  tree.write(modulePath, source.replace("from './loaders/config-loader'", "from './loaders/azure/azure-config-loader'"))
}

/** Orden del registro = orden en el formulario. */
export const INFRA_PROVIDERS: readonly InfraProvider[] = [noneInfra, azureInfra]
