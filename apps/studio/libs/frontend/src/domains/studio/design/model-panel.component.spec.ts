import { beforeEach, describe, expect, it } from 'vitest'
import { TestBed } from '@angular/core/testing'
import { chooseInSelect, openSelect, selectValueLabel } from '../../../shared/components/ui/select.harness'
import { ActiveViewService } from './active-view.service'
import { DesignStore } from './design-store'
import { LifecycleUiService } from './lifecycle-ui.service'
import { ModelPanelComponent } from './model-panel.component'

function mount() {
  const fixture = TestBed.createComponent(ModelPanelComponent)
  fixture.detectChanges()
  return fixture
}

function testId(fixture: ReturnType<typeof mount>, id: string): HTMLElement | null {
  return fixture.nativeElement.querySelector(`[data-testid="${id}"]`)
}

/** El diálogo de confirmación se monta en un portal: sus botones se buscan en el documento. */
function dialogButton(kind: 'action' | 'cancel'): HTMLButtonElement | null {
  return document.querySelector(`button[hlmalertdialog${kind}]`)
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
 * Los valores del enum se editan donde se edita el campo: hasta ahora solo existían en el
 * popover de columna de Vistas y convertir un campo a enum desde Modelo dejaba los tres
 * placeholders sin forma de cambiarlos. Misma regla que Vistas: el label manda y el value
 * se deriva como slug.
 */
describe('ModelPanelComponent — editor de valores del enum', () => {
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

  function labelInput(fixture: ReturnType<typeof mount>, index: number): HTMLInputElement {
    return testId(fixture, `enum-value-label-${index}`) as HTMLInputElement
  }

  function commit(input: HTMLInputElement, text: string): void {
    input.value = text
    input.dispatchEvent(new Event('change'))
  }

  it('una columna enum lista sus valores; una de texto no', () => {
    const fixture = mount()
    expect(labelInput(fixture, 0).value).toBe('Pendiente')
    expect(labelInput(fixture, 2).value).toBe('Cerrado')

    store.addField('solicitud')
    active.selectField('solicitud', 1)
    fixture.detectChanges()
    expect(testId(fixture, 'enum-value-label-0')).toBeNull()
  })

  it('renombrar un valor escribe la etiqueta y deriva el value como slug', () => {
    const fixture = mount()

    commit(labelInput(fixture, 1), 'En taller')

    expect(store.resources()[0].fields[0].values?.[1]).toEqual({ value: 'en_taller', label: 'En taller' })
  })

  it('añadir agrega un valor nuevo al final', () => {
    const fixture = mount()

    testId(fixture, 'enum-value-add')?.click()
    fixture.detectChanges()

    const values = store.resources()[0].fields[0].values ?? []
    expect(values).toHaveLength(4)
    expect(labelInput(fixture, 3).value).toBe(values[3].label)
  })

  it('añadir dos veces no fabrica dos valores con el mismo slug', () => {
    const fixture = mount()

    testId(fixture, 'enum-value-add')?.click()
    fixture.detectChanges()
    testId(fixture, 'enum-value-add')?.click()

    const values = store.resources()[0].fields[0].values ?? []
    expect(new Set(values.map(v => v.value)).size).toBe(values.length)
  })

  it('borrar un valor lo quita de la lista', () => {
    const fixture = mount()

    testId(fixture, 'enum-value-delete-1')?.click()

    expect(store.resources()[0].fields[0].values?.map(v => v.label)).toEqual(['Pendiente', 'Cerrado'])
  })

  it('el último valor no se puede borrar: un enum sin valores rompe el ciclo de vida', () => {
    const fixture = mount()
    testId(fixture, 'enum-value-delete-0')?.click()
    fixture.detectChanges()
    testId(fixture, 'enum-value-delete-0')?.click()
    fixture.detectChanges()

    expect(store.resources()[0].fields[0].values).toHaveLength(1)
    expect((testId(fixture, 'enum-value-delete-0') as HTMLButtonElement).disabled).toBe(true)
  })

  it('subir un valor cambia el orden (y con él, el del diagrama de estados)', () => {
    const fixture = mount()

    testId(fixture, 'enum-value-up-1')?.click()

    expect(store.resources()[0].fields[0].values?.map(v => v.label)).toEqual(['En curso', 'Pendiente', 'Cerrado'])
  })

  it('el primero no sube y el último no baja', () => {
    const fixture = mount()

    expect((testId(fixture, 'enum-value-up-0') as HTMLButtonElement).disabled).toBe(true)
    expect((testId(fixture, 'enum-value-down-2') as HTMLButtonElement).disabled).toBe(true)
  })

  it('un label que produce el mismo slug que otro valor no se aplica', () => {
    const fixture = mount()

    commit(labelInput(fixture, 1), 'Cerrado')

    expect(store.resources()[0].fields[0].values?.map(v => v.value)).toEqual(['pendiente', 'en_curso', 'cerrado'])
    expect(labelInput(fixture, 1).value).toBe('En curso')
  })

  it('un label vacío no se aplica', () => {
    const fixture = mount()

    commit(labelInput(fixture, 1), '   ')

    expect(store.resources()[0].fields[0].values?.map(v => v.label)).toEqual(['Pendiente', 'En curso', 'Cerrado'])
    expect(labelInput(fixture, 1).value).toBe('En curso')
  })
})

/**
 * La card del ciclo de vida vive en la pestaña Entidad: el ciclo es una propiedad de la
 * entidad y el panel derecho es donde se editan las propiedades de la selección. Desde
 * aquí se abre la sub-vista del lienzo (vía LifecycleUiService).
 */
describe('ModelPanelComponent — la card del ciclo de vida (pestaña Entidad)', () => {
  let store: DesignStore
  let active: ActiveViewService
  let lifecycle: LifecycleUiService

  beforeEach(() => {
    TestBed.configureTestingModule({})
    store = TestBed.inject(DesignStore)
    active = TestBed.inject(ActiveViewService)
    lifecycle = TestBed.inject(LifecycleUiService)
    store.addResource('Solicitud')
    store.updateField('solicitud', 0, { type: 'enum' })
    active.selectResource('solicitud')
  })

  function openEntityTab(fixture: ReturnType<typeof mount>): void {
    testId(fixture, 'model-tab-entity')?.click()
    fixture.detectChanges()
  }

  it('con máquina, la card resume estados y transiciones y «Editar» abre la sub-vista', () => {
    store.promoteState('solicitud', 'nombre')

    const fixture = mount()
    openEntityTab(fixture)

    const summary = testId(fixture, 'lifecycle-summary')
    expect(summary).not.toBeNull()
    expect(summary?.textContent).toContain('3 estados')
    expect(summary?.textContent).toContain('0 transiciones')

    testId(fixture, 'lifecycle-edit')?.click()
    expect(lifecycle.open()).toBe(true)
  })

  it('sin máquina pero con un enum, la card ofrece definir el ciclo y lo abre', () => {
    const fixture = mount()
    openEntityTab(fixture)
    expect(testId(fixture, 'lifecycle-summary')).toBeNull()

    testId(fixture, 'lifecycle-define')?.click()

    expect(store.resources()[0].state?.field).toBe('nombre')
    expect(lifecycle.open()).toBe(true)
  })

  it('sin ningún enum no hay card', () => {
    store.updateField('solicitud', 0, { type: 'string' })

    const fixture = mount()
    openEntityTab(fixture)

    expect(testId(fixture, 'lifecycle-summary')).toBeNull()
    expect(testId(fixture, 'lifecycle-define')).toBeNull()
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

  it('desmarcarlo abre el diálogo de la app y, con la confirmación, tira la máquina', () => {
    store.promoteState('solicitud', 'nombre')
    const fixture = mount()

    ;(testId(fixture, 'field-state-toggle') as HTMLInputElement).click()
    fixture.detectChanges()

    dialogButton('action')?.click()
    fixture.detectChanges()

    expect(store.resources()[0].state).toBeUndefined()
  })

  it('sin confirmación la máquina se queda como estaba, con el checkbox marcado', async () => {
    store.promoteState('solicitud', 'nombre')
    const fixture = mount()

    ;(testId(fixture, 'field-state-toggle') as HTMLInputElement).click()
    fixture.detectChanges()

    dialogButton('cancel')?.click()
    fixture.detectChanges()
    await fixture.whenStable()

    expect(store.resources()[0].state?.field).toBe('nombre')
    expect((testId(fixture, 'field-state-toggle') as HTMLInputElement).checked).toBe(true)
  })
})

/**
 * Borrar la entidad vive en la pestaña Entidad: pide confirmación (arrastra bloques
 * y relaciones entrantes) y al hacerlo deja de haber entidad elegida.
 */
describe('ModelPanelComponent — borrar la entidad', () => {
  let store: DesignStore
  let active: ActiveViewService

  beforeEach(() => {
    TestBed.configureTestingModule({})
    store = TestBed.inject(DesignStore)
    active = TestBed.inject(ActiveViewService)
    store.addResource('Producto')
    active.selectResource('producto')
  })

  function openEntityTab(fixture: ReturnType<typeof mount>): void {
    testId(fixture, 'model-tab-entity')?.click()
    fixture.detectChanges()
  }

  it('el botón abre el diálogo de la app y, confirmado, borra la entidad y suelta la selección', () => {
    const fixture = mount()
    openEntityTab(fixture)

    testId(fixture, 'entity-delete')?.click()
    fixture.detectChanges()

    dialogButton('action')?.click()
    fixture.detectChanges()

    expect(store.resources()).toEqual([])
    expect(active.resource()).toBeNull()
    expect(testId(fixture, 'entity-empty')).not.toBeNull()
  })

  it('sin confirmación no se toca nada', async () => {
    const fixture = mount()
    openEntityTab(fixture)
    expect(testId(fixture, 'entity-delete')).not.toBeNull()

    testId(fixture, 'entity-delete')?.click()
    fixture.detectChanges()

    dialogButton('cancel')?.click()
    fixture.detectChanges()
    await fixture.whenStable()

    expect(store.resources().map(r => r.name)).toEqual(['producto'])
    expect(active.resource()).toBe('producto')
    expect(dialogButton('action')).toBeNull()
  })
})
