import type { AccessRole, ResourceDefinition } from './resource-types'

/** Matriz EFECTIVA: todos los defectos resueltos, una capacidad por transición de la máquina. */
export interface ResolvedAccess {
  view: AccessRole[]
  create: AccessRole[]
  edit: AccessRole[]
  delete: AccessRole[]
  transitions: Record<string, AccessRole[]>
}

/**
 * La política por defecto vive UNA vez aquí (spec 46): lecturas abiertas a viewer,
 * escrituras y transiciones de user — admin siempre puede todo y no se declara.
 * La consumen el generador y el diagrama de casos de uso: divergencia imposible.
 * Desde la spec 49 la escritura es granular (create/edit/delete); `manage` queda
 * como azúcar legado y cubre los tres huecos que la clave granular no declare.
 */
export function resolveAccess(
  definition: Pick<ResourceDefinition, 'access' | 'state'>
): ResolvedAccess {
  const transitions: Record<string, AccessRole[]> = {}
  for (const transition of definition.state?.transitions ?? []) {
    transitions[transition.name] = definition.access?.transitions?.[transition.name] ?? ['user']
  }

  const fallback = definition.access?.manage ?? ['user']
  return {
    view: definition.access?.view ?? ['user', 'viewer'],
    create: definition.access?.create ?? fallback,
    edit: definition.access?.edit ?? fallback,
    delete: definition.access?.delete ?? fallback,
    transitions
  }
}
