import { formatFiles, generateFiles, type Tree } from '@nx/devkit'
import * as path from 'path'
import { buildSubstitutions } from './build-substitutions'
import { ResourceDefinition } from '@acc/schema'
import { contract } from './models/contract.model'
import { customer } from './models/customer.model'
import { license } from './models/license.model'
import { project } from './models/project.model'
import type { ResourceGeneratorSchema } from './schema'

// Static registry (bundle-safe, same pattern as the reference's config-sources.ts).
// New golden entities (customer, license, project) register here as their models are written.
const MODELS: Record<string, ResourceDefinition> = {
  contract,
  customer,
  license,
  project
}

export async function resourceGenerator(tree: Tree, options: ResourceGeneratorSchema) {
  const model = MODELS[options.name]
  if (!model) {
    throw new Error(`Unknown resource model '${options.name}'. Available models: ${Object.keys(MODELS).join(', ')}`)
  }

  const substitutions = buildSubstitutions(model)
  const outputDir = options.directory ?? path.join('tmp', 'generated', model.plural)

  generateFiles(tree, path.join(__dirname, 'files'), outputDir, substitutions)

  // C2: los módulos de oro llevan extensiones a mano que el canon no cubre; se omiten por dato
  const skipPaths: Record<string, string> = {
    mapper: path.join('backend/infrastructure/persistence/typeorm', `${substitutions.fileName}.mapper.ts`),
    constants: path.join('backend/domain', `${substitutions.fileName}-constants.ts`),
    frontendList: path.join('frontend', `${model.plural}-list.component.ts`)
  }
  for (const skip of model.skipEmit ?? []) {
    tree.delete(path.join(outputDir, skipPaths[skip]))
  }

  await formatFiles(tree)
}

export default resourceGenerator
