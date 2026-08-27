import { beforeEach, describe, expect, it } from 'vitest'
import { TestBed } from '@angular/core/testing'
import type { DesignBlock } from '@app/shared/domain'
import { CanvasKpiComponent } from './canvas-kpi.component'
import { CanvasTopNComponent } from './canvas-top-n.component'
import { DesignStore } from './design-store'

function mount(block: DesignBlock) {
  const fixture = TestBed.createComponent(CanvasKpiComponent)
  fixture.componentRef.setInput('block', block)
  fixture.detectChanges()
  return fixture
}

/**
 * Spec 70. Montar el componente COMPILA su plantilla, que es lo único que caza un binding a un
 * input que no existe (NG8002): `npm run typecheck` no mira plantillas Angular, y sin este test
 * el build del serve se rompía y el lienzo seguía sirviendo el bundle viejo — «no se ve nada».
 */
describe('CanvasKpiComponent', () => {
  let store: DesignStore

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
  })

  const block = (extra: Partial<DesignBlock> = {}): DesignBlock => ({ kind: 'kpi', resource: 'pedido', ...extra })

  it('pinta la tarjeta con la etiqueta escrita', () => {
    const fixture = mount(block({ kpiLabel: 'Pendientes' }))

    expect(fixture.nativeElement.textContent).toContain('Pendientes')
  })

  it('sin etiqueta usa el plural de la entidad', () => {
    const fixture = mount(block())

    expect(fixture.nativeElement.textContent).toContain('Pedidos')
  })

  it('la condición se lee en palabras, con las etiquetas del modelo', () => {
    const fixture = mount(
      block({ kpiConditionField: 'estado', kpiConditionOperator: 'eq', kpiConditionValue: 'pendiente' })
    )

    expect(fixture.nativeElement.textContent).toContain('Estado es Pendiente')
  })

  it('los tres modificadores se PINTAN: variación, porcentaje y barra de progreso', () => {
    const delta = mount(block({ kpiWindowField: 'creado', kpiWindowPreset: 'month', kpiCompare: true }))
    expect(delta.nativeElement.textContent).toContain('▲')
    expect(delta.nativeElement.textContent).toContain('Este mes')

    const ratio = mount(block({ kpiRatio: true }))
    expect(ratio.nativeElement.textContent).toContain('%')

    const target = mount(block({ kpiTarget: 200 }))
    expect(target.nativeElement.textContent).toContain('de 200')
  })
})

describe('CanvasTopNComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({})
    const store = TestBed.inject(DesignStore)
    store.addResource('Pedido')
    store.addField('pedido')
    store.updateField('pedido', 1, { name: 'importe', label: 'Importe', type: 'number' })
  })

  it('pinta la lista corta y dice por qué campo ordena', () => {
    const fixture = TestBed.createComponent(CanvasTopNComponent)
    fixture.componentRef.setInput('block', { kind: 'top-n', resource: 'pedido', topField: 'importe', topN: 3 })
    fixture.detectChanges()

    expect(fixture.nativeElement.textContent).toContain('Top 3')
    expect(fixture.nativeElement.textContent).toContain('Importe')
  })

  it('sin campo de orden lo dice, en vez de pintar una lista vacía', () => {
    const fixture = TestBed.createComponent(CanvasTopNComponent)
    fixture.componentRef.setInput('block', { kind: 'top-n', resource: 'pedido' })
    fixture.detectChanges()

    expect(fixture.nativeElement.textContent).toContain('Elige el campo por el que ordenar')
  })
})
