import { beforeEach, describe, expect, it } from 'vitest'
import { TestBed } from '@angular/core/testing'
import { INITIAL_VIEWPORT, flowLoosePosition, flowNodeSize } from '@app/shared/domain'
import { chooseInSelect, selectValueLabel } from '../../../shared/components/ui/select.harness'
import { ActiveViewService } from './active-view.service'
import { CanvasViewportService } from './canvas-viewport.service'
import { DesignStore } from './design-store'
import { FLOW_CANVAS_FALLBACK, FlowViewComponent } from './flow-view.component'

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

  // La rama ya la dice la pastilla de la FLECHA que entra en la tarjeta: repetirla en la
  // cabecera era decir dos veces lo mismo. La cabecera dice qué es y cuántas lleva.
  it('la cabecera de la tarjeta dice «acciones», nunca de qué rama cuelga', () => {
    const fixture = mount()

    expect(testId(fixture, 'flow-card-branch-marcar-la-fila')?.textContent?.trim()).toBe('acciones')
    expect(testId(fixture, 'flow-card-branch-quitar-el-aviso')?.textContent?.trim()).toBe('acciones')
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
    expect(testId(fixture, 'flow-card-branch-enviar-correo')?.textContent?.trim()).toBe('acciones')
  })

  // El puerto sirve para RECIBIR la flecha, así que solo se ve cuando hay una en el aire.
  // Pasar por encima de un bloque enseña su asa negra, la de sacarla, y nada más.
  it('los puertos están ocultos hasta que hay una flecha en el aire', () => {
    const fixture = mount()
    const puerto = () => testId(fixture, 'flow-port-marcar-la-fila')?.style.opacity

    expect(puerto()).toBe('0')

    press(testId(fixture, 'flow-link-handle-quitar-el-aviso'))
    fixture.detectChanges()

    expect(puerto()).toBe('1')
    // y al dejarlo, se vuelven a esconder
    testId(fixture, 'flow-viewport')?.click()
    fixture.detectChanges()
    expect(puerto()).toBe('0')
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

  it('una flecha que no se une a nada NO se queda dibujada en el lienzo', () => {
    const fixture = mount()
    const asa = testId(fixture, 'flow-link-handle-quitar-el-aviso') as HTMLElement
    asa.setPointerCapture = () => undefined

    asa.dispatchEvent(new MouseEvent('pointerdown', { clientX: 100, clientY: 100, bubbles: true }))
    window.dispatchEvent(new MouseEvent('pointermove', { clientX: 400, clientY: 600 }))
    fixture.detectChanges()
    expect(testId(fixture, 'flow-ghost-edge')).not.toBeNull()

    // soltar en el vacío: la flecha desaparece y no se ha creado ningún tramo
    window.dispatchEvent(new MouseEvent('pointerup', { clientX: 400, clientY: 600 }))
    fixture.detectChanges()

    expect(testId(fixture, 'flow-ghost-edge')).toBeNull()
    expect(store.flows()[0].edges.some(edge => edge.from === 'quitar-el-aviso' && edge.to !== 'fin')).toBe(false)
  })

  it('si el puntero se cancela a mitad del gesto, la flecha tampoco se queda', () => {
    const fixture = mount()
    const asa = testId(fixture, 'flow-link-handle-quitar-el-aviso') as HTMLElement
    asa.setPointerCapture = () => undefined

    asa.dispatchEvent(new MouseEvent('pointerdown', { clientX: 100, clientY: 100, bubbles: true }))
    window.dispatchEvent(new MouseEvent('pointermove', { clientX: 400, clientY: 600 }))
    fixture.detectChanges()
    expect(testId(fixture, 'flow-ghost-edge')).not.toBeNull()

    window.dispatchEvent(new MouseEvent('pointercancel', {}))
    fixture.detectChanges()

    expect(testId(fixture, 'flow-ghost-edge')).toBeNull()
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

  // El desplegable nativo lo pinta el sistema operativo, no el CSS del estudio (ADR-003).
  it('la entidad del paso se elige con el desplegable del estudio, no con el del navegador', async () => {
    store.addResource('Pedido')
    const fixture = mount()

    testId(fixture, 'flow-step-marcar-la-fila')?.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }))
    fixture.detectChanges()
    await fixture.whenStable()
    fixture.detectChanges()

    expect(fixture.nativeElement.querySelector('select')).toBeNull()
    expect(selectValueLabel(fixture, 'flow-node-entity-select')).toBe('— sin entidad —')

    await chooseInSelect(fixture, 'flow-node-entity-select', 'Pedido')

    expect(store.flows()[0].nodes.find(node => node.id === 'marcar-la-fila')?.entity).toBe('pedido')

    await chooseInSelect(fixture, 'flow-node-entity-select', '— sin entidad —')

    expect(store.flows()[0].nodes.find(node => node.id === 'marcar-la-fila')?.entity).toBeUndefined()
  })

  it('ya no hay «+» en las flechas: insertar es cosa de la tarjeta', () => {
    const fixture = mount()

    expect(fixture.nativeElement.querySelector('[data-testid^="flow-insert-"]')).toBeNull()
  })
})

