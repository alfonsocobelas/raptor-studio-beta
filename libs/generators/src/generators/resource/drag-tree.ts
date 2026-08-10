import { ResourceDefinition, wantsSoftDelete } from '@acc/schema'

/**
 * Un nivel del arrastre: la entidad que cae, el campo por el que cuelga de su padre y de
 * quién cuelga. El orden del array ES el orden de marcado (padres antes que hijos).
 */
export interface DragLevel {
  entity: string
  plural: string
  /** Campo del hijo que referencia al padre (su FK) */
  fkField: string
  /** Entidad de la que cuelga este nivel */
  parent: string
}

/**
 * Árbol de arrastre del borrado suave (spec 38): quién cae cuando cae un padre.
 *
 * Se deriva del registro con la MISMA regla que las tablas relacionadas de la ficha
 * (ADR-002 punto 4: quien me referencia, cuelga de mí) y se resuelve al emitir, así que
 * el use case recibe niveles ya calculados y los marca en orden dentro de una transacción.
 *
 * Un hijo con la escotilla física queda fuera —no tiene estado que marcar— y con él su
 * rama entera: lo que cuelga de algo que no cae, no cae.
 */
export function buildDragTree(definition: ResourceDefinition, registry: ResourceDefinition[]): DragLevel[] {
  const levels: DragLevel[] = []
  const visited = new Set<string>([definition.name])
  let frontier = [definition.name]

  // Anchura, no profundidad: el orden del array debe poder marcarse tal cual (un nivel
  // necesita los ids del anterior). La visita marcada corta los ciclos de referencias.
  while (frontier.length) {
    const next: string[] = []
    for (const parent of frontier) {
      for (const child of registry) {
        if (visited.has(child.name) || !wantsSoftDelete(child)) continue
        const link = Object.entries(child.fields).find(
          ([, field]) => field.relation?.kind === 'reference' && field.relation.to === parent
        )
        if (!link) continue
        visited.add(child.name)
        levels.push({ entity: child.name, plural: child.plural, fkField: link[0], parent })
        next.push(child.name)
      }
    }
    frontier = next
  }

  return levels
}

/** Referencias por las que ESTA entidad puede ser arrastrada (sus FKs a otros agregados). */
export interface DraggedRelation {
  fkField: string
  /** Nombre del método de marcado emitido en su port: removeDraggedBy<Fk> */
  method: string
}

export function draggedRelations(definition: ResourceDefinition): DraggedRelation[] {
  if (!wantsSoftDelete(definition)) return []
  return Object.entries(definition.fields)
    .filter(([, field]) => field.relation?.kind === 'reference')
    .map(([fkField]) => ({
      fkField,
      method: `removeDraggedBy${fkField.charAt(0).toUpperCase()}${fkField.slice(1)}`
    }))
}

/**
 * ¿Esta entidad participa del contrato de borrado suave? Sí cuando es suave y además
 * borra desde su listado o puede ser arrastrada por un padre. Gobierna la firma del
 * port, el import del DeleteOperationId y la emisión de restoreByOp.
 */
export function softDeleteContract(definition: ResourceDefinition): boolean {
  const removes = definition.list?.features?.delete === true
  return wantsSoftDelete(definition) && (removes || draggedRelations(definition).length > 0)
}
