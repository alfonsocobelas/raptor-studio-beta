import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TestBed } from '@angular/core/testing'
import { chooseInSelect, openSelect, selectValueLabel } from '../../../shared/components/ui/select.harness'
import { ActiveViewService } from './active-view.service'
import { DesignStore } from './design-store'
import { ModelPanelComponent } from './model-panel.component'

function mount() {
  const fixture = TestBed.createComponent(ModelPanelComponent)
  fixture.detectChanges()
  return fixture
}

function testId(fixture: ReturnType<typeof mount>, id: string): HTMLElement | null {
  return fixture.nativeElement.querySelector(`[data-testid="${id}"]`)
}

describe('ModelPanelComponent', () => {
  let store: DesignStore
  let active: ActiveViewService

  beforeEach(() => {
    TestBed.configureTestingModule({})
    store = TestBed.inject(DesignStore)
    active = TestBed.inject(ActiveViewService)
    store.addResource('Producto')
    store.addField('producto')
  })

  it('tiene las tres pestañas del modelo', () => {
    const fixture = mount()
    const tabs = fixture.nativeElement.querySelectorAll('[data-testid^="model-tab-"]')

    expect([...tabs].map((tab: Element) => tab.textContent?.trim())).toEqual(['Campo', 'Entidad', 'Relación'])
  })

  it('sin columna elegida la pestaña de campo lo dice', () => {
    active.selectResource('producto')

    const fixture = mount()

    expect(testId(fixture, 'field-empty')).not.toBeNull()
  })

  it('elegir una columna en el diagrama abre su pestaña con sus datos', () => {
    active.selectField('producto', 1)

    const fixture = mount()

    expect(testId(fixture, 'model-tab-field')?.getAttribute('aria-selected')).toBe('true')
    expect((testId(fixture, 'field-name') as HTMLInputElement).value).toBe(store.resources()[0].fields[1].label)
  })

  it('saltar de una columna a OTRA entidad abre la pestaña Entidad, no deja Campo vacío', () => {
    store.addResource('Cliente')
    active.selectField('producto', 1)

    const fixture = mount()
    active.selectResource('cliente')
    fixture.detectChanges()

    expect(testId(fixture, 'model-tab-entity')?.getAttribute('aria-selected')).toBe('true')
    expect(testId(fixture, 'field-empty')).toBeNull()
  })

  /**
   * La frase de negocio es de la ENTIDAD, no del bloque que la pinta: vive donde se edita la
   * entidad. En el panel de Componente aparecía igual para una tabla, un formulario o unos
   * KPIs de la misma entidad, que es justo lo que la hacía leerse como ruido.
   */
  it('la frase de negocio de la entidad se escribe en la pestaña Entidad', () => {
    active.selectResource('producto')

    const fixture = mount()
    testId(fixture, 'model-tab-entity')?.click()
    fixture.detectChanges()

    const brief = testId(fixture, 'resource-brief') as HTMLTextAreaElement
    expect(brief).not.toBeNull()

    brief.value = 'Lo que la frutería vende'
    brief.dispatchEvent(new Event('change'))

    expect(store.resources()[0].brief).toBe('Lo que la frutería vende')
  })

  it('volver a la MISMA entidad no roba la pestaña que estabas usando', () => {
    active.selectField('producto', 1)

    const fixture = mount()
    active.selectResource('producto')
    fixture.detectChanges()

    expect(testId(fixture, 'model-tab-field')?.getAttribute('aria-selected')).toBe('true')
  })

  // El desplegable nativo lo pinta el sistema operativo, no el CSS del estudio (ADR-003).
  it('tipo y referencia se eligen con el desplegable del estudio, no con el del navegador', () => {
    active.selectField('producto', 1)

    const fixture = mount()

    expect(fixture.nativeElement.querySelector('select')).toBeNull()
  })

  it('cambiar el tipo de la columna lo escribe en el diseño', async () => {
    active.selectField('producto', 1)

    const fixture = mount()
    await chooseInSelect(fixture, 'field-type', 'fecha')

    expect(store.resources()[0].fields[1].type).toBe('date')
  })

  it('el tipo no ofrece «referencia»: eso se elige en su propio control', async () => {
    active.selectField('producto', 1)

    const fixture = mount()
    const opciones = await openSelect(fixture, 'field-type')

    expect(opciones).not.toContain('referencia a…')
    expect(opciones).toContain('uuid')
  })

  it('apuntar el campo a otra entidad lo convierte en relación', async () => {
    store.addResource('Proveedor')
    active.selectField('producto', 1)

    const fixture = mount()
    await chooseInSelect(fixture, 'field-ref', 'Proveedor')

    expect(store.resources()[0].fields[1]).toMatchObject({ type: 'ref', refTo: 'proveedor' })
  })

  it('la propia entidad no aparece entre los destinos posibles', async () => {
    store.addResource('Proveedor')
    active.selectField('producto', 1)

    const fixture = mount()
    const opciones = await openSelect(fixture, 'field-ref')

    expect(opciones).not.toContain('Producto')
    expect(opciones).toContain('Proveedor')
  })

  it('con referencia elegida, el tipo no se queda en blanco: dice qué se emite', async () => {
    store.addResource('Proveedor')
    store.setFieldRef('producto', 1, 'proveedor')
    active.selectField('producto', 1)

    const fixture = mount()
    await fixture.whenStable()
    fixture.detectChanges()

    const trigger = fixture.nativeElement.querySelector('[data-testid="field-type"] button') as HTMLButtonElement
    expect(trigger.disabled).toBe(true)
    expect(selectValueLabel(fixture, 'field-type')).toContain('uuid')
  })

  it('quitar el destino devuelve el campo a un tipo normal', async () => {
    store.addResource('Proveedor')
    store.setFieldRef('producto', 1, 'proveedor')
    active.selectField('producto', 1)

    const fixture = mount()
    await chooseInSelect(fixture, 'field-ref', '— ninguna —')

    expect(store.resources()[0].fields[1].type).not.toBe('ref')
  })

  it('duplicar deja dos columnas donde había una', () => {
    active.selectField('producto', 1)
    const antes = store.resources()[0].fields.length

    const fixture = mount()
    testId(fixture, 'field-duplicate')?.click()

    expect(store.resources()[0].fields.length).toBe(antes + 1)
  })

  it('mover arriba cambia el orden de las columnas', () => {
    active.selectField('producto', 1)
    const segunda = store.resources()[0].fields[1].name

    const fixture = mount()
    testId(fixture, 'field-up')?.click()

    expect(store.resources()[0].fields[0].name).toBe(segunda)
  })

  it('la primera columna no se puede subir', () => {
    active.selectField('producto', 0)

    const fixture = mount()

    expect((testId(fixture, 'field-up') as HTMLButtonElement).disabled).toBe(true)
  })

  it('borrar la columna la quita y suelta la selección', () => {
    active.selectField('producto', 1)

    const fixture = mount()
    testId(fixture, 'field-delete')?.click()
    fixture.detectChanges()

    expect(store.resources()[0].fields).toHaveLength(1)
    expect(active.field()).toBeNull()
  })

  it('la pestaña de relación lista las flechas de la entidad y las borra', () => {
    store.addResource('Proveedor')
    store.addRelation('producto', 'proveedor')
    active.selectResource('producto')

    const fixture = mount()
    testId(fixture, 'model-tab-relation')?.click()
    fixture.detectChanges()
    expect(testId(fixture, 'relation-0')).not.toBeNull()

    testId(fixture, 'relation-delete-0')?.click()

    expect(store.resources()[0].fields.some(f => f.type === 'ref')).toBe(false)
  })
})

