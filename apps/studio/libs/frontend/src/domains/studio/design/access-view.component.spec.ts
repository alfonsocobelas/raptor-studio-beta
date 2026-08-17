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

/** Spec 49: el centro de Accesos es la tabla del pivote elegido; el resumen es el panel derecho. */
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

  it('con el pivote Rol pinta la tabla del rol activo', () => {
    store.addResource('Cliente')

    const fixture = mount()

    expect(testId(fixture, 'access-cell-cliente-view')).not.toBeNull()
  })

  it('el resumen NO vive en el centro: es el panel derecho del estudio', () => {
    store.addResource('Cliente')

    const fixture = mount()

    expect(testId(fixture, 'access-summary-view')).toBeNull()
  })

  it('con el pivote Entidad pinta las filas de rol', () => {
    store.addResource('Cliente')
    ui.pivot.set('entity')

    const fixture = mount()

    expect(testId(fixture, 'access-entity-select')).not.toBeNull()
    expect(testId(fixture, 'access-ecell-user-view')).not.toBeNull()
  })
})
