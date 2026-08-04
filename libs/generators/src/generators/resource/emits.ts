import type { ResourceDefinition } from '@acc/schema'

/**
 * Qué piezas emite un recurso, derivado SOLO de su modelo.
 *
 * Vive aquí y no dentro de `buildSubstitutions` porque el ensamblador de la app necesita la misma
 * respuesta sin construir las sustituciones enteras: el `seed.ts` emitido importaba el seeder de
 * todos los modelos, incluso de los que no lo tienen, porque cada sitio decidía por su cuenta
 * (spec 26, familia C).
 */

/** Sin VOs propios no hay dominio emitible, y sin dominio no hay use cases ni entrypoints. */
export function emitsAggregate(definition: ResourceDefinition): boolean {
  return Object.values(definition.fields).some(field => typeof field.vo === 'object')
}

/** Sin formulario no hay escrituras: ni register/update, ni seeder que siembre por ellos. */
export function emitsWrites(definition: ResourceDefinition): boolean {
  return (definition.formSections?.length ?? 0) > 0
}

/** El seed local siembra vía el Register use case: hace falta dominio Y escrituras. */
export function emitsSeeder(definition: ResourceDefinition): boolean {
  return emitsAggregate(definition) && emitsWrites(definition)
}
