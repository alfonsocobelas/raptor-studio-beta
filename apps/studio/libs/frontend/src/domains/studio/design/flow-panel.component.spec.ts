import { beforeEach, describe, expect, it } from 'vitest'
import { TestBed } from '@angular/core/testing'
import { ActiveViewService } from './active-view.service'
import { DesignStore } from './design-store'
import { FlowPanelComponent } from './flow-panel.component'

function mount() {
  const fixture = TestBed.createComponent(FlowPanelComponent)
  fixture.detectChanges()
  return fixture
}

function testId(fixture: ReturnType<typeof mount>, id: string): HTMLElement | null {
  return fixture.nativeElement.querySelector(`[data-testid="${id}"]`)
}

describe('FlowPanelComponent', () => {
  let store: DesignStore
  let active: ActiveViewService

  beforeEach(() => {
    TestBed.configureTestingModule({})
    store = TestBed.inject(DesignStore)
    active = TestBed.inject(ActiveViewService)
    store.addFlow('Aviso de stock bajo')
  })

  it('sin nodo elegido lo dice, y aun así cuenta el flujo en prosa', () => {
    const fixture = mount()

    expect(testId(fixture, 'flow-node-empty')).not.toBeNull()
    expect(testId(fixture, 'flow-prose')?.textContent).toContain('Empieza en «Inicio»')
  })

  it('con un nodo elegido enseña su texto y su tipo', () => {
    active.selectFlowNode('inicio')

    const fixture = mount()

    expect((testId(fixture, 'flow-node-text') as HTMLInputElement).value).toBe('Inicio')
    expect(testId(fixture, 'flow-node-kind')?.textContent).toContain('inicio')
  })

  it('cambiar el texto del nodo lo escribe en el diseño', () => {
    store.addFlowNode('Aviso de stock bajo', 'step', 'Revisar')
    active.selectFlowNode('revisar')

    const fixture = mount()
    const input = testId(fixture, 'flow-node-text') as HTMLInputElement
    input.value = 'Revisar el stock'
    input.dispatchEvent(new Event('input'))

    expect(store.flows()[0].nodes.find(n => n.id === 'revisar')?.text).toBe('Revisar el stock')
  })

  it('apuntar el nodo a una entidad lo guarda', () => {
    store.addResource('Producto')
    store.addFlowNode('Aviso de stock bajo', 'step', 'Revisar')
    active.selectFlowNode('revisar')

    const fixture = mount()
    const select = testId(fixture, 'flow-node-entity') as HTMLSelectElement
    select.value = 'producto'
    select.dispatchEvent(new Event('change'))

    expect(store.flows()[0].nodes.find(n => n.id === 'revisar')?.entity).toBe('producto')
  })

  it('la prosa se actualiza con el dibujo: es la lectura de lo que hay', () => {
    store.addFlowNode('Aviso de stock bajo', 'step', 'Avisar a compras')
    store.addFlowEdge('Aviso de stock bajo', 'inicio', 'avisar-a-compras')

    const fixture = mount()

    expect(testId(fixture, 'flow-prose')?.textContent).toContain('Avisar a compras')
  })

  it('borrar el nodo elegido lo quita del flujo', () => {
    store.addFlowNode('Aviso de stock bajo', 'step', 'Revisar')
    active.selectFlowNode('revisar')

    const fixture = mount()
    testId(fixture, 'flow-node-delete')?.click()

    expect(store.flows()[0].nodes.some(n => n.id === 'revisar')).toBe(false)
  })
})
