import { formatFiles, generateFiles, type Tree } from '@nx/devkit'
import { execSync } from 'child_process'
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

  // §7 del maestro: lo escrito en los huecos @ai sobrevive a la regeneración.
  // La cosecha usa visitNotIgnoredFiles: en un directorio git-ignorado (p.ej. tmp/)
  // no ve nada y lo escrito en los huecos se perdería EN SILENCIO — mejor avisar.
  const aiSlots = harvestAiSlots(tree, outputDir)
  if (!aiSlots.size && isGitIgnored(outputDir)) {
    console.warn(
      `⚠ '${outputDir}' está git-ignorado: los huecos // @ai:begin no se conservan al regenerar ahí. ` +
        'Genera dentro del árbol versionado si has escrito contenido en ellos.'
    )
  }

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

  // adjuntos (spec 14): módulo aditivo — tabla propia, no toca el agregado
  if (model.attachments) {
    generateFiles(tree, path.join(__dirname, '..', 'resource', 'files-attachments'), outputDir, substitutions)
    generateFiles(tree, path.join(__dirname, '..', 'resource', 'files-attachments-front'), outputDir, substitutions)
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
    // tests de use case (unit, sobre el mock del repositorio)
    if (substitutions.app.emit) {
      generateFiles(
        tree,
        path.join(__dirname, '..', 'resource', 'files-tests-application'),
        path.join(outputDir, 'backend-tests-application'),
        substitutions
      )
      const appTests = path.join(outputDir, 'backend-tests-application')
      if (!substitutions.app.writes) {
        tree.delete(path.join(appTests, `register-${substitutions.fileName}-usecase.test.ts`))
        tree.delete(path.join(appTests, `update-${substitutions.fileName}-usecase.test.ts`))
      }
      if (!substitutions.app.removes) {
        tree.delete(path.join(appTests, `remove-${substitutions.fileName}-usecase.test.ts`))
      }
    }
    // test de integración del repositorio (corre contra el Postgres del compose de test)
    if (substitutions.entry.emit) {
      generateFiles(
        tree,
        path.join(__dirname, '..', 'resource', 'files-tests-integration'),
        path.join(outputDir, 'backend-tests-integration'),
        substitutions
      )
    }
    // una suite sin tests es un fallo para jest: si el modelo no tiene VOs de un
    // grupo, su fichero no se emite
    const voTests = substitutions.domainTests.voTests
    const testsDir = path.join(outputDir, 'backend-tests/value-objects')
    if (!voTests.enums.length) {
      tree.delete(path.join(testsDir, `${substitutions.fileName}-enum-vos.vo.test.ts`))
    }
    if (
      !voTests.numbers.length &&
      !voTests.texts.length &&
      !voTests.exacts.length &&
      !voTests.arrays.length &&
      !voTests.booleans.length
    ) {
      tree.delete(path.join(testsDir, `${substitutions.fileName}-value-vos.vo.test.ts`))
    }
  }

  reinjectAiSlots(tree, outputDir, aiSlots)

  await formatFiles(tree)
}

function isGitIgnored(dir: string): boolean {
  try {
    execSync(`git check-ignore -q ${JSON.stringify(dir)}`, { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

export default resourceGenerator
