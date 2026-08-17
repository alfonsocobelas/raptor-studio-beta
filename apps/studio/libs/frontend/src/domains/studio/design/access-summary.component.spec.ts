import { beforeEach, describe, expect, it } from 'vitest'
import { TestBed } from '@angular/core/testing'
import { AccessSummaryComponent } from './access-summary.component'
import { AccessUiService } from './access-ui.service'
import { DesignStore } from './design-store'

function mount() {
  const fixture = TestBed.createComponent(AccessSummaryComponent)
  fixture.detectChanges()
  return fixture
}

function testId(fixture: ReturnType<typeof mount>, id: string): HTMLButtonElement | null {
  return fixture.nativeElement.querySelector(`[data-testid="${id}"]`)
}

/**
 * Spec 49: el panel derecho del pivote Rol — resumen DERIVADO del diseño (entidades
 * visibles, puede crear/editar/borrar) y las acciones de columna que mutan la matriz
 * de todas las entidades de golpe. Con admin solo informa: no hay nada que repartir.
 */
describe('AccessSummaryComponent', () => {
  let store: DesignStore
  let ui: AccessUiService

  beforeEach(() => {
    TestBed.configureTestingModule({})
    store = TestBed.inject(DesignStore)
    ui = TestBed.inject(AccessUiService)
    ui.role.set('user')
  })

  it('resume las cuatro capacidades del rol activo, «Puede ver» incluida', () => {
    store.addResource('Cliente')
    store.addResource('Factura')
    store.setResourceAccess('factura', { view: ['user'], create: ['user'], edit: ['user'], delete: [] })

    const fixture = mount()
    const texto = fixture.nativeElement.textContent

    expect(texto).toContain('Puede ver')
    // cada capacidad dice cuántas entidades del total: se lee sin comparar de cabeza
    expect(testId(fixture, 'access-summary-view')?.textContent).toContain('2/2')
    expect(testId(fixture, 'access-summary-create')?.textContent).toContain('2/2')
    expect(testId(fixture, 'access-summary-edit')?.textContent).toContain('2/2')
    expect(testId(fixture, 'access-summary-delete')?.textContent).toContain('1/2')
    expect(texto).toContain('Usuario')
  })

  it('«Todo ver» concede Ver en todas las entidades al rol activo', () => {
    store.addResource('Cliente')
    store.addResource('Factura')
    store.setResourceAccess('factura', { view: [], create: [], edit: [], delete: [] })
    ui.role.set('viewer')

    const fixture = mount()
    testId(fixture, 'access-grant-view')?.click()

    expect(store.resources()[1].access?.view).toContain('viewer')
    expect(store.resources()[0].access?.view).toEqual(['user', 'viewer'])
  })

  it('«Nada editar» retira toda la escritura del rol activo sin tocar Ver ni al otro rol', () => {
    store.addResource('Cliente')

    const fixture = mount()
    testId(fixture, 'access-revoke-writes')?.click()

    expect(store.resources()[0].access).toEqual({
      view: ['user', 'viewer'],
      create: [],
      edit: [],
      delete: []
    })
  })

  it('«Copiar de Consulta» deja al rol activo con lo que tiene Consulta', () => {
    store.addResource('Cliente')

    const fixture = mount()
    expect(testId(fixture, 'access-copy-from')?.textContent).toContain('Consulta')

    testId(fixture, 'access-copy-from')?.click()

    // consulta solo Ver: usuario queda igual que ella
    expect(store.resources()[0].access).toEqual({
      view: ['user', 'viewer'],
      create: [],
      edit: [],
      delete: []
    })
  })

  it('con admin activo informa pero no ofrece acciones', () => {
    store.addResource('Cliente')
    ui.role.set('admin')

    const fixture = mount()

    expect(testId(fixture, 'access-summary-view')?.textContent).toContain('1/1')
    expect(testId(fixture, 'access-grant-view')).toBeNull()
    expect(testId(fixture, 'access-revoke-writes')).toBeNull()
    expect(testId(fixture, 'access-copy-from')).toBeNull()
  })

  it('sin entidades no pinta nada', () => {
    const fixture = mount()

    expect(fixture.nativeElement.textContent?.trim()).toBe('')
  })
})
