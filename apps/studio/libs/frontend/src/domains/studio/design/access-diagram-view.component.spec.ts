import { beforeEach, describe, expect, it } from 'vitest'
import { TestBed } from '@angular/core/testing'
import { AccessDiagramViewComponent } from './access-diagram-view.component'
import { AccessUiService } from './access-ui.service'
import { DesignStore } from './design-store'

function mount() {
  const fixture = TestBed.createComponent(AccessDiagramViewComponent)
  fixture.detectChanges()
  return fixture
}

/**
 * Spec 49 (maquetas 26B/26C): el lienzo de Accesos habla el idioma de Flujos — nodo de
 * ROL, tarjetas de entidad y curvas entre ambos. Un rol cada vez: el activo del raíl,
 * que además tiñe sus flechas. Solo lectura: la matriz se edita en la tabla.
 */
describe('AccessDiagramViewComponent', () => {
  let store: DesignStore
  let ui: AccessUiService

  beforeEach(() => {
    TestBed.configureTestingModule({})
    store = TestBed.inject(DesignStore)
    ui = TestBed.inject(AccessUiService)
    ui.role.set('user')
  })

  it('sin entidades muestra el estado vacío', () => {
    const fixture = mount()

    expect(fixture.nativeElement.querySelector('[data-testid="access-view-empty"]')).not.toBeNull()
  })

  it('pinta el nodo del rol activo y una tarjeta por entidad con sus chips', () => {
    store.addResource('Factura')

    const fixture = mount()
    const texto = fixture.nativeElement.textContent

    expect(fixture.nativeElement.querySelector('[data-testid="access-viewport"]')).not.toBeNull()
    expect(fixture.nativeElement.querySelector('[data-testid="access-role-node"]')).not.toBeNull()
    expect(texto).toContain('Usuario')
    expect(texto).toContain('Facturas')
    expect(texto).toContain('Ver Facturas')
    expect(texto).toContain('Gestionar Facturas')
    // admin no se dibuja: puede todo y sus aristas no cuentan nada
    expect(texto).not.toContain('Administrador')
  })

  it('una curva por entidad accesible, con el trazo de las flechas de Flujos', () => {
    store.addResource('Factura')

    const fixture = mount()
    const edge = fixture.nativeElement.querySelector('[data-testid="access-edge-factura"]')

    expect(edge).not.toBeNull()
    expect(edge.getAttribute('d')).toContain(' C ')
  })

  it('cambiar de rol cambia el nodo y el acento de las flechas', () => {
    store.addResource('Factura')

    const fixture = mount()
    expect(fixture.nativeElement.querySelector('[data-testid="access-edge-factura"]').getAttribute('data-accent')).toBe(
      'user'
    )

    ui.role.set('viewer')
    fixture.detectChanges()

    expect(fixture.nativeElement.textContent).toContain('Consulta')
    expect(fixture.nativeElement.querySelector('[data-testid="access-edge-factura"]').getAttribute('data-accent')).toBe(
      'viewer'
    )
  })

  it('sin ninguna capacidad la entidad se queda sin flecha', () => {
    store.addResource('Factura')
    store.setResourceAccess('factura', { view: [], create: [], edit: [], delete: [] })

    const fixture = mount()

    expect(fixture.nativeElement.querySelector('[data-testid="access-edge-factura"]')).toBeNull()
    expect(fixture.nativeElement.querySelector('[data-testid="access-card-factura"]')?.textContent).toContain(
      'sin acceso'
    )
  })
})