// Reordenar las acciones (spec 40): el asa de la fila es lo único que arrastra la fila; la
// tarjeta se sigue moviendo por su cabecera y el clic sigue seleccionando.
describe('FlowViewComponent — reordenar las filas de una tarjeta', () => {
  let store: DesignStore

  beforeEach(() => {
    TestBed.configureTestingModule({})
    store = TestBed.inject(DesignStore)
    TestBed.inject(ActiveViewService).selectFlow(FLOW)

    store.addFlow(FLOW)
    store.addFlowNode(FLOW, 'step', 'Marcar la fila')
    store.addFlowNode(FLOW, 'step', 'Enviar correo')
    store.addFlowNode(FLOW, 'step', 'Cerrar el aviso')
    store.addFlowEdge(FLOW, 'inicio', 'marcar-la-fila')
    store.addFlowEdge(FLOW, 'marcar-la-fila', 'enviar-correo')
    store.addFlowEdge(FLOW, 'enviar-correo', 'cerrar-el-aviso')
    store.addFlowEdge(FLOW, 'cerrar-el-aviso', 'fin')
    store.removeFlowEdge(FLOW, 'inicio', 'fin')
  })

  /** Arrastra el asa de una fila `filas` posiciones hacia abajo (negativo = hacia arriba). */
  function dragRow(fixture: ReturnType<typeof mount>, stepId: string, filas: number): void {
    const asa = testId(fixture, `flow-step-grip-${stepId}`) as HTMLElement
    if (!asa) throw new Error(`la fila ${stepId} no tiene asa de arrastre`)
    asa.setPointerCapture = () => undefined
    asa.dispatchEvent(new MouseEvent('pointerdown', { clientX: 50, clientY: 100, bubbles: true }))
    window.dispatchEvent(new MouseEvent('pointermove', { clientX: 50, clientY: 100 + filas * 52 }))
    fixture.detectChanges()
    window.dispatchEvent(new MouseEvent('pointerup', { clientX: 50, clientY: 100 + filas * 52 }))
    fixture.detectChanges()
  }

  it('arrastrar una fila hacia arriba la sube de puesto y renumera', () => {
    const fixture = mount()

    dragRow(fixture, 'cerrar-el-aviso', -2)

    expect(testId(fixture, 'flow-step-number-cerrar-el-aviso')?.textContent?.trim()).toBe('1')
    expect(testId(fixture, 'flow-step-number-marcar-la-fila')?.textContent?.trim()).toBe('2')
    expect(store.flows()[0].edges).toContainEqual({ from: 'inicio', to: 'cerrar-el-aviso' })
  })

  it('arrastrar una fila hacia abajo la baja de puesto', () => {
    const fixture = mount()

    dragRow(fixture, 'marcar-la-fila', 2)

    expect(testId(fixture, 'flow-step-number-marcar-la-fila')?.textContent?.trim()).toBe('3')
    expect(store.flows()[0].edges).toContainEqual({ from: 'marcar-la-fila', to: 'fin' })
  })

  it('la guía dice dónde va a caer, y solo mientras se arrastra', () => {
    const fixture = mount()
    const asa = testId(fixture, 'flow-step-grip-cerrar-el-aviso') as HTMLElement
    asa.setPointerCapture = () => undefined

    expect(testId(fixture, 'flow-step-drop-guide')).toBeNull()

    asa.dispatchEvent(new MouseEvent('pointerdown', { clientX: 50, clientY: 100, bubbles: true }))
    window.dispatchEvent(new MouseEvent('pointermove', { clientX: 50, clientY: 100 - 52 }))
    fixture.detectChanges()
    expect(testId(fixture, 'flow-step-drop-guide')).not.toBeNull()

    window.dispatchEvent(new MouseEvent('pointerup', { clientX: 50, clientY: 100 - 52 }))
    fixture.detectChanges()
    expect(testId(fixture, 'flow-step-drop-guide')).toBeNull()
  })

  it('soltar la fila donde estaba no cambia el flujo', () => {
    const fixture = mount()
    const antes = store.flows()[0]

    dragRow(fixture, 'enviar-correo', 0)

    expect(store.flows()[0]).toBe(antes)
  })

  it('el asa no selecciona la fila ni abre su edición', () => {
    const fixture = mount()

    dragRow(fixture, 'cerrar-el-aviso', -1)

    expect(testId(fixture, 'flow-node-text-input')).toBeNull()
  })

  it('si el puntero se cancela a mitad, la fila se queda donde estaba', () => {
    const fixture = mount()
    const antes = store.flows()[0]
    const asa = testId(fixture, 'flow-step-grip-cerrar-el-aviso') as HTMLElement
    asa.setPointerCapture = () => undefined

    asa.dispatchEvent(new MouseEvent('pointerdown', { clientX: 50, clientY: 100, bubbles: true }))
    window.dispatchEvent(new MouseEvent('pointermove', { clientX: 50, clientY: 100 - 104 }))
    window.dispatchEvent(new MouseEvent('pointercancel', { clientX: 50, clientY: 100 - 104 }))
    fixture.detectChanges()

    expect(store.flows()[0]).toBe(antes)
    expect(testId(fixture, 'flow-step-drop-guide')).toBeNull()
  })
})

