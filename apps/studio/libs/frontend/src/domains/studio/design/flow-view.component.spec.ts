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

/** Pulsar y soltar sin moverse: el gesto de «armar» una conexión. */
function press(element: HTMLElement | null): void {
  if (!element) throw new Error('no existe el elemento que se quería pulsar')
  // jsdom no trae PointerEvent; un MouseEvent con ese nombre le vale al handler,
  // que solo lee clientX/clientY y el id del puntero
  const at = { clientX: 100, clientY: 100, bubbles: true }
  element.setPointerCapture = () => undefined
  element.dispatchEvent(new MouseEvent('pointerdown', at))
  element.dispatchEvent(new MouseEvent('pointerup', at))
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

  it('cada bloque enseña su puerto de entrada: el círculo al que se une la flecha', () => {
    const fixture = mount()

    expect(testId(fixture, 'flow-port-marcar-la-fila')).not.toBeNull()
    expect(testId(fixture, 'flow-port-stock-10')).not.toBeNull()
  })

  it('unir es pulsar el asa y luego el bloque: sin arrastrar y sin puntería', () => {
    const fixture = mount()

    // pulsar el asa sin moverse deja la conexión armada
    press(testId(fixture, 'flow-link-handle-quitar-el-aviso'))
    fixture.detectChanges()
    expect(testId(fixture, 'flow-link-hint')).not.toBeNull()

    // y el siguiente clic en un bloque la cierra
    testId(fixture, 'flow-card-marcar-la-fila')?.click()
    fixture.detectChanges()

    expect(store.flows()[0].edges).toContainEqual({ from: 'quitar-el-aviso', to: 'marcar-la-fila' })
    expect(testId(fixture, 'flow-link-hint')).toBeNull()
  })

  it('pulsar una FILA cierra la flecha contra su tarjeta, no contra la fila', () => {
    const fixture = mount()

    press(testId(fixture, 'flow-link-handle-quitar-el-aviso'))
    // 'enviar-correo' es la segunda fila de la tarjeta que encabeza 'marcar-la-fila'
    testId(fixture, 'flow-step-enviar-correo')?.click()
    fixture.detectChanges()

    expect(store.flows()[0].edges).toContainEqual({ from: 'quitar-el-aviso', to: 'marcar-la-fila' })
  })

  // Cambiar de eje pide RECOLOCAR: es lo contrario de congelar. Con las posiciones
  // congeladas por una edición previa, el botón de orientación no movía nada — y volver
  // a fila tiene que devolver el mismo dibujo que la primera vez, no uno intermedio.
  it('el botón de orientación recoloca en los dos sentidos, aunque el flujo ya se hubiera editado', () => {
    const fixture = mount()
    // el dibujo COMPLETO: la posición de un solo bloque puede coincidir en los dos ejes
    const donde = () =>
      [...fixture.nativeElement.querySelectorAll('[data-testid^="flow-card-"], [data-testid^="flow-node-"]')]
        .map((el: HTMLElement) => `${el.getAttribute('data-testid')} ${el.style.left},${el.style.top}`)
        .filter((line: string) => !line.endsWith(' ,'))
        .join(' | ')
    const toggle = () => {
      testId(fixture, 'flow-orientation')?.click()
      fixture.detectChanges()
    }
    // una edición cualquiera congela el lienzo
    testId(fixture, 'flow-card-add-marcar-la-fila')?.click()
    fixture.detectChanges()

    toggle()
    const columna = donde()
    toggle()
    const fila = donde()

    expect(columna).not.toEqual(fila)
    // y el ciclo es estable: cada eje devuelve siempre el mismo dibujo
    toggle()
    expect(donde()).toEqual(columna)
    toggle()
    expect(donde()).toEqual(fila)
  })

  it('una acción nueva sin nombrar se descarta al pulsar fuera: no queda sembrada', () => {
    const fixture = mount()
    testId(fixture, 'flow-card-add-marcar-la-fila')?.click()
    fixture.detectChanges()
    expect(store.flows()[0].nodes.some(node => node.text === 'Nueva acción')).toBe(true)

    testId(fixture, 'flow-viewport')?.click()
    fixture.detectChanges()

    expect(store.flows()[0].nodes.some(node => node.text === 'Nueva acción')).toBe(false)
    expect(testId(fixture, 'flow-node-text-input')).toBeNull()
  })

  it('una acción a la que SÍ se le pone nombre se queda', () => {
    const fixture = mount()
    testId(fixture, 'flow-card-add-marcar-la-fila')?.click()
    fixture.detectChanges()
    const input = testId(fixture, 'flow-node-text-input') as HTMLInputElement
    input.value = 'Avisar al cliente'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    fixture.detectChanges()

    testId(fixture, 'flow-viewport')?.click()
    fixture.detectChanges()

    expect(store.flows()[0].nodes.some(node => node.text === 'Avisar al cliente')).toBe(true)
  })

  it('el doble clic abre la edición y pulsar fuera la cierra: el bloque no se queda trabado', () => {
    const fixture = mount()

    testId(fixture, 'flow-step-marcar-la-fila')?.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }))
    fixture.detectChanges()
    expect(testId(fixture, 'flow-node-text-input')).not.toBeNull()

    testId(fixture, 'flow-viewport')?.click()
    fixture.detectChanges()

    expect(testId(fixture, 'flow-node-text-input')).toBeNull()
    // y el paso sigue ahí: cerrar la edición no borra lo que ya existía
    expect(store.flows()[0].nodes.some(node => node.id === 'marcar-la-fila')).toBe(true)
  })

  it('pulsar el papel suelta lo elegido, en el lienzo y en el inspector', () => {
    const active = TestBed.inject(ActiveViewService)
    const fixture = mount()
    testId(fixture, 'flow-step-marcar-la-fila')?.click()
    fixture.detectChanges()
    expect(active.flowNode()).toBe('marcar-la-fila')

    testId(fixture, 'flow-viewport')?.click()
    fixture.detectChanges()

    expect(active.flowNode()).toBeNull()
    // y sin nada elegido no hay botón de borrar flotando
    expect(testId(fixture, 'flow-delete-selected')).toBeNull()
  })

  it('ya no hay «+» en las flechas: insertar es cosa de la tarjeta', () => {
    const fixture = mount()

    expect(fixture.nativeElement.querySelector('[data-testid^="flow-insert-"]')).toBeNull()
  })
})
