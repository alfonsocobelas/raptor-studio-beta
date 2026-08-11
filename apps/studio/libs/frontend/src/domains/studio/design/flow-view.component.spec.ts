import { beforeEach, describe, expect, it } from 'vitest'
import { TestBed } from '@angular/core/testing'
import { ActiveViewService } from './active-view.service'
import { DesignStore } from './design-store'
import { FlowViewComponent } from './flow-view.component'

// El lienzo de flujos AGRUPA las acciones seguidas en una tarjeta (referencia 12A):
// «RAMA SÍ · 1 Marcar la fila · 2 Enviar correo · + Acción». Aquí se prueba lo que se
// ve y lo que hacen sus gestos; la geometría se prueba en flow-groups.spec.ts.

const FLOW = 'Cambia el stock'

function mount() {
  const fixture = TestBed.createComponent(FlowViewComponent)
  fixture.detectChanges()
  return fixture
}

function testId(fixture: ReturnType<typeof mount>, id: string): HTMLElement | null {
  return fixture.nativeElement.querySelector(`[data-testid="${id}"]`)
}

describe('FlowViewComponent — tarjetas de acciones', () => {
  let store: DesignStore

  beforeEach(() => {
    TestBed.configureTestingModule({})
    store = TestBed.inject(DesignStore)
    TestBed.inject(ActiveViewService).selectFlow(FLOW)

    store.addFlow(FLOW)
    store.addFlowNode(FLOW, 'decision', 'stock < 10')
    store.addFlowNode(FLOW, 'step', 'Marcar la fila')
    store.addFlowNode(FLOW, 'step', 'Enviar correo')
    store.addFlowNode(FLOW, 'step', 'Quitar el aviso')
    store.addFlowEdge(FLOW, 'inicio', 'stock-10')
    store.addFlowEdge(FLOW, 'stock-10', 'marcar-la-fila', 'sí')
    store.addFlowEdge(FLOW, 'marcar-la-fila', 'enviar-correo')
    store.addFlowEdge(FLOW, 'enviar-correo', 'fin')
    store.addFlowEdge(FLOW, 'stock-10', 'quitar-el-aviso', 'no')
    store.addFlowEdge(FLOW, 'quitar-el-aviso', 'fin')
    store.removeFlowEdge(FLOW, 'inicio', 'fin')
  })

  it('las acciones seguidas se dibujan en UNA tarjeta, no en cajas sueltas', () => {
    const fixture = mount()

    expect(testId(fixture, 'flow-card-marcar-la-fila')).not.toBeNull()
    expect(testId(fixture, 'flow-step-marcar-la-fila')).not.toBeNull()
    expect(testId(fixture, 'flow-step-enviar-correo')).not.toBeNull()
    // la acción de la otra rama es su propia tarjeta
    expect(testId(fixture, 'flow-card-quitar-el-aviso')).not.toBeNull()
  })

  it('la tarjeta dice de qué rama cuelga', () => {
    const fixture = mount()

    expect(testId(fixture, 'flow-card-branch-marcar-la-fila')?.textContent).toContain('rama sí')
    expect(testId(fixture, 'flow-card-branch-quitar-el-aviso')?.textContent).toContain('rama no')
  })

  it('las filas se numeran DENTRO de la tarjeta: cada rama empieza por 1', () => {
    const fixture = mount()

    expect(testId(fixture, 'flow-step-number-marcar-la-fila')?.textContent?.trim()).toBe('1')
    expect(testId(fixture, 'flow-step-number-enviar-correo')?.textContent?.trim()).toBe('2')
    expect(testId(fixture, 'flow-step-number-quitar-el-aviso')?.textContent?.trim()).toBe('1')
  })

  it('las flechas internas de la tarjeta no se dibujan: la cadena ya se lee en las filas', () => {
    const fixture = mount()

    expect(testId(fixture, 'flow-edge-marcar-la-fila-enviar-correo')).toBeNull()
    expect(testId(fixture, 'flow-edge-stock-10-marcar-la-fila')).not.toBeNull()
    // la tarjeta sale hacia el fin por su ÚLTIMA acción, pero la flecha la lleva la cabeza
    expect(testId(fixture, 'flow-edge-marcar-la-fila-fin')).not.toBeNull()
  })

  it('«+ Acción» cuelga una acción nueva de la tarjeta y la deja en edición', () => {
    const fixture = mount()

    testId(fixture, 'flow-card-add-marcar-la-fila')?.click()
    fixture.detectChanges()

    const pasos = store.flows()[0].nodes.filter(node => node.kind === 'step')
    expect(pasos.map(paso => paso.text)).toContain('Nueva acción')
    expect(testId(fixture, 'flow-node-text-input')).not.toBeNull()
    // sigue siendo la MISMA tarjeta: la acción entra como tercera fila
    expect(testId(fixture, 'flow-step-number-nueva-accion')?.textContent?.trim()).toBe('3')
  })

  it('la × de una fila quita esa acción y recose la cadena', () => {
    const fixture = mount()

    testId(fixture, 'flow-step-remove-marcar-la-fila')?.click()
    fixture.detectChanges()

    expect(store.flows()[0].nodes.some(node => node.id === 'marcar-la-fila')).toBe(false)
    // 'enviar-correo' hereda la rama: sigue colgando del 'sí' de la decisión
    expect(store.flows()[0].edges).toContainEqual({ from: 'stock-10', to: 'enviar-correo', label: 'sí' })
    expect(testId(fixture, 'flow-card-branch-enviar-correo')?.textContent).toContain('rama sí')
  })

  it('ya no hay «+» en las flechas: insertar es cosa de la tarjeta', () => {
    const fixture = mount()

    expect(fixture.nativeElement.querySelector('[data-testid^="flow-insert-"]')).toBeNull()
  })
})