// La tarjeta se identifica por el id de su PRIMERA acción, así que reordenar puede cambiarle
// la identidad al bloque. Sin congelar antes, el layout lo trata como uno nuevo y todo el
// lienzo se recoloca: lo que se ve es la acción «saltando» a otro bloque (bug 2026-08-13).
describe('FlowViewComponent — reordenar no recoloca el lienzo', () => {
  let store: DesignStore

  beforeEach(() => {
    TestBed.configureTestingModule({})
    store = TestBed.inject(DesignStore)
    TestBed.inject(ActiveViewService).selectFlow(FLOW)

    store.addFlow(FLOW)
    store.addFlowNode(FLOW, 'decision', '¿hay recambio?')
    store.addFlowNode(FLOW, 'step', 'Pedir el recambio')
    store.addFlowNode(FLOW, 'step', 'Reparar la maquina')
    store.addFlowNode(FLOW, 'step', 'Entregar la maquina')
    store.addFlowEdge(FLOW, 'inicio', 'hay-recambio')
    store.addFlowEdge(FLOW, 'hay-recambio', 'reparar-la-maquina', 'sí')
    store.addFlowEdge(FLOW, 'reparar-la-maquina', 'entregar-la-maquina')
    store.addFlowEdge(FLOW, 'entregar-la-maquina', 'fin')
    store.addFlowEdge(FLOW, 'hay-recambio', 'pedir-el-recambio', 'no')
    store.addFlowEdge(FLOW, 'pedir-el-recambio', 'hay-recambio')
    store.removeFlowEdge(FLOW, 'inicio', 'fin')
  })

  /** Sitio de cada bloque del lienzo, tal como lo pinta la vista. */
  function sitios(fixture: ReturnType<typeof mount>): Record<string, string> {
    const bloques = fixture.nativeElement.querySelectorAll<HTMLElement>(
      '[data-testid^="flow-card-"], [data-testid^="flow-node-"]'
    )
    const out: Record<string, string> = {}
    for (const bloque of bloques) {
      const id = bloque.getAttribute('data-testid') as string
      if (id.includes('-branch-') || id.includes('-add-') || id.includes('-kind-')) continue
      if (bloque.style.left) out[id] = `${bloque.style.left},${bloque.style.top}`
    }
    return out
  }

  function dragRow(fixture: ReturnType<typeof mount>, stepId: string, filas: number): void {
    const asa = testId(fixture, `flow-step-grip-${stepId}`) as HTMLElement
    asa.setPointerCapture = () => undefined
    asa.dispatchEvent(new MouseEvent('pointerdown', { clientX: 50, clientY: 300, bubbles: true }))
    window.dispatchEvent(new MouseEvent('pointermove', { clientX: 50, clientY: 300 + filas * 52 }))
    window.dispatchEvent(new MouseEvent('pointerup', { clientX: 50, clientY: 300 + filas * 52 }))
    fixture.detectChanges()
  }

  it('la tarjeta se queda en su sitio aunque el reordenado le cambie la cabeza', () => {
    const fixture = mount()
    const antes = sitios(fixture)

    dragRow(fixture, 'entregar-la-maquina', -1)

    const despues = sitios(fixture)
    // la tarjeta ahora se llama por su nueva cabeza, pero ocupa el MISMO sitio
    expect(despues['flow-card-entregar-la-maquina']).toBe(antes['flow-card-reparar-la-maquina'])
  })

  it('y ningún otro bloque cambia de sitio', () => {
    const fixture = mount()
    const antes = sitios(fixture)

    dragRow(fixture, 'entregar-la-maquina', -1)

    const despues = sitios(fixture)
    const movidos = Object.keys(despues).filter(id => antes[id] && antes[id] !== despues[id])
    expect(movidos).toEqual([])
  })
})

