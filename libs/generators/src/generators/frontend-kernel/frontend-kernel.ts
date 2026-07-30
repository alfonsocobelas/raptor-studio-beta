import { formatFiles, generateFiles, type Tree } from '@nx/devkit'
import * as path from 'path'

export interface FrontendKernelGeneratorSchema {
  directory?: string
  sharedDomainAlias?: string
}

/**
 * Frontend shared kernel scaffold (copy-once): the base the emitted Angular
 * components import — DataTable/KpiCard/AppLogo, download/navigation/uuid
 * utils, http interceptors + api-base-url token, auth guard and the auth/user
 * services (the auth plugin's UI side). Per-resource services and mocks are
 * NOT here: the resource generator emits them.
 */
export async function frontendKernelGenerator(tree: Tree, options: FrontendKernelGeneratorSchema) {
  const outputDir = options.directory ?? path.join('tmp', 'generated', 'frontend-kernel')

  generateFiles(tree, path.join(__dirname, 'files'), outputDir, {
    sharedDomainAlias: options.sharedDomainAlias ?? '@acc/shared/domain'
  })

  await formatFiles(tree)
}

export default frontendKernelGenerator
