import { beforeEach, describe, expect, it } from 'vitest'
import { TestBed } from '@angular/core/testing'
import { ActiveViewService } from './active-view.service'
import { DesignStore } from './design-store'
import { DetailActionsConfigComponent } from './detail-actions-config.component'

function mount(resource: string | null = 'solicitud') {
  const fixture = TestBed.createComponent(DetailActionsConfigComponent)
  fixture.componentRef.setInput('resource', resource)
  fixture.detectChanges()
  return fixture
}

const query = (fixture: ReturnType<typeof mount>, testid: string): HTMLElement | null =>
  (fixture.nativeElement as HTMLElement).querySelector(`[data-testid="${testid}"]`)

/**
 * Spec 74 (gesto): con la ficha seleccionada, el panel lista los botones que emitirá
 * la app — ocultar, renombrar el label y reordenar escriben en la máquina del recurso.
 */
describe('DetailActionsConfigComponent', () => {
  let store: DesignStore
  let active: ActiveViewService

  beforeEach(() => {
    TestBed.configureTestingModule({})
    store = TestBed.inject(DesignStore)
    active = TestBed.inject(ActiveViewService)
    store.addResource('Solicitud')
    store.updateField('solicitud', 0, { type: 'enum' })
    store.promoteState('solicitud', 'nombre')
    const [a, b, c] = store.resources()[0].fields[0].values!.map(v => v.value)
    store.addTransition('solicitud', a, b)
    store.addTransition('solicitud', a, c)
    store.addPage('blank', 'Ficha')
    store.addBlock(0, { kind: 'fields', resource: 'solicitud' })
    active.select(0)
    active.selectResource('solicitud')
  })

  const machine = () => store.resources()[0].state!

  it('sin bloque de ficha en la vista activa no pinta nada', () => {
    store.addPage('blank', 'Vacía')
    active.select(1)
    const fixture = mount()

    expect((fixture.nativeElement as HTMLElement).textContent?.trim()).toBe('')
  })

  it('lista un botón por transición, en el orden del array y con su label', () => {
    const fixture = mount()

    const labels = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('[data-testid^="action-label-"]')
    ) as HTMLInputElement[]
    expect(labels.map(i => i.value)).toEqual(machine().transitions.map(t => t.label))
  })

  it('el ojo oculta el botón (hidden en la máquina) y el panel lo enseña atenuado', () => {
    const fixture = mount()

    query(fixture, 'action-hide-0')!.click()
    fixture.detectChanges()

    expect(machine().transitions[0].hidden).toBe(true)

    query(fixture, 'action-hide-0')!.click()
    fixture.detectChanges()
    expect('hidden' in machine().transitions[0]).toBe(false)
  })

  it('editar el label escribe en la transición', () => {
    const fixture = mount()

    const input = query(fixture, 'action-label-0') as HTMLInputElement
    input.value = 'Aprobar ya'
    input.dispatchEvent(new Event('input'))
    fixture.detectChanges()

    expect(machine().transitions[0].label).toBe('Aprobar ya')
  })

  // El caso ofertas (spec 74): máquina con botones pero ninguna vista de ficha en el diseño.
  it('sin vista de ficha de la entidad en el diseño, avisa y el botón la crea de un clic', () => {
    store.addResource('Oferta')
    store.updateField('oferta', 0, { type: 'enum' })
    store.promoteState('oferta', 'nombre')
    const [a, b] = store.resources().find(r => r.name === 'oferta')!.fields[0].values!.map(v => v.value)
    store.addTransition('oferta', a, b)
    store.addPage('blank', 'Tablero')
    store.addBlock(1, { kind: 'kanban', resource: 'oferta' })
    active.select(1)
    active.selectResource('oferta')
    const fixture = mount('oferta')

    expect(query(fixture, 'detail-actions-missing')).not.toBeNull()

    query(fixture, 'detail-actions-add')!.click()
    fixture.detectChanges()

    expect(store.pages().some(p => p.blocks.some(bl => bl.kind === 'fields' && bl.resource === 'oferta'))).toBe(true)
    expect(query(fixture, 'detail-actions-missing')).toBeNull()
  })

  it('las flechas reordenan (y el borde no rompe)', () => {
    const fixture = mount()
    const before = machine().transitions.map(t => t.name)

    query(fixture, 'action-down-0')!.click()
    fixture.detectChanges()
    expect(machine().transitions.map(t => t.name)).toEqual([before[1], before[0]])

    query(fixture, 'action-up-0')!.click()
    fixture.detectChanges()
    expect(machine().transitions.map(t => t.name)).toEqual([before[1], before[0]])
  })
})