// Borrar la PRIMERA acción también rebautiza la tarjeta (la cabeza pasa a ser la siguiente).
// `inheritCardPosition` ya lo cubre; esto lo ata para que siga siendo verdad.
describe('FlowViewComponent — borrar la cabeza tampoco recoloca el lienzo', () => {
  let store: DesignStore

  beforeEach(() => {
    TestBed.configureTestingModule({})
    store = TestBed.inject(DesignStore)
    TestBed.inject(ActiveViewService).selectFlow(FLOW)

    store.addFlow(FLOW)
    store.addFlowNode(FLOW, 'decision', '¿hay recambio?')
    store.addFlowNode(FLOW, 'step', 'Pedir el recambio')
    store.addFlowNode(FLOW, 'step', 'Reparar la maquina')
    store.addFlowNode(FLOW, 'step', 'Entregar la maquina')
    store.addFlowEdge(FLOW, 'inicio', 'hay-recambio')
    store.addFlowEdge(FLOW, 'hay-recambio', 'reparar-la-maquina', 'sí')
    store.addFlowEdge(FLOW, 'reparar-la-maquina', 'entregar-la-maquina')
    store.addFlowEdge(FLOW, 'entregar-la-maquina', 'fin')
    store.addFlowEdge(FLOW, 'hay-recambio', 'pedir-el-recambio', 'no')
    store.addFlowEdge(FLOW, 'pedir-el-recambio', 'hay-recambio')
    store.removeFlowEdge(FLOW, 'inicio', 'fin')
  })

  it('la tarjeta hereda el sitio y nadie más se mueve', () => {
    const fixture = mount()
    const bloque = (id: string): string => {
      const el = fixture.nativeElement.querySelector(`[data-testid="${id}"]`) as HTMLElement | null
      return el ? `${el.style.left},${el.style.top}` : 'sin bloque'
    }
    const antes = { tarjeta: bloque('flow-card-reparar-la-maquina'), otra: bloque('flow-card-pedir-el-recambio') }

    testId(fixture, 'flow-step-remove-reparar-la-maquina')?.click()
    fixture.detectChanges()

    expect(bloque('flow-card-entregar-la-maquina')).toBe(antes.tarjeta)
    expect(bloque('flow-card-pedir-el-recambio')).toBe(antes.otra)
  })
})

