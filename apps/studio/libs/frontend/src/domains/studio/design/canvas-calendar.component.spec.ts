import { beforeEach, describe, expect, it } from 'vitest'
import { TestBed } from '@angular/core/testing'
import type { DesignBlock } from '@app/shared/domain'
import { CanvasCalendarComponent } from './canvas-calendar.component'
import { DesignStore } from './design-store'

function mount(block: DesignBlock) {
  const fixture = TestBed.createComponent(CanvasCalendarComponent)
  fixture.componentRef.setInput('block', block)
  fixture.detectChanges()
  return fixture
}

/** Spec 59 (mock 22E): mini-mes con tiras de muestra, fiel a la captura. */
describe('CanvasCalendarComponent', () => {
  let store: DesignStore

  beforeEach(() => {
    TestBed.configureTestingModule({})
    store = TestBed.inject(DesignStore)
    store.addResource('Pedido')
    store.addField('pedido')
    store.updateField('pedido', 1, { name: 'entrega', label: 'Entrega', type: 'date' })
  })

  const block = (extra: Partial<DesignBlock> = {}): DesignBlock => ({
    kind: 'calendar',
    resource: 'pedido',
    dateField: 'entrega',
    ...extra
  })

  it('pinta la semana completa de cabecera', () => {
    const fixture = mount(block())
    const text = (fixture.nativeElement as HTMLElement).textContent ?? ''

    for (const day of ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM']) {
      expect(text).toContain(day)
    }
  })

  it('sin fin de semana la cabecera queda en cinco días', () => {
    const fixture = mount(block({ weekends: false }))
    const text = (fixture.nativeElement as HTMLElement).textContent ?? ''

    expect(text).toContain('VIE')
    expect(text).not.toContain('SÁB')
  })

  it('reparte tiras de muestra por la rejilla', () => {
    const fixture = mount(block())
    const strips = (fixture.nativeElement as HTMLElement).querySelectorAll('[data-testid^="calendar-strip-"]')

    expect(strips.length).toBeGreaterThan(2)
  })

  it('el pie nombra la entidad y el campo fecha, como el mock', () => {
    const fixture = mount(block())
    const text = (fixture.nativeElement as HTMLElement).textContent ?? ''

    expect(text).toContain('Pedidos')
    expect(text).toContain('campo fecha Entrega')
  })
})
