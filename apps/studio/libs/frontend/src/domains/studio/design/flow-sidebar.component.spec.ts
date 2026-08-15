import { beforeEach, describe, expect, it } from 'vitest'
import { TestBed } from '@angular/core/testing'
import { ActiveViewService } from './active-view.service'
import { DesignStore } from './design-store'
import { FlowSidebarComponent } from './flow-sidebar.component'

function mount() {
  const fixture = TestBed.createComponent(FlowSidebarComponent)
  fixture.detectChanges()
  return fixture
}

function testId(fixture: ReturnType<typeof mount>, id: string): HTMLElement | null {
  return fixture.nativeElement.querySelector(`[data-testid="${id}"]`)
}

describe('FlowSidebarComponent', () => {
  let store: DesignStore
  let active: ActiveViewService

  beforeEach(() => {
    TestBed.configureTestingModule({})
    store = TestBed.inject(DesignStore)
    active = TestBed.inject(ActiveViewService)
  })

  it('ofrece los bloques que el contrato conoce, y ninguno inventado', () => {
    const fixture = mount()
    const bloques = fixture.nativeElement.querySelectorAll('[data-testid^="flow-block-"]')

    expect([...bloques].map((b: Element) => b.getAttribute('data-testid'))).toEqual([
      'flow-block-start',
      'flow-block-step',
      'flow-block-decision',
      'flow-block-end'
    ])
  })

  // El disparador está en el raíl para poder recuperarlo si se borra, pero la frontera
  // exige exactamente uno por flujo: con uno puesto, el botón se apaga.
  it('el disparador se apaga cuando el flujo ya tiene el suyo', () => {
    store.addFlow('Aviso de stock bajo')
    active.selectFlow('Aviso de stock bajo')

    const fixture = mount()
    const disparador = () => fixture.nativeElement.querySelector('[data-testid="flow-block-start"]')
    expect(disparador().disabled).toBe(true)
    expect(disparador().getAttribute('title')).toContain('único disparador')

    store.removeFlowNode('Aviso de stock bajo', 'inicio')
    fixture.detectChanges()

    expect(disparador().disabled).toBe(false)
  })

  it('lista los flujos del diseño y marca el que se está dibujando', () => {
    store.addFlow('Aviso de stock bajo')
    store.addFlow('Resumen semanal')
    active.selectFlow('Resumen semanal')

    const fixture = mount()

    expect(testId(fixture, 'flow-item-Resumen semanal')?.getAttribute('aria-current')).toBe('true')
    expect(testId(fixture, 'flow-item-Aviso de stock bajo')?.getAttribute('aria-current')).toBeNull()
  })

  it('pulsar un flujo lo pone al mando del lienzo', () => {
    store.addFlow('Aviso de stock bajo')
    store.addFlow('Resumen semanal')

    const fixture = mount()
    testId(fixture, 'flow-item-Resumen semanal')?.click()

    expect(active.flow()).toBe('Resumen semanal')
  })

  it('sin flujos todavía, lo dice en vez de dejar el hueco', () => {
    const fixture = mount()

    expect(testId(fixture, 'flow-empty')).not.toBeNull()
  })

  it('crear un flujo lo añade y lo deja elegido', async () => {
    const fixture = mount()
    testId(fixture, 'flow-new')?.click()
    fixture.detectChanges()
    const input = testId(fixture, 'flow-new-name') as HTMLInputElement
    input.value = 'Alta de proveedor'
    input.dispatchEvent(new Event('input'))
    await Promise.resolve()
    fixture.detectChanges()
    testId(fixture, 'flow-new-ok')?.click()

    expect(store.flows().map(f => f.name)).toEqual(['Alta de proveedor'])
    expect(active.flow()).toBe('Alta de proveedor')
  })

  it('la cruz de cada flujo lo saca del diseño', () => {
    store.addFlow('Aviso de stock bajo')
    store.addFlow('Resumen semanal')

    const fixture = mount()
    testId(fixture, 'flow-remove-Aviso de stock bajo')?.click()

    expect(store.flows().map(f => f.name)).toEqual(['Resumen semanal'])
  })

  // El flujo borrado era el que se estaba dibujando: el lienzo no puede quedar
  // apuntando a un nombre fantasma, cae al que sobrevive.
  it('borrar el flujo al mando pasa el mando al que queda', () => {
    store.addFlow('Aviso de stock bajo')
    store.addFlow('Resumen semanal')
    active.selectFlow('Resumen semanal')

    const fixture = mount()
    testId(fixture, 'flow-remove-Resumen semanal')?.click()

    expect(active.flow()).toBe('Aviso de stock bajo')
  })

  it('borrar el último flujo deja el raíl vacío, no un hueco', () => {
    store.addFlow('Aviso de stock bajo')

    const fixture = mount()
    testId(fixture, 'flow-remove-Aviso de stock bajo')?.click()
    fixture.detectChanges()

    expect(active.flow()).toBeNull()
    expect(testId(fixture, 'flow-empty')).not.toBeNull()
  })

  // La cruz solo asoma al pasar por la fila, y en gris hasta que se apunta: un raíl con
  // una alarma encendida por flujo deja de avisar de nada. Se esconde con opacidad para
  // que el hueco siga reservado, y el teclado la recupera al enfocarla.
  it('la cruz asoma al hover, en gris, sin mover la fila', () => {
    store.addFlow('Aviso de stock bajo')

    const fixture = mount()
    const cruz = testId(fixture, 'flow-remove-Aviso de stock bajo') as HTMLElement

    expect(cruz.className).toContain('opacity-0')
    expect(cruz.className).toContain('group-hover:opacity-100')
    expect(cruz.className).toContain('focus-visible:opacity-100')
    expect(cruz.className).toContain('text-muted-foreground')
    expect(cruz.className).toContain('hover:text-destructive')
    expect(cruz.className).not.toContain('hidden')
  })

  it('sin flujo elegido no se pueden añadir bloques: no hay dónde ponerlos', () => {
    const fixture = mount()

    expect((testId(fixture, 'flow-block-step') as HTMLButtonElement).disabled).toBe(true)
  })

  it('añadir un paso lo pone en el flujo elegido', () => {
    store.addFlow('Aviso de stock bajo')

    const fixture = mount()
    testId(fixture, 'flow-block-step')?.click()

    const flow = store.flows()[0]
    expect(flow.nodes.filter(n => n.kind === 'step')).toHaveLength(1)
  })
})
