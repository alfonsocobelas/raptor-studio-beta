import { BRIEF_LIMITS, briefProblems, defineResource } from '@acc/schema'
import { draftToResource } from '@app/shared/domain'
import type { DesignPayload } from './chat.types'

/**
 * Gate del diseño: cada entidad debe expandir a un resource-schema válido y
 * todo bloque debe referenciar entidades declaradas. La traducción al
 * app-schema (y su defineApp) ocurre al generar, con lo que sea generable.
 */
export function validateDesign(design: DesignPayload): DesignPayload {
  // el brief pasa por los MISMOS topes que el schema (spec 22): se reenvía en cada turno del
  // chat, y sin tope la IA puede degradar el prompt con el uso
  const briefIssues = briefProblems(design.brief)
  if (briefIssues.length) {
    throw new Error(`El brief no pasa el gate: ${briefIssues.join('; ')}`)
  }
  for (const resource of design.resources) {
    if (resource.brief !== undefined) {
      if (!resource.brief.trim()) {
        throw new Error(`El brief de ${resource.name} está vacío`)
      }
      if (resource.brief.length > BRIEF_LIMITS.entity) {
        throw new Error(`El brief de ${resource.name} excede ${BRIEF_LIMITS.entity} caracteres`)
      }
    }
  }
  for (const resource of design.resources) {
    for (const field of resource.fields) {
      if (field.type !== 'enum') continue
      // Un conjunto cerrado sin valores no cierra nada, y dos valores iguales
      // harían un badge inalcanzable y una opción duplicada en el desplegable.
      const values = field.values ?? []
      if (!values.length) {
        throw new Error(`El campo «${field.name}» de ${resource.name} es un enum sin valores declarados`)
      }
      const unique = new Set(values.map(value => value.value))
      if (unique.size !== values.length) {
        throw new Error(`El campo «${field.name}» de ${resource.name} tiene valores repetidos`)
      }
    }
  }

  const clean: DesignPayload = JSON.parse(JSON.stringify(design)) as DesignPayload

  // Las referencias se validan sobre el DRAFT: una vez expandido, un destino
  // inexistente ya se ha convertido en una FK rota que nadie detecta (spec 15).
  const declared = new Set(clean.resources.map(r => r.name))
  for (const resource of clean.resources) {
    for (const field of resource.fields) {
      if (field.type !== 'ref') continue
      if (!field.refTo) {
        throw new Error(`«${resource.name}.${field.name}» es una referencia sin entidad de destino`)
      }
      if (field.refTo === resource.name) {
        throw new Error(`«${resource.name}.${field.name}» referencia a sí misma, y el canon no lo emite`)
      }
      if (!declared.has(field.refTo)) {
        throw new Error(`«${resource.name}.${field.name}» referencia una entidad inexistente: ${field.refTo}`)
      }
    }
  }

  const registry = Object.fromEntries(
    clean.resources.map(r => [r.name, defineResource(draftToResource(r, clean.appName, clean.resources))])
  )
  for (const page of clean.pages) {
    for (const block of page.blocks) {
      const refs = [block.resource, ...(block.resources ?? [])].filter(Boolean) as string[]
      for (const ref of refs) {
        if (!registry[ref]) {
          throw new Error(`La vista «${page.title}» referencia una entidad inexistente: ${ref}`)
        }
      }
    }
  }
  return clean
}
