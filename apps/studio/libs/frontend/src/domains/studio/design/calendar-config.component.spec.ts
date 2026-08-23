import { beforeEach, describe, expect, it } from 'vitest'
import { TestBed } from '@angular/core/testing'
import { chooseInSelect, selectValueLabel } from '../../../shared/components/ui/select.harness'
import { ActiveViewService } from './active-view.service'
import { CalendarConfigComponent } from './calendar-config.component'
import { DesignStore } from './design-store'

function mount(resource: string | null = 'pedido') {
  const fixture = TestBed.createComponent(CalendarConfigComponent)
  fixture.componentRef.setInput('resource', resource)
  fixture.detectChanges()
  return fixture
}

/** Spec 59 (mock 22E): Fecha / Etiqueta / Color de la tira / Fin de semana. */
describe('CalendarConfigComponent', () => {
  let store: DesignStore
  let active: ActiveViewService

  beforeEach(() => {
    TestBed.configureTestingModule({})
    store = TestBed.inject(DesignStore)
    active = TestBed.inject(ActiveViewService)
    store.addPage('list', 'Pedidos')
    store.addField('pedido')
    store.updateField('pedido', 1, { name: 'entrega', label: 'Entrega', type: 'date' })
    store.addField('pedido')
    store.updateField('pedido', 2, {
      name: 'estado',
      label: 'Estado',
      type: 'enum',
      values: [
        { value: 'prevista', label: 'Entrega prevista' },
        { value: 'atencion', label: 'Requiere atención' }
      ]
    })
    store.addPage('blank', 'Entregas')
    store.addBlock(1, { kind: 'calendar', resource: 'pedido' })
    active.select(1)
    active.selectResource('pedido')
  })

  it('sin bloque calendario en la vista activa no pinta nada', () => {
    active.select(0)
    const fixture = mount()

    expect((fixture.nativeElement as HTMLElement).textContent?.trim()).toBe('')
  })

  it('propone el campo fecha del bloque', async () => {
    const fixture = mount()
    await fixture.whenStable()
    fixture.detectChanges()

    expect(selectValueLabel(fixture, 'calendar-date')).toBe('Entrega')
  })

  it('elegir la etiqueta la replica en la entidad', async () => {
    const fixture = mount()

    await chooseInSelect(fixture, 'calendar-label', 'Nombre')

    expect(store.resources()[0].calendar).toMatchObject({ labelField: 'nombre' })
  })

  it('elegir el color por enum enciende la leyenda con sus valores', async () => {
    const fixture = mount()

    await chooseInSelect(fixture, 'calendar-color', 'Estado')

    expect(store.resources()[0].calendar).toMatchObject({ colorField: 'estado' })
    const text = (fixture.nativeElement as HTMLElement).textContent ?? ''
    expect(text).toContain('Entrega prevista')
    expect(text).toContain('Requiere atención')
  })

  it('apagar el fin de semana viaja al bloque y a la entidad', () => {
    const fixture = mount()
    const toggle = (fixture.nativeElement as HTMLElement).querySelector(
      '[data-testid="calendar-weekends"]'
    ) as HTMLInputElement

    toggle.click()
    fixture.detectChanges()

    expect(store.pages()[1].blocks[0].weekends).toBe(false)
    expect(store.resources()[0].calendar).toMatchObject({ weekends: false })
  })
})
