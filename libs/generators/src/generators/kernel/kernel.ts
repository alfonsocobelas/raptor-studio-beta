import { formatFiles, generateFiles, names, type Tree } from '@nx/devkit'
import * as path from 'path'
import { contract } from '../resource/models/contract.model'
import { customer } from '../resource/models/customer.model'
import { license } from '../resource/models/license.model'
import { project } from '../resource/models/project.model'
import { ResourceDefinition } from '@acc/schema'

export interface KernelGeneratorSchema {
  directory?: string
  sharedDomainAlias?: string
}

const MODELS: ResourceDefinition[] = [contract, customer, license, project]

/**
 * Shared kernel scaffold (copy-once): the ~80-file base the generated modules
 * compile against — Criteria/query, VO base classes, TypeORM base repository +
 * criteria converter, pipes/filters/interceptors, export, health and the
 * bundle-safe config loader. Curated from the reference: app-specific config
 * sections, migrations and telemetry (observability plugin) stay out; the
 * persistence module derives its entity list from the model registry.
 */
export async function kernelGenerator(tree: Tree, options: KernelGeneratorSchema) {
  const outputDir = options.directory ?? path.join('tmp', 'generated', 'kernel')

  const entities = MODELS.flatMap(model => {
    const n = names(model.name)
    const base = `../../../../${model.context}/modules/${model.plural}/infrastructure/persistence/typeorm`
    const list = [{ className: `TypeOrm${n.className}Entity`, importPath: `${base}/typeorm-${n.fileName}.entity` }]
    if (model.composition) {
      const c = names(model.composition.name)
      list.push({ className: `TypeOrm${c.className}Entity`, importPath: `${base}/typeorm-${c.fileName}.entity` })
    }
    return list
  })

  generateFiles(tree, path.join(__dirname, 'files'), outputDir, {
    sharedDomainAlias: options.sharedDomainAlias ?? '@acc/shared/domain',
    databaseName: [...new Set(MODELS.map(m => m.schemaName))][0] ?? 'app',
    entities
  })

  await formatFiles(tree)
}

export default kernelGenerator
