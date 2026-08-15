import { unreachableStates } from './state-machine'
import type { StateMachine } from './resource-types'

/**
 * Spec 43: la alcanzabilidad NO es error del gate (un diseño a medias es legal); es un
 * aviso que el estudio pinta. Un valor es alcanzable si es el inicial o si alguna
 * transición cuyo origen ya se alcanza lo tiene por destino.
 */
describe('unreachableStates', () => {
  const machine = (transitions: StateMachine['transitions']): StateMachine => ({
    field: 'estado',
    initial: 'pendiente',
    transitions
  })

  it('en una máquina completa no sobra nadie', () => {
    const result = unreachableStates(['pendiente', 'aprobada', 'cerrada'], machine([
      { name: 'aprobar', label: 'Aprobar', from: ['pendiente'], to: 'aprobada' },
      { name: 'cerrar', label: 'Cerrar', from: ['aprobada'], to: 'cerrada' }
    ]))

    expect(result).toEqual([])
  })

  it('un valor al que nada llega queda señalado', () => {
    const result = unreachableStates(['pendiente', 'aprobada', 'limbo'], machine([
      { name: 'aprobar', label: 'Aprobar', from: ['pendiente'], to: 'aprobada' }
    ]))

    expect(result).toEqual(['limbo'])
  })

  it('llegar a través de un estado inalcanzable no cuenta: la cadena entera está suelta', () => {
    const result = unreachableStates(['pendiente', 'isla', 'colonia'], machine([
      { name: 'colonizar', label: 'Colonizar', from: ['isla'], to: 'colonia' }
    ]))

    expect(result).toEqual(['isla', 'colonia'])
  })

  it('sin transiciones, todo salvo el inicial está suelto', () => {
    expect(unreachableStates(['pendiente', 'aprobada'], machine([]))).toEqual(['aprobada'])
  })
})
