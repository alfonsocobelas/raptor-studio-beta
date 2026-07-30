import { formatFiles, generateFiles, type Tree } from '@nx/devkit'
import * as path from 'path'
import { buildSubstitutions } from './build-substitutions'
import { harvestAiSlots, reinjectAiSlots } from './ai-slots'
import { MODELS } from './models/registry'
import type { ResourceGeneratorSchema } from './schema'


export async function resourceGenerator(tree: Tree, options: ResourceGeneratorSchema) {
  const registered = MODELS[options.name]
  if (!registered) {
    throw new Error(`Unknown resource model '${options.name}'. Available models: ${Object.keys(MODELS).join(', ')}`)
  }

  // La app manda sobre el alias: un mismo modelo se emite en proyectos con scopes distintos.
  const model = options.sharedDomainAlias
    ? { ...registered, sharedDomainAlias: options.sharedDomainAlias }
    : registered

  const substitutions = buildSubstitutions(model)
  const outputDir = options.directory ?? path.join('tmp', 'generated', model.plural)

  // §7 del maestro: lo escrito en los huecos @ai sobrevive a la regeneración
  const aiSlots = harvestAiSlots(tree, outputDir)

  generateFiles(tree, path.join(__dirname, 'files'), outputDir, substitutions)

  // VOs: un fichero por campo con vo en forma objeto (plantilla única con ramas por kind)
  for (const vo of substitutions.vos) {
    generateFiles(
      tree,
      path.join(__dirname, '..', 'resource', 'files-vo'),
      path.join(outputDir, 'backend/domain/value-objects'),
      {
        ...substitutions,
        vo,
        voFileName: vo.voFileName
      }
    )
  }

  // capa de aplicación (use cases + handlers + input DTOs + specs de unicidad)
  if (substitutions.app.emit) {
    generateFiles(
      tree,
      path.join(__dirname, '..', 'resource', 'files-application'),
      path.join(outputDir, 'backend/application'),
      substitutions
    )
    for (const spec of substitutions.app.uniqueSpecs) {
      generateFiles(
        tree,
        path.join(__dirname, '..', 'resource', 'files-uspec'),
        path.join(outputDir, 'backend/domain/specifications'),
        { ...substitutions, spec, specFileName: spec.specFileName }
      )
    }
    const app = path.join(outputDir, 'backend/application')
    if (!substitutions.app.writes) {
      for (const op of ['register', 'update']) {
        tree.delete(path.join(app, 'dtos', `${op}-${substitutions.fileName}-input.dto.ts`))
        tree.delete(path.join(app, 'use-cases', `${op}-${substitutions.fileName}-usecase.service.ts`))
        tree.delete(path.join(app, 'handlers', `${op}-${substitutions.fileName}.handler.ts`))
      }
    }
    if (!substitutions.app.removes) {
      tree.delete(path.join(app, 'dtos', `remove-${substitutions.fileName}-input.dto.ts`))
      tree.delete(path.join(app, 'use-cases', `remove-${substitutions.fileName}-usecase.service.ts`))
      tree.delete(path.join(app, 'handlers', `remove-${substitutions.fileName}.handler.ts`))
    }
  }

  // entrypoints REST + module wiring
  if (substitutions.entry.emit) {
    generateFiles(
      tree,
      path.join(__dirname, '..', 'resource', 'files-entrypoints'),
      path.join(outputDir, 'backend/infrastructure/entrypoints'),
      substitutions
    )
    generateFiles(tree, path.join(__dirname, '..', 'resource', 'files-module'), path.join(outputDir, 'backend'), substitutions)
    const entry = path.join(outputDir, 'backend/infrastructure/entrypoints')
    if (!substitutions.app.writes) {
      tree.delete(path.join(entry, 'dtos', `register-${substitutions.fileName}.dto.ts`))
      tree.delete(path.join(entry, 'dtos', `update-${substitutions.fileName}.dto.ts`))
    }
  }

  // seed local idempotente (solo recursos con formulario: siembra vía Register use case)
  if (substitutions.entry.emit && substitutions.app.writes) {
    generateFiles(
      tree,
      path.join(__dirname, '..', 'resource', 'files-seed'),
      path.join(outputDir, 'backend/infrastructure/seed'),
      substitutions
    )
  }

  // composición (B3): la entidad hija vive en el domain del padre
  if (substitutions.aggregate.composition) {
    const comp = substitutions.aggregate.composition
    generateFiles(tree, path.join(__dirname, '..', 'resource', 'files-composition'), outputDir, {
      ...substitutions,
      childFileName: comp.childFileName
    })
    generateFiles(
      tree,
      path.join(__dirname, '..', 'resource', 'files-composition-app'),
      path.join(outputDir, 'backend/application'),
      { ...substitutions, childFileName: comp.childFileName }
    )
    generateFiles(
      tree,
      path.join(__dirname, '..', 'resource', 'files-composition-entry'),
      path.join(outputDir, 'backend/infrastructure/entrypoints'),
      { ...substitutions, childFileName: comp.childFileName, childrenProp: comp.childrenProp }
    )
  }

  // C2: los módulos de oro llevan extensiones a mano que el canon no cubre; se omiten por dato
  const skipPaths: Record<string, string> = {
    mapper: path.join('backend/infrastructure/persistence/typeorm', `${substitutions.fileName}.mapper.ts`),
    constants: path.join('backend/domain', `${substitutions.fileName}-constants.ts`),
    frontendList: path.join('frontend', `${model.plural}-list.component.ts`)
  }
  for (const skip of model.skipEmit ?? []) {
    tree.delete(path.join(outputDir, skipPaths[skip]))
  }
  // el diálogo solo se emite cuando el modelo declara su formulario
  if (!model.formSections?.length) {
    tree.delete(path.join(outputDir, 'frontend', `${substitutions.fileName}-dialog.component.ts`))
  }

  // agregado + types + puerto: solo cuando el modelo declara VOs (síntesis canónica)
  if (!substitutions.aggregate.emitAggregate) {
    tree.delete(path.join(outputDir, 'backend/domain', `${substitutions.fileName}.ts`))
    tree.delete(path.join(outputDir, 'backend/domain', `${substitutions.fileName}-types.ts`))
    tree.delete(path.join(outputDir, 'backend/domain', `${substitutions.fileName}-repository.ts`))
    tree.delete(
      path.join(outputDir, 'backend/infrastructure/persistence/typeorm', `typeorm-${substitutions.fileName}.repository.ts`)
    )
  } else {
    // artefactos de test de dominio (mother, builder, repository mock)
    generateFiles(
      tree,
      path.join(__dirname, '..', 'resource', 'files-tests'),
      path.join(outputDir, 'backend-tests'),
      substitutions
    )
  }

  reinjectAiSlots(tree, outputDir, aiSlots)

  await formatFiles(tree)
}

export default resourceGenerator
