import { beforeEach, describe, expect, it } from 'vitest'
import { TestBed } from '@angular/core/testing'
import type { DesignBlock } from '@app/shared/domain'
import { CanvasChartComponent } from './canvas-chart.component'
import { DesignStore } from './design-store'

/** Spec 72: barras y evolución en el lienzo. Montar compila la plantilla (lección de la 70). */
describe('CanvasChartComponent', () => {
  let store: DesignStore

  const mount = (block: DesignBlock) => {
    const fixture = TestBed.createComponent(CanvasChartComponent)
    fixture.componentRef.setInput('block', block)
    fixture.detectChanges()
    return fixture
  }

  beforeEach(() => {
    TestBed.configureTestingModule({})
    store = TestBed.inject(DesignStore)
    store.addResource('Pedido')
    store.addField('pedido')
    store.updateField('pedido', 1, {
      name: 'estado',
      label: 'Estado',
      type: 'enum',
      values: [
        { value: 'pendiente', label: 'Pendiente' },
        { value: 'entregado', label: 'Entregado' }
      ]
    })
    store.addField('pedido')
    store.updateField('pedido', 2, { name: 'importe', label: 'Importe', type: 'number' })
  })

  it('las barras pintan una por valor del enum', () => {
    const fixture = mount({ kind: 'count-by', resource: 'pedido', axisField: 'estado' })

    expect(fixture.nativeElement.textContent).toContain('Pendiente')
    expect(fixture.nativeElement.textContent).toContain('Entregado')
  })

  it('sin eje lo dice, en vez de pintar un gráfico vacío', () => {
    const fixture = mount({ kind: 'count-by', resource: 'pedido' })

    expect(fixture.nativeElement.textContent).toContain('valores cerrados')
  })

  it('con medida el pie dice qué enseña, no «pedidos»', () => {
    const fixture = mount({
      kind: 'count-by',
      resource: 'pedido',
      axisField: 'estado',
      measure: 'sum',
      measureField: 'importe'
    })

    expect(fixture.nativeElement.textContent).toContain('suma de Importe')
  })

  it('la evolución pinta doce columnas', () => {
    const fixture = mount({ kind: 'series', resource: 'pedido', axisField: 'creado' })

    expect(fixture.nativeElement.textContent).toContain('últimos 12 meses')
  })
})