// Medido en el navegador (tools/smoke-flows y una captura del rombo de aguas): la CAJA del
// texto está bien —72px dentro de un rombo de 128—, lo que se salía era el GLIFO de una
// palabra que no puede partir, «PLAZO_AVISO_PRORROGA», pintándose fuera de su caja. Se
// arregla dejándola partir; el recorte a cuatro líneas evita que el bloque crezca a lo alto
// más de lo que el rombo aguanta, y el título conserva el texto entero.
describe('FlowViewComponent — el texto del rombo no se sale', () => {
  let store: DesignStore

  beforeEach(() => {
    TestBed.configureTestingModule({})
    store = TestBed.inject(DesignStore)
    TestBed.inject(ActiveViewService).selectFlow(FLOW)
    store.addFlow(FLOW)
  })

  it('parte las palabras que no caben y recorta lo que sobra, sin perder el texto', () => {
    const condicion = '¿Caduca dentro del PLAZO_AVISO_PRORROGA (30 días)?'
    store.addFlowNode(FLOW, 'decision', condicion)

    const fixture = mount()
    const texto = testId(fixture, 'flow-node-text-caduca-dentro-del-plazo-aviso-prorroga-30-dias')

    expect(texto?.className).toContain('break-words')
    expect(texto?.className).toContain('line-clamp-4')
    expect(texto?.getAttribute('title')).toBe(condicion)
  })

  it('el rombo sigue midiendo lo mismo: el texto no cambia la geometría', () => {
    store.addFlowNode(FLOW, 'decision', '¿Lleva tasas?')
    store.addFlowNode(FLOW, 'decision', '¿Caduca dentro del PLAZO_AVISO_PRORROGA (30 días)?')

    const fixture = mount()
    const corto = testId(fixture, 'flow-node-lleva-tasas')
    const largo = testId(fixture, 'flow-node-caduca-dentro-del-plazo-aviso-prorroga-30-dias')

    expect(largo?.style.width).toBe(corto?.style.width)
  })
})

// Todo texto que se recorta en el lienzo se puede leer entero acercando el cursor: era así
// en el rombo y no en los pasos, que es donde viven los textos largos de verdad («Se envía a
// Operaciones el enlace aceptar/denegar la prórroga (subestado Enviada_Operaciones)»).
describe('FlowViewComponent — lo recortado se lee entero con el cursor', () => {
  let store: DesignStore

  const LARGO = 'Se envía a Operaciones el enlace aceptar/denegar la prórroga (subestado Enviada_Operaciones)'

  beforeEach(() => {
    TestBed.configureTestingModule({})
    store = TestBed.inject(DesignStore)
    TestBed.inject(ActiveViewService).selectFlow(FLOW)
    store.addFlow(FLOW)
  })

  it('el disparador y el fin llevan su texto en el título', () => {
    const fixture = mount()

    expect(testId(fixture, 'flow-node-text-inicio')?.getAttribute('title')).toBe('Inicio')
    expect(testId(fixture, 'flow-node-text-fin')?.getAttribute('title')).toBe('Fin')
  })

  it('la fila de una tarjeta de acciones lleva su texto en el título', () => {
    store.addFlowNode(FLOW, 'step', LARGO)

    const fixture = mount()
    const fila = testId(
      fixture,
      'flow-step-text-se-envia-a-operaciones-el-enlace-aceptar-denegar-la-prorroga-subestado-enviada-operaciones'
    )

    expect(fila?.getAttribute('title')).toBe(LARGO)
  })

  it('la entidad de una fila también se lee entera', () => {
    store.addFlowNode(FLOW, 'step', 'Se registra la muestra')
    store.updateFlowNode(FLOW, 'se-registra-la-muestra', { entity: 'muestra' })

    const fixture = mount()
    const entidad = testId(fixture, 'flow-step-entity-se-registra-la-muestra')

    expect(entidad?.getAttribute('title')).toBe('muestra')
  })
})

