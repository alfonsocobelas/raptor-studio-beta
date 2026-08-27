import { beforeEach, describe, expect, it } from 'vitest'
import { TestBed } from '@angular/core/testing'
import { CanvasPageComponent } from './canvas-page.component'
import { DesignStore } from './design-store'

/**
 * Pulsar un bloque elige su entidad, que es lo que trae el panel derecho a su pestaña. La fila de
 * KPIs guarda `resources[]` y no `resource`, así que no elegía nada y su panel no llegaba a
 * aparecer (reportado 2026-08-27: «el componente de kpis no aparece en la columna de la derecha»).
 */
describe('CanvasPageComponent — pulsar un bloque elige su entidad', () => {
  let store: DesignStore

  const mount = () => {
    const fixture = TestBed.createComponent(CanvasPageComponent)
    fixture.componentRef.setInput('pageIndex', 0)
    fixture.detectChanges()
    return fixture
  }

  const clickBlock = (fixture: ReturnType<typeof mount>, testId: string): string | null => {
    let chosen: string | null = null
    fixture.componentInstance.select.subscribe((resource: string) => (chosen = resource))
    fixture.nativeElement.querySelector(`[data-testid="${testId}"]`)?.click()
    return chosen
  }

  beforeEach(() => {
    TestBed.configureTestingModule({})
    store = TestBed.inject(DesignStore)
    store.addPage('blank', 'Panel')
    store.addResource('Pedido')
  })

  it('la fila de KPIs elige la primera entidad que mide', () => {
    store.addBlock(0, { kind: 'kpis', resources: ['pedido'] })
    const fixture = mount()

    expect(clickBlock(fixture, 'block-kpis-0')).toBe('pedido')
  })

  it('un bloque con una sola entidad elige la suya', () => {
    store.addBlock(0, { kind: 'table', resource: 'pedido' })
    const fixture = mount()

    expect(clickBlock(fixture, 'block-table-0')).toBe('pedido')
  })

  it('un bloque de texto no elige nada: no habla de ninguna entidad', () => {
    store.addBlock(0, { kind: 'text', text: 'Hola' })
    const fixture = mount()

    expect(clickBlock(fixture, 'block-text-0')).toBeNull()
  })
})
