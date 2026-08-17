import { beforeEach, describe, expect, it } from 'vitest'
import { TestBed } from '@angular/core/testing'
import { chooseInSelect, openSelect, selectValueLabel } from '../../../shared/components/ui/select.harness'
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
    // la gramática de la prosa la fija flow-prose.spec; aquí basta con que el panel la pinte
    expect(testId(fixture, 'flow-prose')?.textContent).toContain('Inicio')
  })

  it('con un nodo elegido enseña su texto y su tipo', () => {
    active.selectFlowNode('inicio')

    const fixture = mount()

    expect((testId(fixture, 'flow-node-text') as HTMLInputElement).value).toBe('Inicio')
    expect(testId(fixture, 'flow-node-kind')?.textContent).toContain('disparador')
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

  it('apuntar el nodo a una entidad lo guarda', async () => {
    store.addResource('Producto')
    store.addFlowNode('Aviso de stock bajo', 'step', 'Revisar')
    active.selectFlowNode('revisar')

    const fixture = mount()
    await chooseInSelect(fixture, 'flow-node-entity', 'Producto')

    expect(store.flows()[0].nodes.find(n => n.id === 'revisar')?.entity).toBe('producto')
  })

  // El desplegable nativo lo pinta el sistema operativo, no el CSS del estudio (ADR-003).
  it('la entidad se elige con el desplegable del estudio, no con el del navegador', async () => {
    store.addResource('Producto')
    store.addFlowNode('Aviso de stock bajo', 'step', 'Revisar')
    active.selectFlowNode('revisar')

    const fixture = mount()
    await fixture.whenStable()
    fixture.detectChanges()

    expect(fixture.nativeElement.querySelector('select')).toBeNull()
    // «sin entidad» se lee como tal en el disparador: un hueco en blanco no dice nada
    expect(selectValueLabel(fixture, 'flow-node-entity')).toBe('— ninguna —')
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

/**
 * Spec 44: la transición del paso se declara en el panel. Solo se ofrece cuando el paso
 * alude a una entidad CON máquina; cambiar de entidad la tira (la frontera la validaría
 * contra otra máquina). El canvas la cuenta vía la prosa (flow-view lleva WIP ajeno).
 */
describe('FlowPanelComponent — la transición del paso (spec 44)', () => {
  let store: DesignStore
  let active: ActiveViewService

  beforeEach(() => {
    TestBed.configureTestingModule({})
    store = TestBed.inject(DesignStore)
    active = TestBed.inject(ActiveViewService)
    store.addResource('Solicitud')
    store.updateField('solicitud', 0, { type: 'enum' })
    store.promoteState('solicitud', 'nombre')
    store.addTransition('solicitud', 'pendiente', 'en_curso')
    store.addFlow('Tramitación')
    store.insertFlowStep('Tramitación', 'inicio', 'fin', 'Se tramita')
    active.selectFlow('Tramitación')
  })

  const stepId = () => store.flows()[0].nodes.find(n => n.kind === 'step')!.id

  it('un paso sobre una entidad con máquina ofrece sus verbos', async () => {
    store.updateFlowNode('Tramitación', stepId(), { entity: 'solicitud' })
    active.selectFlowNode(stepId())

    const fixture = mount()

    expect(testId(fixture, 'flow-node-transition')).not.toBeNull()
    expect(await openSelect(fixture, 'flow-node-transition')).toContain('A en curso')
  })

  it('elegir el verbo lo escribe en el nodo; «— ninguna —» lo quita', async () => {
    store.updateFlowNode('Tramitación', stepId(), { entity: 'solicitud' })
    active.selectFlowNode(stepId())
    const fixture = mount()

    await chooseInSelect(fixture, 'flow-node-transition', 'A en curso')
    expect(store.flows()[0].nodes.find(n => n.id === stepId())?.transition).toBe('a-en-curso')

    await chooseInSelect(fixture, 'flow-node-transition', '— ninguna —')
    expect(store.flows()[0].nodes.find(n => n.id === stepId())?.transition).toBeUndefined()
  })

  it('sin máquina en la entidad (o sin entidad) no se ofrece', () => {
    store.addResource('Nota')
    store.updateFlowNode('Tramitación', stepId(), { entity: 'nota' })
    active.selectFlowNode(stepId())

    const fixture = mount()

    expect(testId(fixture, 'flow-node-transition')).toBeNull()
  })

  it('cambiar la entidad del paso tira la transición declarada', async () => {
    store.updateFlowNode('Tramitación', stepId(), { entity: 'solicitud', transition: 'a-en-curso' })
    active.selectFlowNode(stepId())
    const fixture = mount()

    await chooseInSelect(fixture, 'flow-node-entity', '— ninguna —')

    expect(store.flows()[0].nodes.find(n => n.id === stepId())?.transition).toBeUndefined()
  })
})
