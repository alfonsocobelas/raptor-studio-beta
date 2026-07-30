import { formatFiles, generateFiles, names, type Tree } from '@nx/devkit'
import * as path from 'path'
import { contract } from '../resource/models/contract.model'
import { customer } from '../resource/models/customer.model'
import { license } from '../resource/models/license.model'
import { project } from '../resource/models/project.model'
import { ResourceDefinition } from '@acc/schema'

export interface RootGeneratorSchema {
  directory?: string
}

// El mismo registro estático que el generador de recursos: el root se deriva de él.
const MODELS: ResourceDefinition[] = [contract, customer, license, project]

/**
 * Composition root del backend: root.module.ts (core + un módulo por recurso
 * registrado), main.ts canónico y plantillas de configuración por entorno
 * (JSON bundle-safe con marcadores vault.* — nunca secretos en claro).
 */
export async function rootGenerator(tree: Tree, options: RootGeneratorSchema) {
  const outputDir = options.directory ?? path.join('tmp', 'generated', 'root')

  const resourceModules = MODELS.map(model => {
    const pluralClass = names(model.plural).className
    return {
      className: `${pluralClass}Module`,
      importPath: `./contexts/${model.context}/modules/${model.plural}/${model.plural}.module`
    }
  })

  const schemas = [...new Set(MODELS.map(m => m.schemaName))]

  generateFiles(tree, path.join(__dirname, 'files'), outputDir, {
    resourceModules,
    schemaList: schemas.join(', '),
    databaseName: `${schemas[0] ?? 'app'}_local`
  })

  await formatFiles(tree)
}

export default rootGenerator
