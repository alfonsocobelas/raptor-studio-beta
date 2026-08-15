import type { ResourceDefinition } from '@raptor/schema'

/**
 * Padres antes que hijos. Lo necesitan DOS sitios por el mismo motivo —la clave
 * ajena—: la migración, que no puede crear una tabla cuya FK apunte a otra que
 * aún no existe, y el seed, que inserta por el caso de uso de alta y fallaría al
 * referenciar una fila ausente.
 *
 * El orden de llegada es el de las páginas del diseño, que no sabe nada de
 * dependencias: en fincaraiz el panel menciona propiedades antes que agentes.
 */
export function byDependency(models: ResourceDefinition[]): ResourceDefinition[] {
  const pending = [...models]
  const ordered: ResourceDefinition[] = []
  const emitted = new Set<string>()

  while (pending.length) {
    const ready = pending.findIndex(model =>
      Object.values(model.fields)
        .filter(field => field.relation?.kind === 'reference')
        .every(field => {
          const parent = field.relation?.to
          // una referencia fuera de la app no bloquea: no emite clave ajena
          return !parent || parent === model.name || emitted.has(parent) || !models.some(m => m.name === parent)
        })
    )
    // ciclo entre entidades: se emite en orden de llegada y que la FK proteste
    const next = pending.splice(ready >= 0 ? ready : 0, 1)[0]
    emitted.add(next.name)
    ordered.push(next)
  }

  return ordered
}
