import { beforeEach, describe, expect, it } from 'vitest'
import { TestBed } from '@angular/core/testing'
import { AccessTableComponent } from './access-table.component'
import { AccessUiService } from './access-ui.service'
import { DesignStore } from './design-store'

function mount() {
  const fixture = TestBed.createComponent(AccessTableComponent)
  fixture.detectChanges()
  return fixture
}

function testId(fixture: ReturnType<typeof mount>, id: string): HTMLButtonElement | null {
  return fixture.nativeElement.querySelector(`[data-testid="${id}"]`)
}

function pressed(fixture: ReturnType<typeof mount>, id: string): boolean {
  return testId(fixture, id)?.getAttribute('aria-pressed') === 'true'
}

/**
 * Spec 49: la tabla central de Accesos (mockups 30A/31B) — filas de entidad, columnas
 * Ver/Crear/Editar/Borrar más las transiciones de cada máquina; cada celda es un botón
 * que conmuta el permiso del ROL ACTIVO y persiste la matriz explícita. Admin se mira
 * pero no se toca.
 */
describe('AccessTableComponent', () => {
  let store: DesignStore
  let ui: AccessUiService

  beforeEach(() => {
    TestBed.configureTestingModule({})
    store = TestBed.inject(DesignStore)
    ui = TestBed.inject(AccessUiService)
    ui.role.set('user')
    ui.search.set('')
    ui.onlyWithAccess.set(false)
  })

  it('sin entidades muestra el estado vacío que manda al Modelo', () => {
    const fixture = mount()

    expect(testId(fixture, 'access-table-empty')).not.toBeNull()
    expect(testId(fixture, 'access-table-empty')?.textContent).toContain('Modelo')
  })

  it('titula con el rol activo y pinta una fila por entidad con las cuatro celdas CRUD', () => {
    store.addResource('Cliente')

    const fixture = mount()

    expect(fixture.nativeElement.textContent).toContain('Qué puede hacer Usuario')
    expect(testId(fixture, 'access-cell-cliente-view')).not.toBeNull()
    expect(testId(fixture, 'access-cell-cliente-create')).not.toBeNull()
    expect(testId(fixture, 'access-cell-cliente-edit')).not.toBeNull()
    expect(testId(fixture, 'access-cell-cliente-delete')).not.toBeNull()
  })

  it('sin matriz pinta la política actual del rol activo', () => {
    store.addResource('Cliente')

    const fixture = mount()

    expect(pressed(fixture, 'access-cell-cliente-view')).toBe(true)
    expect(pressed(fixture, 'access-cell-cliente-delete')).toBe(true)

    ui.role.set('viewer')
    fixture.detectChanges()

    expect(pressed(fixture, 'access-cell-cliente-view')).toBe(true)
    expect(pressed(fixture, 'access-cell-cliente-create')).toBe(false)
  })

  it('un click en la celda conmuta el permiso y persiste la matriz granular explícita', () => {
    store.addResource('Cliente')

    const fixture = mount()
    testId(fixture, 'access-cell-cliente-delete')?.click()
    fixture.detectChanges()

    expect(store.resources()[0].access).toEqual({
      view: ['user', 'viewer'],
      create: ['user'],
      edit: ['user'],
      delete: []
    })
    expect(pressed(fixture, 'access-cell-cliente-delete')).toBe(false)
  })

  it('con máquina de estados aparece un conmutador por transición', () => {
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
    const chip = testId(fixture, 'access-cell-factura-a-aprobada')

    expect(chip).not.toBeNull()
    expect(chip?.getAttribute('aria-pressed')).toBe('true')

    chip?.click()
    fixture.detectChanges()

    expect(store.resources()[0].access?.transitions).toEqual({ 'a-aprobada': [] })
  })

  it('con admin activo la tabla se mira pero no se toca', () => {
    store.addResource('Cliente')
    ui.role.set('admin')

    const fixture = mount()
    const cell = testId(fixture, 'access-cell-cliente-delete')

    expect(fixture.nativeElement.textContent).toContain('Qué puede hacer Administrador')
    expect(pressed(fixture, 'access-cell-cliente-delete')).toBe(true)
    expect(cell?.disabled).toBe(true)

    cell?.click()
    fixture.detectChanges()

    expect(store.resources()[0].access).toBeUndefined()
  })

  it('la búsqueda filtra las filas y el pie cuenta N de M', () => {
    store.addResource('Cliente')
    store.addResource('Factura')

    const fixture = mount()
    expect(testId(fixture, 'access-count')?.textContent).toContain('2 de 2')

    ui.search.set('fact')
    fixture.detectChanges()

    expect(testId(fixture, 'access-cell-cliente-view')).toBeNull()
    expect(testId(fixture, 'access-cell-factura-view')).not.toBeNull()
    expect(testId(fixture, 'access-count')?.textContent).toContain('1 de 2')
  })

  it('«Con acceso» esconde las entidades que el rol no ve', () => {
    store.addResource('Cliente')
    store.addResource('Factura')
    store.setResourceAccess('factura', { view: ['user'], create: [], edit: [], delete: [] })
    ui.role.set('viewer')
    ui.onlyWithAccess.set(true)

    const fixture = mount()

    expect(testId(fixture, 'access-cell-cliente-view')).not.toBeNull()
    expect(testId(fixture, 'access-cell-factura-view')).toBeNull()
    expect(testId(fixture, 'access-count')?.textContent).toContain('1 de 2')
  })

  it('la fila enseña el subtítulo derivado del diseño', () => {
    store.addResource('Cliente')

    const fixture = mount()
    const row = fixture.nativeElement.querySelector('[data-testid="access-row-cliente"]')

    expect(row?.textContent).toContain('campos')
  })

  describe('pivote Entidad', () => {
    beforeEach(() => {
      ui.pivot.set('entity')
    })

    it('pinta una fila por rol para la entidad elegida, admin solo lectura', () => {
      store.addResource('Cliente')
      ui.entity.set('')

      const fixture = mount()

      expect(fixture.nativeElement.textContent).toContain('Quién puede con Clientes')
      const admin = testId(fixture, 'access-ecell-admin-view')
      expect(admin?.getAttribute('aria-pressed')).toBe('true')
      expect(admin?.disabled).toBe(true)
      expect(pressed(fixture, 'access-ecell-user-delete')).toBe(true)
      expect(pressed(fixture, 'access-ecell-viewer-create')).toBe(false)
    })

    it('el selector cambia de entidad', () => {
      store.addResource('Cliente')
      store.addResource('Factura')
      ui.entity.set('factura')

      const fixture = mount()

      expect(fixture.nativeElement.textContent).toContain('Quién puede con Facturas')
    })

    /**
     * El desplegable nativo lo pinta el sistema operativo, no el CSS del estudio: la lista
     * desplegada se vería del navegador. El contrato app-select (ADR-003) lo pinta el estudio.
     *
     * Lo que este test NO comprueba, y por qué: abrir el desplegable y elegir una opción no es
     * verificable en este runner. Vitest corre sin el plugin de Angular, así que compila JIT y
     * los signal inputs no se registran — el propio montaje escupe «NG0303: Can't bind to
     * 'options'» y «NG0303: buttonId» dentro de AppSelect, y el brain de Spartan además pide un
     * ResizeObserver que el DOM de pruebas no tiene. Resultado: el disparador se renderiza vacío.
     * Fingir esa cobertura sería peor que no tenerla; el gate real de la interacción es el smoke
     * con navegador. Cuando el runner compile AOT (backlog: @analogjs/vite-plugin-angular), este
     * test puede recuperar la parte de abrir y elegir.
     */
    it('la entidad se elige con el desplegable del estudio, no con el del navegador', () => {
      store.addResource('Cliente')
      store.addResource('Factura')
      ui.entity.set('cliente')

      const fixture = mount()

      expect(fixture.nativeElement.querySelector('select')).toBeNull()
      expect(fixture.nativeElement.querySelector('[data-testid="access-entity-select"]')).not.toBeNull()
    })

    it('la cabecera sigue a la entidad elegida', () => {
      store.addResource('Cliente')
      store.addResource('Factura')
      ui.entity.set('cliente')

      const fixture = mount()
      expect(fixture.nativeElement.textContent).toContain('Quién puede con Clientes')

      ui.entity.set('factura')
      fixture.detectChanges()

      expect(fixture.nativeElement.textContent).toContain('Quién puede con Facturas')
    })

    it('un click en la celda persiste el permiso del rol de esa fila', () => {
      store.addResource('Cliente')
      ui.entity.set('cliente')

      const fixture = mount()
      testId(fixture, 'access-ecell-viewer-create')?.click()
      fixture.detectChanges()

      expect(store.resources()[0].access?.create).toEqual(['user', 'viewer'])
      expect(pressed(fixture, 'access-ecell-viewer-create')).toBe(true)
    })
  })
})
