import { beforeEach, describe, expect, it } from 'vitest'
import { TestBed } from '@angular/core/testing'
import { ActiveViewService } from './active-view.service'
import { CanvasKpiRowComponent } from './canvas-kpi-row.component'
import { CanvasNoticeService } from './canvas-notice.service'
import { DesignStore } from './design-store'

/** Spec 73: el «+» de la fila añade celdas de los cinco tipos, pulsándolo de verdad. */
describe('CanvasKpiRowComponent — el cuadrado «+»', () => {
  let store: DesignStore

  const mount = () => {
    const fixture = TestBed.createComponent(CanvasKpiRowComponent)
    fixture.componentRef.setInput('pageIndex', 0)
    fixture.componentRef.setInput('blockIndex', 0)
    fixture.componentRef.setInput('block', store.pages()[0].blocks[0])
    fixture.detectChanges()
    return fixture
  }

  const testId = (fixture: ReturnType<typeof mount>, id: string): HTMLElement | null =>
    fixture.nativeElement.querySelector(`[data-testid="${id}"]`)

  const addVia = (fixture: ReturnType<typeof mount>, kind: string): void => {
    testId(fixture, 'kpi-row-add')?.click()
    fixture.detectChanges()
    testId(fixture, `kpi-row-add-${kind}`)?.click()
    // el bloque llega por input: en la app lo re-emite el store; aquí se refresca a mano
    fixture.componentRef.setInput('block', store.pages()[0].blocks[0])
    fixture.detectChanges()
  }

  beforeEach(() => {
    TestBed.configureTestingModule({})
    store = TestBed.inject(DesignStore)
    store.addPage('blank', 'Panel')
    store.addResource('Pedido')
    store.addBlock(0, { kind: 'kpis', items: [] })
  })

  it('el menú ofrece los cinco tipos de celda', () => {
    const fixture = mount()

    testId(fixture, 'kpi-row-add')?.click()
    fixture.detectChanges()

    for (const kind of ['counter', 'kpi', 'top-n', 'count-by', 'series']) {
      expect(testId(fixture, `kpi-row-add-${kind}`), kind).not.toBeNull()
    }
  })

  it('cada opción del menú añade su celda a la fila', () => {
    const fixture = mount()

    for (const kind of ['counter', 'kpi', 'top-n', 'count-by', 'series']) {
      addVia(fixture, kind)
    }

    expect(store.pages()[0].blocks[0].items?.map(cell => cell.kind)).toEqual([
      'counter',
      'kpi',
      'top-n',
      'count-by',
      'series'
    ])
  })

  it('las celdas añadidas se PINTAN: contador, kpi, top-n y las dos gráficas', () => {
    const fixture = mount()
    for (const kind of ['counter', 'kpi', 'top-n', 'count-by', 'series']) {
      addVia(fixture, kind)
    }

    expect(testId(fixture, 'kpi-pedido')).not.toBeNull()
    expect(testId(fixture, 'canvas-kpi')).not.toBeNull()
    expect(testId(fixture, 'canvas-top-n')).not.toBeNull()
    expect(testId(fixture, 'canvas-count-by')).not.toBeNull()
    expect(testId(fixture, 'canvas-series')).not.toBeNull()
  })

  it('con VARIAS entidades, elegir el tipo pide después la entidad (spec 73, seguimiento)', () => {
    store.addResource('Cliente')
    const fixture = mount()

    testId(fixture, 'kpi-row-add')?.click()
    fixture.detectChanges()
    testId(fixture, 'kpi-row-add-top-n')?.click()
    fixture.detectChanges()

    // segundo paso: una opción por entidad, nada añadido todavía
    expect(store.pages()[0].blocks[0].items).toEqual([])
    expect(testId(fixture, 'kpi-row-entity-pedido')).not.toBeNull()
    expect(testId(fixture, 'kpi-row-entity-cliente')).not.toBeNull()

    testId(fixture, 'kpi-row-entity-cliente')?.click()

    expect(store.pages()[0].blocks[0].items).toMatchObject([{ kind: 'top-n', resource: 'cliente' }])
  })

  it('con UNA sola entidad no hay nada que preguntar: el tipo añade directo', () => {
    const fixture = mount()

    testId(fixture, 'kpi-row-add')?.click()
    fixture.detectChanges()
    testId(fixture, 'kpi-row-add-counter')?.click()

    expect(store.pages()[0].blocks[0].items).toEqual([{ kind: 'counter', resource: 'pedido' }])
  })

  it('pulsar una celda elige SU entidad: es lo que trae su panel de config a la derecha', () => {
    store.addResource('Cliente')
    store.addCell(0, 0, 'counter', 'pedido')
    store.addCell(0, 0, 'top-n', 'cliente')
    const fixture = mount()

    testId(fixture, 'kpi-cell-top-n-1')?.click()

    expect(TestBed.inject(ActiveViewService).resource()).toBe('cliente')
  })

  it('cuando el gate rechaza la celda, se dice por qué y en cristiano', () => {
    const fixture = mount()

    addVia(fixture, 'kpi')
    addVia(fixture, 'kpi') // una celda kpi idéntica a otra no pasa el gate

    expect(store.pages()[0].blocks[0].items).toHaveLength(1)
    expect(TestBed.inject(CanvasNoticeService).notice()?.text).toContain('misma configuración')
  })
})