describe('FlowViewComponent — la rama «no» se dibuja a rayas', () => {
  let store: DesignStore

  beforeEach(() => {
    TestBed.configureTestingModule({})
    store = TestBed.inject(DesignStore)
    TestBed.inject(ActiveViewService).selectFlow(FLOW)

    store.addFlow(FLOW)
    store.addFlowNode(FLOW, 'decision', 'stock < 10')
    store.addFlowNode(FLOW, 'step', 'Marcar la fila')
    store.addFlowNode(FLOW, 'step', 'Quitar el aviso')
    store.addFlowEdge(FLOW, 'inicio', 'stock-10')
    store.addFlowEdge(FLOW, 'stock-10', 'marcar-la-fila', 'sí')
    store.addFlowEdge(FLOW, 'marcar-la-fila', 'fin')
    store.addFlowEdge(FLOW, 'stock-10', 'quitar-el-aviso', 'no')
    store.addFlowEdge(FLOW, 'quitar-el-aviso', 'fin')
    store.removeFlowEdge(FLOW, 'inicio', 'fin')
  })

  /** El trazo visible de la flecha: el primero es la zona de clic transparente. */
  function visibleStroke(fixture: ReturnType<typeof mount>, edge: string): SVGPathElement {
    const grupo = testId(fixture, `flow-edge-${edge}`)
    const trazo = grupo?.querySelectorAll('path')[1]
    if (!trazo) throw new Error(`no se encontró el trazo de la flecha ${edge}`)
    return trazo as unknown as SVGPathElement
  }

  it('la salida «no» de la decisión va con línea discontinua y punta apagada', () => {
    const fixture = mount()
    const trazo = visibleStroke(fixture, 'stock-10-quitar-el-aviso')

    expect(trazo.getAttribute('stroke-dasharray')).toBe('5 4')
    expect(trazo.getAttribute('marker-end')).toBe('url(#flow-arrow-alt)')
  })

  it('la salida «sí» sigue siendo el trazo continuo de siempre', () => {
    const fixture = mount()
    const trazo = visibleStroke(fixture, 'stock-10-marcar-la-fila')

    expect(trazo.getAttribute('stroke-dasharray')).toBeNull()
    expect(trazo.getAttribute('marker-end')).toBe('url(#flow-arrow)')
  })

  // La segunda causa de «no veo la raya»: cuando hay ida y VUELTA entre dos bloques
  // (la «no» va a desviación y desviación vuelve a la condición), las dos flechas
  // calcaban el mismo trazado y la continua tapaba a la de rayas. Arqueadas, cada una
  // pasa por su lado y las dos se leen.
  it('la ida y la vuelta entre dos bloques no se pintan una encima de la otra', () => {
    store.addFlowEdge(FLOW, 'quitar-el-aviso', 'stock-10')

    const fixture = mount()
    const media = (edge: string) => {
      const [, y1, , cy1, , cy2, , y2] =
        visibleStroke(fixture, edge).getAttribute('d')?.match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? []
      return (y1 + 3 * cy1 + 3 * cy2 + y2) / 8
    }

    expect(media('stock-10-quitar-el-aviso')).not.toBe(media('quitar-el-aviso-stock-10'))
  })

  // Lo que motivó el arreglo: al encuadrar un flujo grande el zoom cae (38% en el de
  // aguas) y un patrón fijo de 5/4 se escala con el lienzo hasta leerse como línea
  // continua. El patrón compensa el zoom para medir SIEMPRE lo mismo en pantalla.
  it('alejar el zoom no borra las rayas: el patrón compensa la escala', () => {
    TestBed.inject(CanvasViewportService).zoomBy('flows', 0.5, { x: 0, y: 0 })

    const fixture = mount()
    const trazo = visibleStroke(fixture, 'stock-10-quitar-el-aviso')

    expect(trazo.getAttribute('stroke-dasharray')).toBe('10 8')
  })
})

