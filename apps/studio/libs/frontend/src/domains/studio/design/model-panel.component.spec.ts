import { beforeEach, describe, expect, it } from 'vitest'
import { TestBed } from '@angular/core/testing'
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

  it('cambiar el tipo de la columna lo escribe en el diseño', () => {
    active.selectField('producto', 1)

    const fixture = mount()
    const select = testId(fixture, 'field-type') as HTMLSelectElement
    select.value = 'date'
    select.dispatchEvent(new Event('change'))

    expect(store.resources()[0].fields[1].type).toBe('date')
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
