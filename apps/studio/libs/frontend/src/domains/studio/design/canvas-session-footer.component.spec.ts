import { beforeEach, describe, expect, it } from 'vitest'
import { TestBed } from '@angular/core/testing'
import { ActiveViewService } from './active-view.service'
import { CanvasSessionFooterComponent } from './canvas-session-footer.component'

function mount() {
  const fixture = TestBed.createComponent(CanvasSessionFooterComponent)
  fixture.detectChanges()
  return fixture
}

function testId(fixture: ReturnType<typeof mount>, id: string): HTMLElement | null {
  return fixture.nativeElement.querySelector(`[data-testid="${id}"]`)
}

/**
 * El pie de sesión de la maqueta es el espejo del session-footer que emite el plugin de
 * auth: chip con avatar, nombre y email, y un menú con la cabecera del usuario (email ·
 * rol), Cuenta y Cerrar sesión. Aquí no cierra sesión: cambia la vista de sistema.
 */
describe('CanvasSessionFooterComponent', () => {
  let active: ActiveViewService

  beforeEach(() => {
    TestBed.configureTestingModule({})
    active = TestBed.inject(ActiveViewService)
  })

  it('el chip enseña iniciales, nombre y email, con el menú cerrado', () => {
    const fixture = mount()
    const chip = testId(fixture, 'mock-session-footer')

    expect(chip?.textContent).toContain('AL')
    expect(chip?.textContent).toContain('Admin Local')
    expect(chip?.textContent).toContain('admin@app.local')
    expect(chip?.getAttribute('aria-expanded')).toBe('false')
    expect(testId(fixture, 'mock-session-menu')).toBeNull()
  })

  it('el menú lleva la cabecera del usuario con el rol, como el emitido', () => {
    const fixture = mount()

    testId(fixture, 'mock-session-footer')?.click()
    fixture.detectChanges()
    const menu = testId(fixture, 'mock-session-menu')

    expect(menu?.textContent).toContain('Admin Local')
    expect(menu?.textContent).toContain('admin@app.local · Administrador')
    expect(testId(fixture, 'mock-my-account')?.textContent).toContain('Cuenta')
    expect(testId(fixture, 'mock-logout')?.textContent).toContain('Cerrar sesión')
  })

  it('Cuenta y Cerrar sesión llevan a su vista de sistema y cierran el menú', () => {
    const fixture = mount()

    testId(fixture, 'mock-session-footer')?.click()
    fixture.detectChanges()
    testId(fixture, 'mock-my-account')?.click()
    fixture.detectChanges()

    expect(active.systemView()).toBe('account')
    expect(testId(fixture, 'mock-session-menu')).toBeNull()

    testId(fixture, 'mock-session-footer')?.click()
    fixture.detectChanges()
    testId(fixture, 'mock-logout')?.click()
    fixture.detectChanges()

    expect(active.systemView()).toBe('login')
    expect(testId(fixture, 'mock-session-menu')).toBeNull()
  })
})
