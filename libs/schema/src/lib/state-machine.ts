import type { StateMachine } from './resource-types'

/**
 * Valores del enum que ninguna cadena de transiciones alcanza desde `initial` (spec 43).
 * NO es un error del gate — un diseño a medias es legal y el código emitido no se rompe —
 * sino el aviso que el estudio pinta sobre el diagrama. Un destino cuenta solo si alguno
 * de los orígenes de su transición ya se alcanza: llegar a través de una isla no es llegar.
 */
export function unreachableStates(values: readonly string[], machine: StateMachine): string[] {
  const reached = new Set([machine.initial])

  let grew = true
  while (grew) {
    grew = false
    for (const transition of machine.transitions) {
      if (!reached.has(transition.to) && transition.from.some(origin => reached.has(origin))) {
        reached.add(transition.to)
        grew = true
      }
    }
  }

  return values.filter(value => !reached.has(value))
}
