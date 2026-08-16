import { beforeEach, describe, expect, it } from 'vitest'
import { TestBed } from '@angular/core/testing'
import { AccessUiService } from './access-ui.service'
import { AccessViewComponent } from './access-view.component'
import { DesignStore } from './design-store'

function mount() {
  const fixture = TestBed.createComponent(AccessViewComponent)
  fixture.detectChanges()
  return fixture
}

function testId(fixture: ReturnType<typeof mount>, id: string): HTMLElement | null {
  return fixture.nativeElement.querySelector(`[data-testid="${id}"]`)
}

/** Spec 49: el centro de Accesos conmuta entre tabla por Rol (+resumen), por Entidad y Diagrama. */
describe('AccessViewComponent', () => {
  let store: DesignStore
  let ui: AccessUiService

  beforeEach(() => {
    TestBed.configureTestingModule({})
    store = TestBed.inject(DesignStore)
    ui = TestBed.inject(AccessUiService)
    ui.role.set('user')
    ui.pivot.set('role')
    ui.search.set('')
    ui.onlyWithAccess.set(false)
  })

  it('con el pivote Rol pinta la tabla y el resumen', () => {
    store.addResource('Cliente')

    const fixture = mount()

    expect(testId(fixture, 'access-cell-cliente-view')).not.toBeNull()
    expect(testId(fixture, 'access-summary-view')).not.toBeNull()
  })

  it('con el pivote Entidad pinta las filas de rol sin resumen', () => {
    store.addResource('Cliente')
    ui.pivot.set('entity')

    const fixture = mount()

    expect(testId(fixture, 'access-entity-select')).not.toBeNull()
    expect(testId(fixture, 'access-ecell-user-view')).not.toBeNull()
    expect(testId(fixture, 'access-summary-view')).toBeNull()
  })

  it('con el pivote Diagrama pinta el lienzo de casos de uso', () => {
    store.addResource('Cliente')
    ui.pivot.set('diagram')

    const fixture = mount()

    expect(testId(fixture, 'access-viewport')).not.toBeNull()
    expect(testId(fixture, 'access-cell-cliente-view')).toBeNull()
  })
})
