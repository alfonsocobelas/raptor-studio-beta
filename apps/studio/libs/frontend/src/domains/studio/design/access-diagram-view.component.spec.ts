import { beforeEach, describe, expect, it } from 'vitest'
import { TestBed } from '@angular/core/testing'
import { AccessDiagramViewComponent } from './access-diagram-view.component'
import { DesignStore } from './design-store'

function mount() {
  const fixture = TestBed.createComponent(AccessDiagramViewComponent)
  fixture.detectChanges()
  return fixture
}

/**
 * Spec 46 TASK-08: el lienzo de Accesos pinta el diagrama de casos de uso DERIVADO del
 * diseño — solo lectura, con la cámara compartida del estudio. El raíl edita; esto pinta.
 */
describe('AccessDiagramViewComponent', () => {
  let store: DesignStore

  beforeEach(() => {
    TestBed.configureTestingModule({})
    store = TestBed.inject(DesignStore)
  })

  it('sin entidades muestra el estado vacío', () => {
    const fixture = mount()

    expect(fixture.nativeElement.querySelector('[data-testid="access-view-empty"]')).not.toBeNull()
  })

  it('pinta actores, caja de sistema y elipses derivadas del diseño', () => {
    store.addResource('Factura')

    const fixture = mount()
    const texto = fixture.nativeElement.textContent

    expect(fixture.nativeElement.querySelector('[data-testid="access-viewport"]')).not.toBeNull()
    expect(texto).toContain('Administrador')
    expect(texto).toContain('Usuario')
    expect(texto).toContain('Consulta')
    expect(texto).toContain('Ver Facturas')
    expect(texto).toContain('Crear Facturas')
    expect(texto).toContain('Editar Facturas')
    expect(texto).toContain('Borrar Facturas')
  })

  it('las aristas siguen la matriz: sin Ver para consulta, su arista desaparece', () => {
    store.addResource('Factura')
    const before = mount()
    const count = (fixture: ReturnType<typeof mount>) =>
      fixture.nativeElement.querySelectorAll('[data-testid^="access-edge-"]').length

    // política actual: admin 4 + user 4 + viewer 1 (solo Ver)
    expect(count(before)).toBe(9)

    store.setResourceAccess('factura', { view: [], create: [], edit: [], delete: [] })
    const after = mount()

    // solo quedan las de admin, que siempre puede todo
    expect(count(after)).toBe(4)
  })
})