/**
 * Spec 44 (fleco): el paso convergido enseña su verbo EN el diagrama. La diferencia
 * ahora tiene consecuencias reales — cuerpo real + endpoint frente a hueco @ai — y no
 * debe esconderse en el panel.
 */
describe('FlowViewComponent — el chip del verbo (spec 44)', () => {
  let store: DesignStore

  beforeEach(() => {
    TestBed.configureTestingModule({})
    store = TestBed.inject(DesignStore)
    TestBed.inject(ActiveViewService).selectFlow('Alta')
    store.addResource('Solicitud')
    store.updateField('solicitud', 0, { type: 'enum' })
    store.promoteState('solicitud', 'nombre')
    store.addTransition('solicitud', 'pendiente', 'en_curso')
    store.addFlow('Alta')
    store.insertFlowStep('Alta', 'inicio', 'fin', 'Se tramita')
  })

  const stepId = () => store.flows()[0].nodes.find(n => n.kind === 'step')!.id

  it('el paso con transición lleva el chip del verbo junto a su entidad', () => {
    store.updateFlowNode('Alta', stepId(), { entity: 'solicitud', transition: 'a-en-curso' })

    const fixture = mount()
    const chip = testId(fixture, `flow-step-transition-${stepId()}`)

    expect(chip).not.toBeNull()
    expect(chip?.textContent).toContain('a-en-curso')
  })

  it('sin transición no hay chip: el paso es un hueco que rellena el puente', () => {
    store.updateFlowNode('Alta', stepId(), { entity: 'solicitud' })

    const fixture = mount()

    expect(testId(fixture, `flow-step-transition-${stepId()}`)).toBeNull()
    expect(testId(fixture, `flow-step-entity-${stepId()}`)).not.toBeNull()
  })
})

/**
 * Un bloque nuevo de la paleta tiene que aparecer DONDE EL OJO MIRA. El layout manda
 * los nodos sueltos a la capa de los huérfanos (tras la capa más profunda), que con
 * un flujo de varias capas queda fuera del viewport: «pulso Condición y no pasa nada».
 */
