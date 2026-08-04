import { names } from '@nx/devkit'
import type { ResourceDefinition } from '@acc/schema'
import { renderMongo } from '../../resource/build-mongo'
import { definePersistence } from './provider'

/**
 * Mongo/Mongoose. Emite su config y su persistencia compartida (`files-mongo` en el kernel)
 * y, por recurso, el schema del documento + el mapper (`files-persistence-mongoose`).
 *
 * Los campos que siguen ausentes son huecos a propósito, no olvidos: el repositorio
 * concreto, el arranque de la suite de integración y el servicio de compose son las
 * tareas TASK-07..10 de la spec 06. El manifiesto describe lo que el generador emite
 * de verdad, no lo que nos gustaría que emitiera.
 */
export const mongoPersistence = definePersistence({
  engine: 'mongo',
  kernelFiles: 'files-mongo',
  resourceFiles: 'files-persistence-mongoose',

  resourceSubstitutions(model: ResourceDefinition): Record<string, unknown> {
    return { mongo: renderMongo(model) }
  },

  moduleRepository(model: ResourceDefinition): { className: string; importPath: string } {
    const n = names(model.name)
    return {
      className: `Mongoose${n.className}Repository`,
      importPath: `./infrastructure/persistence/mongoose/mongoose-${n.fileName}.repository`
    }
  }
})
