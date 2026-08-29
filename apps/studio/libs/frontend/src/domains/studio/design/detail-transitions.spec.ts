import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import type { StateMachine } from '@raptor/schema'
import { detailTransitionActions } from './detail-transitions'

/**
 * Spec 74: la ficha del lienzo pinta los botones de transición que la app emitida
 * pinta — misma regla de derivación que `entry.detailTransitions` del generador
 * (build-entrypoints): las visibles, en el orden del array y con su label.
 */
describe('detailTransitionActions — la regla de derivación del lienzo', () => {
  const machine: StateMachine = {
    field: 'estado',
    initial: 'captado',
    transitions: [
      { name: 'publicar', label: 'Publicar', from: ['captado'], to: 'en_venta' },
      { name: 'retirar', label: 'Retirar', from: ['captado', 'en_venta'], to: 'retirado', hidden: true },
      { name: 'vender', label: 'Vender', from: ['en_venta'], to: 'vendido' }
    ]
  }

  it('deriva un botón por transición visible, en el orden del array y con su label', () => {
    expect(detailTransitionActions(machine)).toEqual([
      { name: 'publicar', label: 'Publicar' },
      { name: 'vender', label: 'Vender' }
    ])
  })

  it('sin máquina no hay botones', () => {
    expect(detailTransitionActions(undefined)).toEqual([])
  })

  it('con todo oculto la lista queda vacía (la ficha no pinta botonera de transiciones)', () => {
    const allHidden: StateMachine = {
      ...machine,
      transitions: machine.transitions.map(t => ({ ...t, hidden: true }))
    }
    expect(detailTransitionActions(allHidden)).toEqual([])
  })
})

/**
 * Guard de deriva (patrón spec 68): se lee el FUENTE del componente. Lo que se comprueba
 * es que el lienzo use la regla compartida y el cromo del botón emitido — que es
 * exactamente lo que se olvida cuando la plantilla cambia.
 */
describe('canvas-detail usa la derivación y el cromo del emitido', () => {
  const source = readFileSync(join(__dirname, 'canvas-detail.component.ts'), 'utf-8')
  const template = readFileSync(
    join(
      __dirname,
      '..',
      '..',
      '..',
      '..',
      '..',
      '..',
      '..',
      '..',
      'libs/generators/src/generators/resource/files-detail/frontend/__fileName__-detail.component.ts.template'
    ),
    'utf-8'
  )

  it('el lienzo deriva con detailTransitionActions, nunca con su propia regla', () => {
    expect(source).toContain('detailTransitionActions')
  })

  it('el cromo del botón del lienzo es el de la plantilla emitida', () => {
    const chrome = 'border-input hover:bg-accent flex items-center gap-2 rounded-md border px-3 py-2 text-sm'
    expect(template).toContain(chrome)
    expect(source).toContain(chrome)
  })

  it('la plantilla emitida sigue leyendo la lista curada (si esto rompe, revisar la regla del lienzo)', () => {
    expect(template).toContain('entry.detailTransitions.forEach')
  })
})
