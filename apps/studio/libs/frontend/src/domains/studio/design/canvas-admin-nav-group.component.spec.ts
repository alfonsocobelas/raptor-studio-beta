import { beforeEach, describe, expect, it } from 'vitest'
import { TestBed } from '@angular/core/testing'
import { ActiveViewService } from './active-view.service'
import { CanvasAdminNavGroupComponent } from './canvas-admin-nav-group.component'

function mount() {
  const fixture = TestBed.createComponent(CanvasAdminNavGroupComponent)
  fixture.detectChanges()
  return fixture
}

function testId(fixture: ReturnType<typeof mount>, id: string): HTMLElement | null {
  return fixture.nativeElement.querySelector(`[data-testid="${id}"]`)
}

/**
 * El grupo Administración del preview es el espejo del que emite el generador
 * (admin-nav-group.component del plugin de auth): cabecera pulsable que despliega
 * las vistas de sistema. Si el emitido se pliega y el preview no, el lienzo miente.
 */
describe('CanvasAdminNavGroupComponent', () => {
  let active: ActiveViewService

  beforeEach(() => {
    TestBed.configureTestingModule({})
    active = TestBed.inject(ActiveViewService)
  })

  it('nace desplegado: la cabecera anuncia el grupo y Usuarios está a la vista', () => {
    const fixture = mount()

    expect(testId(fixture, 'mock-admin-toggle')?.textContent).toContain('Administración')
    expect(testId(fixture, 'mock-admin-toggle')?.getAttribute('aria-expanded')).toBe('true')
    expect(testId(fixture, 'mock-nav-users')).not.toBeNull()
  })

  it('la cabecera pliega y despliega el grupo', () => {
    const fixture = mount()

    testId(fixture, 'mock-admin-toggle')?.click()
    fixture.detectChanges()

    expect(testId(fixture, 'mock-admin-toggle')?.getAttribute('aria-expanded')).toBe('false')
    expect(testId(fixture, 'mock-nav-users')).toBeNull()

    testId(fixture, 'mock-admin-toggle')?.click()
    fixture.detectChanges()

    expect(testId(fixture, 'mock-nav-users')).not.toBeNull()
  })

  it('Usuarios sigue seleccionando la vista de sistema del lienzo', () => {
    const fixture = mount()

    testId(fixture, 'mock-nav-users')?.click()
    fixture.detectChanges()

    expect(active.systemView()).toBe('users')
    expect(testId(fixture, 'mock-nav-users')?.className).toContain('bg-accent')
  })
})
