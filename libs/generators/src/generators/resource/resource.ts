import { formatFiles, generateFiles, type Tree } from '@nx/devkit'
import * as path from 'path'
import { buildSubstitutions } from './build-substitutions'
import { ResourceDefinition } from '@acc/schema'
import { contract } from './models/contract.model'
import { customer } from './models/customer.model'
import type { ResourceGeneratorSchema } from './schema'

// Static registry (bundle-safe, same pattern as the reference's config-sources.ts).
// New golden entities (customer, license, project) register here as their models are written.
const MODELS: Record<string, ResourceDefinition> = {
  contract,
  customer
}

export async function resourceGenerator(tree: Tree, options: ResourceGeneratorSchema) {
  const model = MODELS[options.name]
  if (!model) {
    throw new Error(`Unknown resource model '${options.name}'. Available models: ${Object.keys(MODELS).join(', ')}`)
  }

  const substitutions = buildSubstitutions(model)
  const outputDir = options.directory ?? path.join('tmp', 'generated', model.plural)

  generateFiles(tree, path.join(__dirname, 'files'), outputDir, substitutions)

  // C2: los módulos de oro no son uniformes; el mapper solo se emite en el estilo canónico
  if (model.mapperStyle !== 'primitives') {
    tree.delete(
      path.join(outputDir, 'backend/infrastructure/persistence/typeorm', `${substitutions.fileName}.mapper.ts`)
    )
  }

  await formatFiles(tree)
}

export default resourceGenerator
