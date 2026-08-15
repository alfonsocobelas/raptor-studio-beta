import { beforeEach, describe, expect, it } from 'vitest'
import { TestBed } from '@angular/core/testing'
import { ActiveViewService } from './active-view.service'
import { DesignStore } from './design-store'
import { StateDiagramComponent } from './state-diagram.component'

function mount() {
  const fixture = TestBed.createComponent(StateDiagramComponent)
  fixture.detectChanges()
  return fixture
}

function at(fixture: ReturnType<typeof mount>, testid: string): HTMLElement | null {
  return fixture.nativeElement.querySelector(`[data-testid="${testid}"]`)
}

import { STATE_NODE } from '@app/shared/domain'

/**
 * jsdom no trae PointerEvent: un MouseEvent con ese nombre le vale al handler. El destino
 * se resuelve por coordenadas (como en flow-view): en jsdom el rect del svg es (0,0), así
 * que las coordenadas de cliente SON las del layout del diagrama.
 */
function drag(source: Element, targetIndex: number): void {
  ;(source as HTMLElement & { setPointerCapture: () => void }).setPointerCapture = () => undefined
  source.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, clientX: 10, clientY: 10 }))
  const x = targetIndex * (STATE_NODE.width + STATE_NODE.gap) + STATE_NODE.width / 2
  window.dispatchEvent(new MouseEvent('pointermove', { clientX: x, clientY: 78 }))
  window.dispatchEvent(new MouseEvent('pointerup', { clientX: x, clientY: 78 }))
}

describe('StateDiagramComponent — los gestos (spec 43)', () => {
  let store: DesignStore
  let active: ActiveViewService
  let values: string[]

  beforeEach(() => {
    TestBed.configureTestingModule({})
    store = TestBed.inject(DesignStore)
    active = TestBed.inject(ActiveViewService)
    store.addResource('Solicitud')
    store.updateField('solicitud', 0, { type: 'enum' })
    store.promoteState('solicitud', 'nombre')
    values = store.resources()[0].fields[0].values!.map(v => v.value)
    active.selectResource('solicitud')
  })

  const machine = () => store.resources()[0].state
  const verb = (to: string) => `a-${to.replace(/_/g, '-')}`

  it('arrastrar del asa de un estado a otro crea la transición', () => {
    const fixture = mount()

    drag(at(fixture, `state-handle-${values[0]}`)!, 1)
    fixture.detectChanges()

    expect(machine()?.transitions).toHaveLength(1)
    expect(machine()?.transitions[0]).toMatchObject({ from: [values[0]], to: values[1] })
  })

  it('elegir una flecha abre su editor: renombrar verbo y label escribe en el diseño', () => {
    store.addTransition('solicitud', values[0], values[1])
    const fixture = mount()

    at(fixture, `state-edge-${verb(values[1])}:${values[0]}`)?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    fixture.detectChanges()

    const nameInput = at(fixture, 'state-edit-name') as HTMLInputElement
    nameInput.value = 'aprobar'
    nameInput.dispatchEvent(new Event('change'))
    const labelInput = at(fixture, 'state-edit-label') as HTMLInputElement
    labelInput.value = 'Aprobar'
    labelInput.dispatchEvent(new Event('change'))
    fixture.detectChanges()

    expect(machine()?.transitions[0]).toMatchObject({ name: 'aprobar', label: 'Aprobar' })
  })

  it('Supr borra la flecha elegida (ese origen, no el verbo entero si tiene más)', () => {
    store.addTransition('solicitud', values[0], values[2])
    store.addTransition('solicitud', values[1], values[2])
    const fixture = mount()

    at(fixture, `state-edge-${verb(values[2])}:${values[0]}`)?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    fixture.detectChanges()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', bubbles: true }))
    fixture.detectChanges()

    expect(machine()?.transitions[0].from).toEqual([values[1]])
  })

  /** Bug cazado en la validación en navegador: Backspace DENTRO del input del editor borraba la flecha. */
  it('teclear Backspace dentro del editor no borra la flecha seleccionada', () => {
    store.addTransition('solicitud', values[0], values[1])
    const fixture = mount()
    at(fixture, `state-edge-${verb(values[1])}:${values[0]}`)?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    fixture.detectChanges()

    const input = at(fixture, 'state-edit-name') as HTMLInputElement
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true }))
    fixture.detectChanges()

    expect(machine()?.transitions).toHaveLength(1)
  })

  it('elegir un estado ofrece hacerlo inicial', () => {
    const fixture = mount()

    at(fixture, `state-node-${values[1]}`)?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    fixture.detectChanges()
    at(fixture, 'state-make-initial')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    fixture.detectChanges()

    expect(machine()?.initial).toBe(values[1])
  })
})
