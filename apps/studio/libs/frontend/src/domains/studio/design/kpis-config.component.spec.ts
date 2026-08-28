import { beforeEach, describe, expect, it } from 'vitest'
import { TestBed } from '@angular/core/testing'
import { ActiveViewService } from './active-view.service'
import { DesignStore } from './design-store'
import { KpisConfigComponent } from './kpis-config.component'

/** Spec 73: la fila de KPIs es un bloque con N celdas; el panel las lista, reordena y quita. */
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
    store.addBlock(0, { kind: 'kpis', items: [] })
    store.addCell(0, 0, 'counter', 'pedido')
    store.addCell(0, 0, 'top-n', 'cliente')
  })

  it('lista cada celda con su tipo y el plural de su entidad', () => {
    const fixture = mount()

    expect(fixture.nativeElement.textContent).toContain('Contador')
    expect(fixture.nativeElement.textContent).toContain('Pedidos')
    expect(fixture.nativeElement.textContent).toContain('Top N')
    expect(fixture.nativeElement.textContent).toContain('Clientes')
  })

  it('quita UNA celda sin llevarse la fila', () => {
    const fixture = mount()

    ;(testId(fixture, 'kpis-remove-0') as HTMLButtonElement).click()

    expect(store.pages()[0].blocks[0].items).toMatchObject([{ kind: 'top-n', resource: 'cliente' }])
    expect(store.pages()[0].blocks[0].kind).toBe('kpis')
  })

  it('la fila puede quedarse vacía: vuelve a ser el cuadrado con el «+»', () => {
    const fixture = mount()

    ;(testId(fixture, 'kpis-remove-0') as HTMLButtonElement).click()
    fixture.detectChanges()
    ;(testId(fixture, 'kpis-remove-0') as HTMLButtonElement).click()

    expect(store.pages()[0].blocks[0].items).toEqual([])
  })

  it('reordena las celdas', () => {
    const fixture = mount()

    ;(testId(fixture, 'kpis-down-0') as HTMLButtonElement).click()

    expect(store.pages()[0].blocks[0].items?.map(cell => cell.kind)).toEqual(['top-n', 'counter'])
  })

  it('añadir vive en el «+» del lienzo: aquí solo se explica', () => {
    const fixture = mount()

    expect(testId(fixture, 'kpis-add')).toBeNull()
    expect(fixture.nativeElement.textContent).toContain('«+»')
  })
})
