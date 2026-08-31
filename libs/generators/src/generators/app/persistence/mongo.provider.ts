import { names } from '@nx/devkit'
import type { ResourceDefinition } from '@raptor/schema'
import { renderMongo } from '../../resource/build-mongo'
import { definePersistence } from './provider'

/**
 * Mongo/Mongoose. Emite su config y su persistencia compartida (`files-mongo` en el kernel)
 * y, por recurso, el schema del documento + el mapper + el repositorio concreto
 * (`files-persistence-mongoose`), con su test de integración contra el replSet del compose.
 *
 * Verificado de punta a punta por la spec 76 (2026-08-31, demo `licencias`). Los campos que
 * siguen ausentes son huecos a propósito, no olvidos: `codeFiles` (Mongo no tiene secuencias),
 * `supportsAttachments` (los adjuntos emiten TypeORM) y `compositionFiles` (los hijos van
 * embebidos en el documento del padre, no en árbol aparte). El manifiesto describe lo que el
 * generador emite de verdad, no lo que nos gustaría que emitiera.
 */
export const mongoPersistence = definePersistence({
  engine: 'mongo',
  kernelFiles: 'files-mongo',
  auditFiles: 'files-audit-mongo',
  persistenceDir: 'mongoose',
  skeletonFiles: 'files-engine-mongo',
  healthIndicator: 'MongooseHealthIndicator',
  dependencies: {
    '@nestjs/mongoose': '^11.0.3',
    mongoose: '^8.9.5'
  },
  // las migraciones son de TypeORM: aquí los índices se materializan con syncIndexes()
  excludesPlugins: ['migrations'],
  // spec 58: toda app lleva auth por defecto, pero el plugin emite persistencia TypeORM.
  // Hasta el port a Mongoose, este motor la degrada con aviso en vez de romper la generación.
  slotFallbacks: {
    auth: {
      value: 'none',
      warning: 'ℹ mongo aún no lleva autenticación: se genera sin auth hasta el port a Mongoose (spec 58).'
    }
  },
  resourceFiles: 'files-persistence-mongoose',
  integrationTestFiles: 'files-tests-integration-mongoose',

  resourceSubstitutions(model: ResourceDefinition): Record<string, unknown> {
    return { mongo: renderMongo(model) }
  },

  testRepository(model: ResourceDefinition): { className: string; importPath: string } {
    const n = names(model.name)
    return {
      className: `Mongoose${n.className}Repository`,
      importPath: `../../src/contexts/${model.context}/modules/${model.plural}/infrastructure/persistence/mongoose/mongoose-${n.fileName}.repository`
    }
  },

  moduleRepository(model: ResourceDefinition): { className: string; importPath: string } {
    const n = names(model.name)
    return {
      className: `Mongoose${n.className}Repository`,
      importPath: `./infrastructure/persistence/mongoose/mongoose-${n.fileName}.repository`
    }
  }
})
