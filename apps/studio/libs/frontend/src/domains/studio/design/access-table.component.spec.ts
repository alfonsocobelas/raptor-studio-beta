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


/** Factura con máquina de estados y DOS transiciones: la fila que hoy deforma la tabla. */
function facturaConMaquina(store: DesignStore): void {
  store.addResource('Factura')
  store.addField('factura')
  store.updateField('factura', 1, {
    name: 'estado',
    label: 'Estado',
    type: 'enum',
    values: [
      { value: 'borrador', label: 'Borrador' },
      { value: 'aprobada', label: 'Aprobada' },
      { value: 'pagada', label: 'Pagada' }
    ]
  })
  store.promoteState('factura', 'estado')
  store.addTransition('factura', 'borrador', 'aprobada')
  store.addTransition('factura', 'aprobada', 'pagada')
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

  it('el chip de transición lleva el gancho del hover y no lo lleva cuando no se puede tocar', () => {
    facturaConMaquina(store)

    const fixture = mount()
    testId(fixture, 'access-flow-factura')?.click()
    fixture.detectChanges()
    const chip = testId(fixture, 'access-cell-factura-a-aprobada')

    expect(chip?.className).toContain('flow-chip')
    expect(chip?.disabled).toBe(false)

    ui.role.set('admin')
    fixture.detectChanges()

    // admin se mira pero no se toca: el botón va deshabilitado y el hover no debe responder
    expect(testId(fixture, 'access-cell-factura-a-aprobada')?.disabled).toBe(true)
  })

  it('con máquina de estados aparece un conmutador por transición', () => {
    facturaConMaquina(store)

    const fixture = mount()
    testId(fixture, 'access-flow-factura')?.click()
    fixture.detectChanges()
    const chip = testId(fixture, 'access-cell-factura-a-aprobada')

    expect(chip).not.toBeNull()
    expect(chip?.getAttribute('aria-pressed')).toBe('true')

    chip?.click()
    fixture.detectChanges()

    expect(store.resources()[0].access?.transitions).toEqual({ 'a-aprobada': [], 'a-pagada': ['user'] })
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


  /**
   * Rediseño de la columna (2026-08-27): los chips de transición ya no viven en la celda
   * —con muchas transiciones envolvían y deformaban la retícula—. La celda es un contador
   * estrecho y los chips bajan a una fila desplegable. Estado de UI viva: no se persiste.
   */
  describe('columna Flujo', () => {
    it('cuenta las transiciones concedidas del rol y no pinta los chips hasta abrirla', () => {
      facturaConMaquina(store)

      const fixture = mount()

      expect(testId(fixture, 'access-flow-factura')?.textContent?.replace(/\s/g, '')).toContain('2/2')
      expect(testId(fixture, 'access-cell-factura-a-aprobada')).toBeNull()

      testId(fixture, 'access-cell-factura-view') // la retícula CRUD sigue en su sitio
      expect(testId(fixture, 'access-flow-panel-factura')).toBeNull()
    })

    it('el contador abre la fila y un segundo click la cierra', () => {
      facturaConMaquina(store)

      const fixture = mount()
      testId(fixture, 'access-flow-factura')?.click()
      fixture.detectChanges()

      expect(testId(fixture, 'access-flow-panel-factura')).not.toBeNull()
      expect(testId(fixture, 'access-cell-factura-a-aprobada')).not.toBeNull()
      expect(testId(fixture, 'access-cell-factura-a-pagada')).not.toBeNull()

      testId(fixture, 'access-flow-factura')?.click()
      fixture.detectChanges()

      expect(testId(fixture, 'access-flow-panel-factura')).toBeNull()
    })

    it('solo hay una fila abierta a la vez', () => {
      facturaConMaquina(store)
      store.addResource('Pedido')
      store.addField('pedido')
      store.updateField('pedido', 1, {
        name: 'estado',
        label: 'Estado',
        type: 'enum',
        values: [
          { value: 'nuevo', label: 'Nuevo' },
          { value: 'servido', label: 'Servido' }
        ]
      })
      store.promoteState('pedido', 'estado')
      store.addTransition('pedido', 'nuevo', 'servido')

      const fixture = mount()
      testId(fixture, 'access-flow-factura')?.click()
      fixture.detectChanges()
      testId(fixture, 'access-flow-pedido')?.click()
      fixture.detectChanges()

      expect(testId(fixture, 'access-flow-panel-pedido')).not.toBeNull()
      expect(testId(fixture, 'access-flow-panel-factura')).toBeNull()
    })

    it('el contador refleja lo que se retira sin cerrar la fila', () => {
      facturaConMaquina(store)

      const fixture = mount()
      testId(fixture, 'access-flow-factura')?.click()
      fixture.detectChanges()
      testId(fixture, 'access-cell-factura-a-pagada')?.click()
      fixture.detectChanges()

      expect(testId(fixture, 'access-flow-factura')?.textContent?.replace(/\s/g, '')).toContain('1/2')
      expect(testId(fixture, 'access-flow-panel-factura')).not.toBeNull()
    })

    it('una entidad sin máquina lleva un guion en la columna, no un contador', () => {
      facturaConMaquina(store)
      store.addResource('Cliente')

      const fixture = mount()

      expect(testId(fixture, 'access-flow-cliente')).toBeNull()
      expect(fixture.nativeElement.querySelector('[data-testid="access-row-cliente"]')?.textContent).toContain('—')
    })

    it('sin ninguna máquina en el diseño la columna no existe', () => {
      store.addResource('Cliente')

      const fixture = mount()

      expect(fixture.nativeElement.textContent).not.toContain('Flujo')
      expect(testId(fixture, 'access-flow-cliente')).toBeNull()
    })
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
     */
    it('la entidad se elige con el desplegable del estudio, no con el del navegador', async () => {
      store.addResource('Cliente')
      store.addResource('Factura')
      ui.entity.set('cliente')

      const fixture = mount()
      // ngModel escribe el valor inicial en una microtarea: sin estabilizar, el disparador va vacío.
      await fixture.whenStable()
      fixture.detectChanges()

      expect(fixture.nativeElement.querySelector('select')).toBeNull()
      const trigger = fixture.nativeElement.querySelector('[data-testid="access-entity-select"] button')
      expect(trigger?.textContent).toContain('Clientes')

      trigger.click()
      fixture.detectChanges()
      await fixture.whenStable()

      // La lista vive en un overlay del CDK, fuera del fixture: se busca en el documento.
      const option = [...document.querySelectorAll('hlm-select-item')].find(item =>
        item.textContent?.includes('Facturas')
      ) as HTMLElement | undefined
      expect(option).toBeDefined()

      option?.click()
      fixture.detectChanges()

      expect(ui.entity()).toBe('factura')
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

    it('el contador y su desplegable van por fila de rol', () => {
      facturaConMaquina(store)
      ui.entity.set('factura')

      const fixture = mount()

      expect(testId(fixture, 'access-eflow-user')?.textContent?.replace(/\s/g, '')).toContain('2/2')
      expect(testId(fixture, 'access-eflow-viewer')?.textContent?.replace(/\s/g, '')).toContain('0/2')
      expect(testId(fixture, 'access-ecell-user-a-aprobada')).toBeNull()

      testId(fixture, 'access-eflow-user')?.click()
      fixture.detectChanges()

      expect(testId(fixture, 'access-eflow-panel-user')).not.toBeNull()
      expect(testId(fixture, 'access-ecell-user-a-aprobada')?.disabled).toBe(false)

      testId(fixture, 'access-eflow-admin')?.click()
      fixture.detectChanges()

      expect(testId(fixture, 'access-eflow-panel-user')).toBeNull()
      expect(testId(fixture, 'access-ecell-admin-a-aprobada')?.disabled).toBe(true)
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
