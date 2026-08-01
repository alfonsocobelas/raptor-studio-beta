import { formatFiles, generateFiles, names, type Tree } from '@nx/devkit'
import * as path from 'path'
import { selectModels } from '../resource/models/registry'
import type { DatabaseEngine } from '../app/database'

export interface KernelGeneratorSchema {
  /** Comma-separated model names to include; defaults to the whole registry */
  models?: string
  directory?: string
  sharedDomainAlias?: string
  /** Persistence engine of the emitted app (default postgres) */
  database?: DatabaseEngine
}


/**
 * Shared kernel scaffold (copy-once): the ~80-file base the generated modules
 * compile against — Criteria/query, VO base classes, TypeORM base repository +
 * criteria converter, pipes/filters/interceptors, export, health and the
 * bundle-safe config loader. Curated from the reference: app-specific config
 * sections, migrations and telemetry (observability plugin) stay out; the
 * persistence module derives its entity list from the model registry.
 */
export async function kernelGenerator(tree: Tree, options: KernelGeneratorSchema) {
  const MODEL_LIST = selectModels(options.models)
  const outputDir = options.directory ?? path.join('tmp', 'generated', 'kernel')

  const entities = MODEL_LIST.flatMap(model => {
    const n = names(model.name)
    const base = `../../../../${model.context}/modules/${model.plural}/infrastructure/persistence/typeorm`
    const list = [{ className: `TypeOrm${n.className}Entity`, importPath: `${base}/typeorm-${n.fileName}.entity` }]
    if (model.composition) {
      const c = names(model.composition.name)
      list.push({ className: `TypeOrm${c.className}Entity`, importPath: `${base}/typeorm-${c.fileName}.entity` })
    }
    return list
  })

  // Un modelo Mongoose raíz por recurso: los hijos de composición van embebidos.
  const mongooseModels = MODEL_LIST.map(model => {
    const n = names(model.name)
    return {
      token: n.className,
      schemaConst: `${n.className}Schema`,
      importPath: `../../../../${model.context}/modules/${model.plural}/infrastructure/persistence/mongoose/${n.fileName}.schema`
    }
  })

  const substitutions = {
    sharedDomainAlias: options.sharedDomainAlias ?? '@acc/shared/domain',
    databaseName: [...new Set(MODEL_LIST.map(m => m.schemaName))][0] ?? 'app',
    entities,
    mongooseModels
  }
  generateFiles(tree, path.join(__dirname, 'files'), outputDir, substitutions)
  // puerto + adapter de almacenamiento: solo si algún recurso declara adjuntos
  if (MODEL_LIST.some(model => model.attachments)) {
    generateFiles(tree, path.join(__dirname, 'files-attachments'), outputDir, substitutions)
  }
  // lo específico del motor (config + persistencia compartida) vive en árboles paralelos
  generateFiles(tree, path.join(__dirname, `files-${options.database ?? 'postgres'}`), outputDir, substitutions)

  // Un id-VO por recurso registrado: el kernel no puede conocer de antemano las
  // entidades de cada cliente, así que se derivan del registro en vez de hardcodearse.
  for (const model of MODEL_LIST) {
    const n = names(model.name)
    generateFiles(
      tree,
      path.join(__dirname, 'files-id-vo'),
      path.join(outputDir, 'contexts/shared/domain/value-objects', model.plural),
      { idClassName: n.className, idFileName: n.fileName }
    )
  }

  await formatFiles(tree)
}

export default kernelGenerator
