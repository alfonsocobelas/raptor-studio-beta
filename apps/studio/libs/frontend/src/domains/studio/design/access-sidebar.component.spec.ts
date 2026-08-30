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

  it('el conmutador cambia el pivote entre Rol y Entidad', () => {
    const fixture = mount()

    testId(fixture, 'access-pivot-entity')?.click()
    fixture.detectChanges()

    expect(ui.pivot()).toBe('entity')
    expect(testId(fixture, 'access-pivot-entity')?.getAttribute('aria-current')).toBe('true')

    testId(fixture, 'access-pivot-role')?.click()
    expect(ui.pivot()).toBe('role')
  })

  it('lleva la nota de que la fila de admin no se edita', () => {
    const fixture = mount()

    expect(fixture.nativeElement.textContent).toContain('Admin siempre puede todo')
  })
})

describe('roles personalizados en el raíl (spec 76)', () => {
  let ui: AccessUiService

  beforeEach(() => {
    TestBed.configureTestingModule({})
    ui = TestBed.inject(AccessUiService)
    ui.role.set('user')
    ui.pivot.set('role')
  })

  function input(fixture: ReturnType<typeof mount>, id: string): HTMLInputElement | null {
    return fixture.nativeElement.querySelector(`[data-testid="${id}"]`)
  }

  it('«+ Nuevo rol» abre el formulario; confirmar declara el rol, lo pinta y lo activa', async () => {
    const { DesignStore } = await import('./design-store')
    const store = TestBed.inject(DesignStore)
    const fixture = mount()

    testId(fixture, 'access-role-add')?.click()
    fixture.detectChanges()

    const label = input(fixture, 'access-role-new-label')
    expect(label).not.toBeNull()
    label!.value = 'Perito'
    label!.dispatchEvent(new Event('input'))
    fixture.detectChanges()
    testId(fixture, 'access-role-new-confirm')?.click()
    fixture.detectChanges()

    expect(store.roles()).toEqual([{ name: 'perito', label: 'Perito' }])
    expect(testId(fixture, 'access-role-perito')?.textContent).toContain('Perito')
    expect(ui.role()).toBe('perito')
  })

  it('un rol inválido enseña el motivo y no declara nada', async () => {
    const { DesignStore } = await import('./design-store')
    const store = TestBed.inject(DesignStore)
    const fixture = mount()

    testId(fixture, 'access-role-add')?.click()
    fixture.detectChanges()
    const label = input(fixture, 'access-role-new-label')
    label!.value = 'Admin'
    label!.dispatchEvent(new Event('input'))
    fixture.detectChanges()
    testId(fixture, 'access-role-new-confirm')?.click()
    fixture.detectChanges()

    expect(store.roles()).toEqual([])
    expect(fixture.nativeElement.querySelector('[data-testid="access-role-new-error"]')?.textContent).toBeTruthy()
  })

  it('quitar un rol personalizado lo borra del catálogo y devuelve el activo a Usuario', async () => {
    const { DesignStore } = await import('./design-store')
    const store = TestBed.inject(DesignStore)
    store.addRole({ name: 'perito', label: 'Perito' })
    ui.role.set('perito')
    const fixture = mount()

    testId(fixture, 'access-role-remove-perito')?.click()
    fixture.detectChanges()

    expect(store.roles()).toEqual([])
    expect(ui.role()).toBe('user')
    expect(testId(fixture, 'access-role-perito')).toBeNull()
  })
})
