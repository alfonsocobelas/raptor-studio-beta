import { BRIEF_LIMITS, briefProblems, defineResource, roleProblems, validateFlows } from '@raptor/schema'
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
  // los roles pasan por el MISMO gate que defineApp exigirá al generar (spec 76)
  const roleIssues = roleProblems(design.roles)
  if (roleIssues.length) {
    throw new Error(`Los roles no pasan el gate: ${roleIssues.join('; ')}`)
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

  // Los flujos pasan por el MISMO gate estructural que defineApp exigirá en la frontera
  // (spec 28): rechazarlos aquí da un error accionable al turno del chat, no al generar.
  const flowIssues = validateFlows(design.flows)
  if (flowIssues.length) {
    throw new Error(`Los flujos no pasan el gate: ${flowIssues.join('; ')}`)
  }
  const knownEntities = new Set(design.resources.map(r => r.name))
  for (const flow of design.flows ?? []) {
    for (const node of flow.nodes) {
      if (node.entity !== undefined && !knownEntities.has(node.entity)) {
        throw new Error(`El flujo «${flow.name}» alude a una entidad inexistente: ${node.entity}`)
      }
      // spec 43: la transición del paso debe existir en la máquina de SU entidad — el
      // error llega al diseñar, no al emitir la convergencia
      if (node.transition !== undefined && node.entity !== undefined) {
        const machine = design.resources.find(r => r.name === node.entity)?.state
        if (!machine) {
          throw new Error(
            `El flujo «${flow.name}» referencia la transición «${node.transition}», pero ${node.entity} no declara máquina de estados`
          )
        }
        if (!machine.transitions.some(transition => transition.name === node.transition)) {
          throw new Error(
            `El flujo «${flow.name}» referencia una transición inexistente: «${node.transition}» no está en la máquina de ${node.entity}`
          )
        }
      }
    }
  }

  // spec 46: la matriz de accesos habla de verbos REALES de la máquina de SU entidad — el
  // mensaje accionable llega al diseñar, como las transiciones de la 43; roles y duplicados
  // los vigila el defineResource de abajo
  // Una máquina sin transiciones congela el campo: desaparece del formulario («solo
  // transiciona», spec 43) pero no hay verbo que lo mueva. Lo destapó la demo veterinaria:
  // el borrador promovió «veterinario» a estado vacío y las citas nacían sin veterinario.
  for (const resource of design.resources) {
    if (resource.state && resource.state.transitions.length === 0) {
      throw new Error(
        `La máquina de estados de ${resource.name} está sin transiciones: el campo «${resource.state.field}» quedaría congelado. Declara transiciones o deja el campo como enum normal.`
      )
    }
  }

  for (const resource of design.resources) {
    const verbs = resource.access?.transitions ? Object.keys(resource.access.transitions) : []
    if (!verbs.length) continue
    if (!resource.state) {
      throw new Error(
        `La matriz de accesos cita transiciones, pero ${resource.name} no declara máquina de estados`
      )
    }
    const machine = resource.state
    for (const verb of verbs) {
      if (!machine.transitions.some(transition => transition.name === verb)) {
        throw new Error(`La matriz de accesos cita una transición inexistente: «${verb}» no está en la máquina de ${resource.name}`)
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

  const extraRoles = (clean.roles ?? []).map(role => role.name)
  const registry = Object.fromEntries(
    clean.resources.map(r => [r.name, defineResource(draftToResource(r, clean.appName, clean.resources), { extraRoles })])
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