/**
 * Spec 43: el conmutador «Es el estado de la entidad» vive en la columna enum. Promover
 * crea la máquina vacía; quitar pide confirmación porque tira las transiciones dibujadas.
 */
describe('ModelPanelComponent — el conmutador de estado (spec 43)', () => {
  let store: DesignStore
  let active: ActiveViewService

  beforeEach(() => {
    TestBed.configureTestingModule({})
    store = TestBed.inject(DesignStore)
    active = TestBed.inject(ActiveViewService)
    store.addResource('Solicitud')
    store.updateField('solicitud', 0, { type: 'enum' })
    active.selectField('solicitud', 0)
  })

  it('una columna enum ofrece el conmutador; una de texto no', () => {
    const fixture = mount()
    expect(testId(fixture, 'field-state-toggle')).not.toBeNull()

    store.addField('solicitud')
    active.selectField('solicitud', 1)
    fixture.detectChanges()
    expect(testId(fixture, 'field-state-toggle')).toBeNull()
  })

  it('marcarlo promueve el campo: nace la máquina con su inicial', () => {
    const fixture = mount()

    ;(testId(fixture, 'field-state-toggle') as HTMLInputElement).click()
    fixture.detectChanges()

    expect(store.resources()[0].state?.field).toBe('nombre')
    expect((testId(fixture, 'field-state-toggle') as HTMLInputElement).checked).toBe(true)
  })

  it('desmarcarlo pide confirmación y, con ella, tira la máquina', () => {
    store.promoteState('solicitud', 'nombre')
    const fixture = mount()
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    ;(testId(fixture, 'field-state-toggle') as HTMLInputElement).click()
    fixture.detectChanges()

    expect(store.resources()[0].state).toBeUndefined()
  })

  it('sin confirmación la máquina se queda como estaba', () => {
    store.promoteState('solicitud', 'nombre')
    const fixture = mount()
    vi.spyOn(window, 'confirm').mockReturnValue(false)

    ;(testId(fixture, 'field-state-toggle') as HTMLInputElement).click()
    fixture.detectChanges()

    expect(store.resources()[0].state?.field).toBe('nombre')
    expect((testId(fixture, 'field-state-toggle') as HTMLInputElement).checked).toBe(true)
  })
})
