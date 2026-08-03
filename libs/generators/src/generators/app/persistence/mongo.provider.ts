import { definePersistence } from './provider'

/**
 * Mongo/Mongoose. El motor emite hoy su config y su persistencia compartida
 * (`files-mongo`), y nada más: los schemas y repositorios por recurso, el servicio de
 * compose y el arranque de la suite de integración son las tareas pendientes de la
 * spec 06. Esos huecos se dejan como campos ausentes a propósito — el manifiesto
 * describe lo que el generador emite de verdad, no lo que nos gustaría que emitiera.
 */
export const mongoPersistence = definePersistence({
  engine: 'mongo',
  kernelFiles: 'files-mongo'
})
