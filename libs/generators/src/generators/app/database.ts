/**
 * Motor de persistencia de la app emitida. Decisión de app, nunca del resource-schema.
 * La validación vive en el registro de ranuras (`plugins/slots.ts`: `selectEngine`);
 * aquí solo queda el tipo que comparten el kernel y el generador de recursos.
 */
export type DatabaseEngine = 'postgres' | 'mongo'
