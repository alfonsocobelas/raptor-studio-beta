import type { StateMachine } from '@raptor/schema'

/** Un botón de acción de la ficha, tal como lo emitirá el generador. */
export interface DetailActionView {
  name: string
  label: string
}

/**
 * La regla de derivación de los botones de la ficha (spec 74) — el ESPEJO de
 * `entry.detailTransitions` en build-entrypoints: transiciones visibles (sin
 * `hidden`), en el orden del array y con su label. Si el generador cambia la
 * regla, el guard de detail-transitions.spec.ts obliga a cambiar esto también.
 */
export function detailTransitionActions(machine?: StateMachine): DetailActionView[] {
  return (machine?.transitions ?? []).filter(t => !t.hidden).map(t => ({ name: t.name, label: t.label }))
}
