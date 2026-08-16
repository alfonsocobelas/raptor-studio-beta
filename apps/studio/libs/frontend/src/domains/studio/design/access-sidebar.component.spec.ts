import { beforeEach, describe, expect, it } from 'vitest'
import { TestBed } from '@angular/core/testing'
import { AccessSidebarComponent } from './access-sidebar.component'
import { AccessUiService } from './access-ui.service'

function mount() {
  const fixture = TestBed.createComponent(AccessSidebarComponent)
  fixture.detectChanges()
  return fixture
}

function testId(fixture: ReturnType<typeof mount>, id: string): HTMLButtonElement | null {
  return fixture.nativeElement.querySelector(`[data-testid="${id}"]`)
}

/**
 * Spec 49: el raíl de Accesos es la lista de ROLES (mockups 30A/31B) — el activo se
 * resalta y gobierna la tabla central — más el conmutador Rol|Entidad|Diagrama y la
 * nota de admin. La matriz ya no se edita aquí: se edita en la tabla.
 */
describe('AccessSidebarComponent', () => {
  let ui: AccessUiService

  beforeEach(() => {
    TestBed.configureTestingModule({})
    ui = TestBed.inject(AccessUiService)
    ui.role.set('user')
    ui.pivot.set('role')
  })

  it('pinta los tres roles fijos con Usuario activo por defecto', () => {
    const fixture = mount()

    expect(testId(fixture, 'access-role-admin')?.textContent).toContain('Administrador')
    expect(testId(fixture, 'access-role-user')?.textContent).toContain('Usuario')
    expect(testId(fixture, 'access-role-viewer')?.textContent).toContain('Consulta')
    expect(testId(fixture, 'access-role-user')?.getAttribute('aria-current')).toBe('true')
    expect(testId(fixture, 'access-role-admin')?.getAttribute('aria-current')).toBeNull()
  })

  it('elegir un rol lo activa para la tabla', () => {
    const fixture = mount()

    testId(fixture, 'access-role-viewer')?.click()
    fixture.detectChanges()

    expect(ui.role()).toBe('viewer')
    expect(testId(fixture, 'access-role-viewer')?.getAttribute('aria-current')).toBe('true')
  })

  it('la tarjeta de admin recuerda que puede TODO', () => {
    const fixture = mount()

    expect(testId(fixture, 'access-role-admin')?.textContent).toContain('Todo')
  })

  it('el conmutador cambia el pivote entre Rol, Entidad y Diagrama', () => {
    const fixture = mount()

    testId(fixture, 'access-pivot-diagram')?.click()
    fixture.detectChanges()

    expect(ui.pivot()).toBe('diagram')
    expect(testId(fixture, 'access-pivot-diagram')?.getAttribute('aria-current')).toBe('true')

    testId(fixture, 'access-pivot-entity')?.click()
    expect(ui.pivot()).toBe('entity')
  })

  it('lleva la nota de que la fila de admin no se edita', () => {
    const fixture = mount()

    expect(fixture.nativeElement.textContent).toContain('Admin siempre puede todo')
  })
})