describe('FlowViewComponent — el bloque nuevo aterriza a la vista', () => {
  let store: DesignStore

  beforeEach(() => {
    TestBed.configureTestingModule({})
    store = TestBed.inject(DesignStore)
    TestBed.inject(ActiveViewService).selectFlow(FLOW)

    store.addFlow(FLOW)
    store.addFlowNode(FLOW, 'decision', 'stock < 10')
    store.addFlowEdge(FLOW, 'inicio', 'stock-10')
    store.addFlowEdge(FLOW, 'stock-10', 'fin', 'sí')
    store.removeFlowEdge(FLOW, 'inicio', 'fin')
  })

  it('una condición suelta se pinta centrada en la cámara, no tras la última capa', () => {
    const fixture = mount()

    store.addFlowNode(FLOW, 'decision', '¿campo = valor?')
    fixture.detectChanges()

    const rombo = testId(fixture, 'flow-node-campo-valor')
    expect(rombo).not.toBeNull()
    // jsdom no mide el lienzo: manda el tamaño nominal de respaldo del componente
    const size = flowNodeSize('decision')
    const esperado = flowLoosePosition(INITIAL_VIEWPORT, FLOW_CANVAS_FALLBACK, [], size)
    expect(rombo?.style.left).toBe(`${esperado.x}px`)
    expect(rombo?.style.top).toBe(`${esperado.y}px`)
  })

  it('dos bloques seguidos no se pisan: el segundo cae un carril más abajo', () => {
    const fixture = mount()

    store.addFlowNode(FLOW, 'step', 'Paso nuevo')
    fixture.detectChanges()
    store.addFlowNode(FLOW, 'step', 'Otro paso')
    fixture.detectChanges()

    const primero = testId(fixture, 'flow-card-paso-nuevo') ?? testId(fixture, 'flow-node-paso-nuevo')
    const segundo = testId(fixture, 'flow-card-otro-paso') ?? testId(fixture, 'flow-node-otro-paso')
    expect(primero).not.toBeNull()
    expect(segundo).not.toBeNull()
    expect(segundo?.style.top).not.toBe(primero?.style.top)
    expect(primero?.style.left).toBe(segundo?.style.left)
  })
})

/**
 * ENCADENAR CONDICIONES: meter un rombo en medio de un tramo es el gesto natural de
 * «y si además…». Antes exigía cirugía (borrar la rama, enlazar dos veces); ahora la
 * arista seleccionada ofrece «+ paso» y «+ condición».
 */
describe('FlowViewComponent — insertar en un tramo', () => {
  let store: DesignStore

  beforeEach(() => {
    TestBed.configureTestingModule({})
    store = TestBed.inject(DesignStore)
    TestBed.inject(ActiveViewService).selectFlow('Pedido')
    store.addFlow('Pedido')
  })

  function clickEdge(fixture: ReturnType<typeof mount>, edge: string): void {
    const grupo = testId(fixture, `flow-edge-${edge}`)
    if (!grupo) throw new Error(`no existe la arista ${edge}`)
    grupo.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    fixture.detectChanges()
  }

  it('«+ condición» parte el tramo por un rombo y el camino original sale por su «sí»', () => {
    const fixture = mount()

    clickEdge(fixture, 'inicio-fin')
    const boton = testId(fixture, 'flow-insert-decision')
    expect(boton).not.toBeNull()
    boton?.click()
    fixture.detectChanges()

    const flow = store.flows()[0]
    const rombo = flow.nodes.find(n => n.kind === 'decision')
    expect(rombo).toBeDefined()
    expect(flow.edges).toContainEqual({ from: 'inicio', to: rombo?.id })
    expect(flow.edges).toContainEqual({ from: rombo?.id, to: 'fin', label: 'sí' })
    // y el rombo queda dibujado y en edición, listo para escribir la pregunta
    expect(testId(fixture, `flow-node-${rombo?.id}`)).not.toBeNull()
    expect(testId(fixture, 'flow-node-text-input')).not.toBeNull()
  })

  it('«+ paso» hace lo mismo con un paso, sin etiquetar su salida', () => {
    const fixture = mount()

    clickEdge(fixture, 'inicio-fin')
    testId(fixture, 'flow-insert-step')?.click()
    fixture.detectChanges()

    const flow = store.flows()[0]
    const paso = flow.nodes.find(n => n.kind === 'step')
    expect(paso).toBeDefined()
    expect(flow.edges).toContainEqual({ from: 'inicio', to: paso?.id })
    expect(flow.edges).toContainEqual({ from: paso?.id, to: 'fin' })
  })

  it('con un nodo seleccionado no se ofrecen los botones de insertar', () => {
    const fixture = mount()

    const inicio = testId(fixture, 'flow-card-inicio') ?? testId(fixture, 'flow-node-inicio')
    inicio?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    fixture.detectChanges()

    expect(testId(fixture, 'flow-insert-decision')).toBeNull()
    expect(testId(fixture, 'flow-insert-step')).toBeNull()
  })
})
