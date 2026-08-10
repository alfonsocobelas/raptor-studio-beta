import { formatFiles, generateFiles, type Tree } from '@nx/devkit'
import * as path from 'path'

export interface FrontendKernelGeneratorSchema {
  directory?: string
  sharedDomainAlias?: string
  /** Component library backing the shared UI contracts. Single provider since spec 36. */
  ui?: 'spartan'
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

  const substitutions = { sharedDomainAlias: options.sharedDomainAlias ?? '@acc/shared/domain' }
  generateFiles(tree, path.join(__dirname, 'files'), outputDir, substitutions)

  // Implementación de los contratos UI segun la librería elegida: misma API pública,
  // distinto interior. Es el nivel 1 del ADR-003: las features nunca ven la librería.
  const ui = options.ui ?? 'spartan'
  generateFiles(tree, path.join(__dirname, 'files-ui', ui), outputDir, substitutions)

  await formatFiles(tree)
}

export default frontendKernelGenerator
