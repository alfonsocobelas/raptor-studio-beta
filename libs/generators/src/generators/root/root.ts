import { formatFiles, generateFiles, names, type Tree } from '@nx/devkit'
import * as path from 'path'
import { selectModels } from '../resource/models/registry'

export interface RootGeneratorSchema {
  /** Comma-separated model names to include; defaults to the whole registry */
  models?: string
  directory?: string
}


/**
 * Composition root del backend: root.module.ts (core + un módulo por recurso
 * registrado), main.ts canónico y plantillas de configuración por entorno
 * (JSON bundle-safe con marcadores vault.* — nunca secretos en claro).
 */
export async function rootGenerator(tree: Tree, options: RootGeneratorSchema) {
  const MODEL_LIST = selectModels(options.models)
  const outputDir = options.directory ?? path.join('tmp', 'generated', 'root')

  const resourceModules = MODEL_LIST.map(model => {
    const pluralClass = names(model.plural).className
    return {
      className: `${pluralClass}Module`,
      importPath: `./contexts/${model.context}/modules/${model.plural}/${model.plural}.module`
    }
  })

  const schemas = [...new Set(MODEL_LIST.map(m => m.schemaName))]

  generateFiles(tree, path.join(__dirname, 'files'), outputDir, {
    resourceModules,
    // el módulo de almacenamiento solo existe si algún recurso declara adjuntos
    attachments: MODEL_LIST.some(model => model.attachments),
    schemaList: schemas.join(', '),
    databaseName: `${schemas[0] ?? 'app'}_local`
  })

  await formatFiles(tree)
}

export default rootGenerator
