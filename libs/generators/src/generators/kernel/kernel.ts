import { formatFiles, generateFiles, names, type Tree } from '@nx/devkit'
import * as path from 'path'
import { selectModels } from '../resource/models/registry'
import type { DatabaseEngine } from '../app/database'
import { selectPersistence } from '../app/persistence/registry'

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
  const persistence = selectPersistence(options.database)
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
    // la entidad de adjuntos vive en su propio módulo, pero el DataSource debe conocerla
    if (model.attachments) {
      list.push({
        className: `TypeOrm${n.className}AttachmentEntity`,
        importPath: `../../../../${model.context}/modules/${model.plural}/infrastructure/attachments/${n.fileName}-attachment.entity`
      })
    }
    return list
  })

  // el historial (spec 31) añade la tabla global de eventos; el DataSource debe conocerla
  const hasHistory = MODEL_LIST.some(model => model.history)
  if (hasHistory) {
    entities.push({ className: 'TypeOrmAuditEventEntity', importPath: '../../audit/typeorm-audit-event.entity' })
  }

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
    mongooseModels,
    // el readiness comprueba la base con el indicador del motor elegido
    health: { indicatorClass: persistence.healthIndicator }
  }
  generateFiles(tree, path.join(__dirname, 'files'), outputDir, substitutions)
  // puerto + adapter de almacenamiento: solo si algún recurso declara adjuntos
  if (MODEL_LIST.some(model => model.attachments)) {
    generateFiles(tree, path.join(__dirname, 'files-attachments'), outputDir, substitutions)
  }
  // puerto + tabla global de auditoría: solo si algún recurso declara historial (spec 31)
  if (hasHistory) {
    generateFiles(tree, path.join(__dirname, 'files-audit'), outputDir, substitutions)
    generateFiles(tree, path.join(__dirname, persistence.auditFiles), outputDir, substitutions)
  }
  // lo específico del motor (config + persistencia compartida) lo dicta su manifiesto
  generateFiles(tree, path.join(__dirname, persistence.kernelFiles), outputDir, substitutions)

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
