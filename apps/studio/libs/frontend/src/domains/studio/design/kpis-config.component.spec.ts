import { beforeEach, describe, expect, it } from 'vitest'
import { TestBed } from '@angular/core/testing'
import { ActiveViewService } from './active-view.service'
import { DesignStore } from './design-store'
import { KpisConfigComponent } from './kpis-config.component'

/** Spec 70 (seguimiento): la fila de KPIs es un bloque con N tarjetas, y cada una se quita sola. */
describe('KpisConfigComponent', () => {
  let store: DesignStore

  const mount = () => {
    const fixture = TestBed.createComponent(KpisConfigComponent)
    fixture.detectChanges()
    return fixture
  }

  const testId = (fixture: ReturnType<typeof mount>, id: string): HTMLElement | null =>
    fixture.nativeElement.querySelector(`[data-testid="${id}"]`)

  beforeEach(() => {
    TestBed.configureTestingModule({})
    store = TestBed.inject(DesignStore)
    TestBed.inject(ActiveViewService)
    store.addPage('blank', 'Panel')
    store.addResource('Pedido')
    store.addResource('Cliente')
    store.addBlock(0, { kind: 'kpis', resources: ['pedido', 'cliente'] })
  })

  it('lista una tarjeta por entidad medida, con el plural de la entidad', () => {
    const fixture = mount()

    expect(fixture.nativeElement.textContent).toContain('Pedidos')
    expect(fixture.nativeElement.textContent).toContain('Clientes')
  })

  it('quita UNA tarjeta sin llevarse la fila', () => {
    const fixture = mount()

    ;(testId(fixture, 'kpis-remove-pedido') as HTMLButtonElement).click()

    expect(store.pages()[0].blocks[0].resources).toEqual(['cliente'])
    expect(store.pages()[0].blocks[0].kind).toBe('kpis')
  })

  it('con una sola tarjeta el borrado está deshabilitado: la fila no puede quedar sin medir nada', () => {
    store.setKpiResources(0, 0, ['pedido'])
    const fixture = mount()

    expect((testId(fixture, 'kpis-remove-pedido') as HTMLButtonElement).disabled).toBe(true)
  })

  it('reordena las tarjetas', () => {
    const fixture = mount()

    ;(testId(fixture, 'kpis-down-pedido') as HTMLButtonElement).click()

    expect(store.pages()[0].blocks[0].resources).toEqual(['cliente', 'pedido'])
  })

  it('cuando ya mide todo el modelo, lo dice en vez de ofrecer un select vacío', () => {
    const fixture = mount()

    expect(testId(fixture, 'kpis-add')).toBeNull()
    expect(fixture.nativeElement.textContent).toContain('ya mide todas las entidades')
  })
})
