import { beforeEach, describe, expect, it } from 'vitest'
import { TestBed } from '@angular/core/testing'
import { AccessSidebarComponent } from './access-sidebar.component'
import { DesignStore } from './design-store'

function mount() {
  const fixture = TestBed.createComponent(AccessSidebarComponent)
  fixture.detectChanges()
  return fixture
}

function testId(fixture: ReturnType<typeof mount>, id: string): HTMLInputElement | null {
  return fixture.nativeElement.querySelector(`[data-testid="${id}"]`)
}

/**
 * Spec 46 TASK-07: el raíl de Accesos edita la matriz por entidad — filas Ver/Gestionar y
 * una por transición de su máquina; columnas Usuario y Consulta, Admin fija y atenuada.
 * Sin entidades, el estado vacío manda al Modelo.
 */
describe('AccessSidebarComponent', () => {
  let store: DesignStore

  beforeEach(() => {
    TestBed.configureTestingModule({})
    store = TestBed.inject(DesignStore)
  })

  it('sin entidades muestra el estado vacío que manda al Modelo', () => {
    const fixture = mount()

    const empty = testId(fixture, 'access-empty')
    expect(empty).not.toBeNull()
    expect(empty?.textContent).toContain('Modelo')
  })

  it('una entidad sin máquina ofrece solo Ver y Gestionar', () => {
    store.addResource('Cliente')

    const fixture = mount()

    expect(testId(fixture, 'access-cliente-view-user')).not.toBeNull()
    expect(testId(fixture, 'access-cliente-manage-viewer')).not.toBeNull()
    expect(fixture.nativeElement.querySelectorAll('[data-testid^="access-cliente-"]')).toHaveLength(6)
  })

  it('con máquina aparece una fila por transición', () => {
    store.addResource('Factura')
    store.addField('factura')
    store.updateField('factura', 1, {
      name: 'estado',
      label: 'Estado',
      type: 'enum',
      values: [
        { value: 'borrador', label: 'Borrador' },
        { value: 'aprobada', label: 'Aprobada' }
      ]
    })
    store.promoteState('factura', 'estado')
    store.addTransition('factura', 'borrador', 'aprobada')

    const fixture = mount()

    expect(testId(fixture, 'access-factura-a-aprobada-user')).not.toBeNull()
    expect(testId(fixture, 'access-factura-a-aprobada-viewer')).not.toBeNull()
  })

  it('la columna Admin va marcada, deshabilitada y atenuada', () => {
    store.addResource('Cliente')

    const fixture = mount()
    const admin = testId(fixture, 'access-cliente-view-admin')

    expect(admin?.checked).toBe(true)
    expect(admin?.disabled).toBe(true)
  })

  it('sin matriz pinta la política actual: Consulta ve pero no gestiona', () => {
    store.addResource('Cliente')

    const fixture = mount()

    expect(testId(fixture, 'access-cliente-view-viewer')?.checked).toBe(true)
    expect(testId(fixture, 'access-cliente-manage-viewer')?.checked).toBe(false)
    expect(testId(fixture, 'access-cliente-manage-user')?.checked).toBe(true)
  })

  it('un click persiste la matriz explícita en el diseño', () => {
    store.addResource('Cliente')

    const fixture = mount()
    testId(fixture, 'access-cliente-manage-user')?.click()
    fixture.detectChanges()

    expect(store.resources()[0].access).toEqual({ view: ['user', 'viewer'], manage: [] })
    expect(testId(fixture, 'access-cliente-manage-user')?.checked).toBe(false)
  })
})
