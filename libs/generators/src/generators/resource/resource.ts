import { formatFiles, generateFiles, type Tree } from '@nx/devkit'
import { execSync } from 'child_process'
import * as path from 'path'
import { buildSubstitutions } from './build-substitutions'
import { harvestAiSlots, reinjectAiSlots } from './ai-slots'
import { MODELS } from './models/registry'
import { selectPersistence } from '../app/persistence/registry'
import type { ResourceGeneratorSchema } from './schema'

export async function resourceGenerator(tree: Tree, options: ResourceGeneratorSchema) {
  const registered = MODELS[options.name]
  if (!registered) {
    throw new Error(`Unknown resource model '${options.name}'. Available models: ${Object.keys(MODELS).join(', ')}`)
  }

  // La app manda sobre el alias: un mismo modelo se emite en proyectos con scopes distintos.
  const model = options.sharedDomainAlias ? { ...registered, sharedDomainAlias: options.sharedDomainAlias } : registered

  // los demás modelos registrados: de ahí salen las tablas relacionadas de la ficha
  const persistence = selectPersistence(options.database)
  const substitutions = buildSubstitutions(model, Object.values(MODELS))
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

  // las constantes de acceso del dominio (spec 46) solo existen si el modelo declara matriz:
  // sin ella los componentes siguen con AuthService.canWrite y el golden no se mueve
  if (!substitutions.entry.accessDeclared) {
    tree.delete(path.join(outputDir, 'frontend', `${substitutions.fileName}-access.ts`))
  }

  // persistencia del recurso: la manda el manifiesto del motor, no un if aquí (spec 23).
  // Los bindings que necesitan sus plantillas los aporta el propio manifiesto.
  const persistenceSubstitutions = { ...substitutions, ...persistence.resourceSubstitutions?.(model) }
  if (persistence.resourceFiles) {
    generateFiles(tree, path.join(__dirname, persistence.resourceFiles), outputDir, persistenceSubstitutions)
  } else {
    console.warn(
      `⚠ El motor '${persistence.engine}' todavía no emite persistencia por recurso: ` +
        'el módulo saldrá sin entidad ni repositorio (pendiente en la spec 06).'
    )
  }

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
    // las transiciones de la máquina de estados (spec 43): un use case + handler por verbo
    for (const transition of substitutions.entry.transitions) {
      generateFiles(
        tree,
        path.join(__dirname, '..', 'resource', 'files-transition'),
        path.join(outputDir, 'backend/application'),
        { ...substitutions, transition, transitionFile: transition.file }
      )
    }
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
    if (!substitutions.app.history) {
      tree.delete(path.join(app, 'dtos', `get-${substitutions.fileName}-history-input.dto.ts`))
      tree.delete(path.join(app, 'use-cases', `get-${substitutions.fileName}-history-usecase.service.ts`))
      tree.delete(path.join(app, 'handlers', `get-${substitutions.fileName}-history.handler.ts`))
    }
    if (!substitutions.app.importCsv) {
      tree.delete(path.join(app, 'dtos', `import-${substitutions.plural}-input.dto.ts`))
      tree.delete(path.join(app, 'use-cases', `import-${substitutions.plural}-usecase.service.ts`))
      tree.delete(path.join(app, 'handlers', `import-${substitutions.plural}.handler.ts`))
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
    // el módulo enlaza el puerto del dominio con el repositorio del motor: lo dice el manifiesto
    generateFiles(tree, path.join(__dirname, '..', 'resource', 'files-module'), path.join(outputDir, 'backend'), {
      ...substitutions,
      repository: persistence.moduleRepository?.(model)
    })
    const entry = path.join(outputDir, 'backend/infrastructure/entrypoints')
    if (!substitutions.app.writes) {
      tree.delete(path.join(entry, 'dtos', `register-${substitutions.fileName}.dto.ts`))
      tree.delete(path.join(entry, 'dtos', `update-${substitutions.fileName}.dto.ts`))
    }
    if (!substitutions.app.importCsv) {
      tree.delete(path.join(entry, 'dtos', `import-${substitutions.plural}.dto.ts`))
    }
  }

  // seed local idempotente (solo recursos con formulario: siembra vía Register use case)
  if (substitutions.entry.emit && substitutions.app.writes) {
    generateFiles(
      tree,
      path.join(__dirname, '..', 'resource', 'files-seed'),
      path.join(outputDir, 'backend/infrastructure/seed'),
      { ...substitutions, persistenceDir: persistence.persistenceDir }
    )
  }

  // adjuntos (spec 14): módulo aditivo — tabla propia, no toca el agregado
  if (model.attachments) {
    generateFiles(tree, path.join(__dirname, '..', 'resource', 'files-attachments'), outputDir, substitutions)
    generateFiles(tree, path.join(__dirname, '..', 'resource', 'files-attachments-front'), outputDir, substitutions)
  }

  // ficha (spec 16): el destino de la acción «ver», emitido solo si se declara
  if (model.detail) {
    generateFiles(tree, path.join(__dirname, '..', 'resource', 'files-detail'), outputDir, substitutions)
  }

  // página-formulario (spec 48): el formulario del diálogo con ruta propia
  if (model.form) {
    generateFiles(tree, path.join(__dirname, '..', 'resource', 'files-form'), outputDir, substitutions)
  }

  // galería (spec 17): otra lectura del listado, en tarjetas
  if (model.gallery) {
    generateFiles(tree, path.join(__dirname, '..', 'resource', 'files-gallery'), outputDir, substitutions)
  }

  // kanban (spec 61): otra lectura del listado, una columna por valor del enum
  if (model.kanban) {
    generateFiles(tree, path.join(__dirname, '..', 'resource', 'files-kanban'), outputDir, substitutions)
  }

  // calendario (spec 59): otra lectura del listado, cada registro en su día
  if (model.calendar) {
    generateFiles(tree, path.join(__dirname, '..', 'resource', 'files-calendar'), outputDir, substitutions)
  }

  // el cronograma exige period; su presencia en el modelo es lo que lo emite (spec 30)
  if (model.gantt) {
    generateFiles(tree, path.join(__dirname, '..', 'resource', 'files-gantt'), outputDir, substitutions)
  }

  // el módulo de labels que dialog y listado ya importan cuando labelsModule (spec 04)
  if (substitutions.labelsModule) {
    generateFiles(tree, path.join(__dirname, '..', 'resource', 'files-labels'), outputDir, substitutions)
  }

  // el diálogo de import CSV validado (spec 33)
  if (substitutions.importCsv) {
    generateFiles(tree, path.join(__dirname, '..', 'resource', 'files-import'), outputDir, substitutions)
  }

  // composición (B3): la entidad hija vive en el domain del padre
  if (substitutions.aggregate.composition) {
    const comp = substitutions.aggregate.composition
    generateFiles(tree, path.join(__dirname, '..', 'resource', 'files-composition'), outputDir, {
      ...substitutions,
      childFileName: comp.childFileName
    })
    if (persistence.compositionFiles) {
      generateFiles(tree, path.join(__dirname, persistence.compositionFiles), outputDir, {
        ...substitutions,
        childFileName: comp.childFileName
      })
    }
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
      path.join(
        outputDir,
        'backend/infrastructure/persistence/typeorm',
        `typeorm-${substitutions.fileName}.repository.ts`
      )
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
      if (!substitutions.app.history) {
        tree.delete(path.join(appTests, `get-${substitutions.fileName}-history-usecase.test.ts`))
      }
      if (!substitutions.app.importCsv) {
        tree.delete(path.join(appTests, `import-${substitutions.plural}-usecase.test.ts`))
      }
    }
    // test de integración del repositorio (corre contra la base real del compose de test)
    if (substitutions.entry.emit && persistence.integrationTestFiles) {
      generateFiles(
        tree,
        path.join(__dirname, persistence.integrationTestFiles),
        path.join(outputDir, 'backend-tests-integration'),
        persistenceSubstitutions
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
