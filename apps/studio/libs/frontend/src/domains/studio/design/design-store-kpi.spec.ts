import { describe, expect, it } from 'vitest'
import { DesignStore } from './design-store'

/** Specs 70 y 73: las celdas de la fila de KPIs se configuran en la celda, no en la entidad. */
describe('DesignStore — celdas de la fila de KPIs', () => {
  const storeWith = (): DesignStore => {
    const store = new DesignStore()
    store.addPage('list', 'Pedidos')
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
    store.addPage('blank', 'Panel')
    store.addBlock(1, { kind: 'kpis', items: [] })
    return store
  }

  it('la fila nace vacía y aún no abre el panel: sin celdas no hay nada que emitir', () => {
    const store = storeWith()

    expect(store.pages()[1].blocks[0]).toMatchObject({ kind: 'kpis', items: [] })
    expect(store.toAppSchema().pages.some(p => p.kind === 'dashboard')).toBe(false)
  })

  it('la celda kpi nace sin condición: es el total del recurso, y ya abre el panel', () => {
    const store = storeWith()

    expect(store.addCell(1, 0, 'kpi', 'pedido')).toBe(true)
    expect(store.pages()[1].blocks[0].items?.[0]).toMatchObject({ kind: 'kpi', resource: 'pedido' })
    expect(store.toAppSchema().pages.some(p => p.kind === 'dashboard')).toBe(true)
  })

  it('la celda top-n nace con 5 filas y el primer campo numérico', () => {
    const store = storeWith()

    store.addCell(1, 0, 'top-n', 'pedido')

    expect(store.pages()[1].blocks[0].items?.[0]).toMatchObject({
      kind: 'top-n',
      topN: 5,
      topField: 'importe',
      topDir: 'desc'
    })
  })

  it('las barras nacen en el primer enum y la serie sin fecha queda incompleta', () => {
    const store = storeWith()

    store.addCell(1, 0, 'count-by', 'pedido')
    store.addCell(1, 0, 'series', 'pedido')

    expect(store.pages()[1].blocks[0].items?.[0]).toMatchObject({ kind: 'count-by', axisField: 'estado' })
    expect(store.pages()[1].blocks[0].items?.[1].axisField).toBeUndefined()
  })

  it('si el defecto choca con una celda existente, la nueva nace INCOMPLETA en vez de no nacer', () => {
    const store = storeWith()
    store.addCell(1, 0, 'top-n', 'pedido') // nace completa: importe|5|desc
    store.addBlock(1, { kind: 'kpis', items: [] })

    // el mismo defecto otra vez sería un duplicado exacto: el gesto no se bloquea,
    // la celda cae sin campo (marcada «incompleta») y se configura después
    expect(store.addCell(1, 1, 'top-n', 'pedido')).toBe(true)
    expect(store.pages()[1].blocks[1].items?.[0]).toMatchObject({ kind: 'top-n', topN: 5, topDir: 'desc' })
    expect(store.pages()[1].blocks[1].items?.[0].topField).toBeUndefined()
  })

  it('un contador duplicado no tiene versión incompleta: se rechaza y se dice por qué', () => {
    const store = storeWith()
    store.addCell(1, 0, 'counter', 'pedido')

    expect(store.addCell(1, 0, 'counter', 'pedido')).toBe(false)
    expect(store.lastError()).toContain('duplicated block')
  })

  it('rechaza una entidad que no está en el modelo', () => {
    const store = storeWith()

    expect(store.addCell(1, 0, 'counter', 'fantasma')).toBe(false)
  })

  it('la config de la celda se guarda en la celda y NO toca la entidad', () => {
    const store = storeWith()
    store.addCell(1, 0, 'kpi', 'pedido')

    const ok = store.setCellConfig(1, 0, 0, {
      kpiLabel: 'Pendientes',
      kpiConditionField: 'estado',
      kpiConditionOperator: 'eq',
      kpiConditionValue: 'pendiente',
      kpiCompare: true,
      kpiWindowField: 'creado',
      kpiWindowPreset: 'month'
    })

    expect(ok).toBe(true)
    expect(store.pages()[1].blocks[0].items?.[0]).toMatchObject({
      kpiLabel: 'Pendientes',
      kpiConditionField: 'estado',
      kpiConditionValue: 'pendiente',
      kpiCompare: true
    })
    expect(store.resources()[0]).not.toHaveProperty('kpi')
  })

  it('ratio y objetivo son excluyentes: encender uno apaga el otro', () => {
    const store = storeWith()
    store.addCell(1, 0, 'kpi', 'pedido')

    store.setCellConfig(1, 0, 0, { kpiTarget: 60 })
    store.setCellConfig(1, 0, 0, { kpiRatio: true })

    expect(store.pages()[1].blocks[0].items?.[0].kpiTarget).toBeUndefined()
    expect(store.pages()[1].blocks[0].items?.[0].kpiRatio).toBe(true)
  })

  it('apagar la ventana apaga la comparación: no hay periodo anterior de «siempre»', () => {
    const store = storeWith()
    store.addCell(1, 0, 'kpi', 'pedido')
    store.setCellConfig(1, 0, 0, { kpiWindowField: 'creado', kpiWindowPreset: 'month', kpiCompare: true })

    store.setCellConfig(1, 0, 0, { kpiWindowPreset: '' })

    expect(store.pages()[1].blocks[0].items?.[0].kpiCompare).toBeUndefined()
    expect(store.pages()[1].blocks[0].items?.[0].kpiWindowPreset).toBeUndefined()
  })

  it('los setters de celda rechazan un bloque que no es la fila de KPIs', () => {
    const store = storeWith()
    store.addBlock(1, { kind: 'table', resource: 'pedido' })

    expect(store.addCell(1, 1, 'kpi', 'pedido')).toBe(false)
    expect(store.setCellConfig(1, 1, 0, { kpiLabel: 'X' })).toBe(false)
  })
})

/** Spec 73: la fila se edita celda a celda — quitar, reordenar. */
describe('DesignStore — quitar y reordenar celdas', () => {
  const storeWith = (): DesignStore => {
    const store = new DesignStore()
    store.addPage('list', 'Pedidos')
    store.addResource('Cliente')
    store.addPage('blank', 'Panel')
    store.addBlock(1, { kind: 'kpis', items: [] })
    store.addCell(1, 0, 'counter', 'pedido')
    store.addCell(1, 0, 'counter', 'cliente')
    return store
  }

  it('quita UNA celda sin llevarse la fila', () => {
    const store = storeWith()

    expect(store.removeCell(1, 0, 0)).toBe(true)
    expect(store.pages()[1].blocks[0].items).toEqual([{ kind: 'counter', resource: 'cliente' }])
  })

  it('la fila puede quedar vacía: vuelve a ser el cuadrado con el «+»', () => {
    const store = storeWith()
    store.removeCell(1, 0, 0)

    expect(store.removeCell(1, 0, 0)).toBe(true)
    expect(store.pages()[1].blocks[0].items).toEqual([])
  })

  it('reordena las celdas', () => {
    const store = storeWith()

    expect(store.moveCell(1, 0, 0, 1)).toBe(true)
    expect(store.pages()[1].blocks[0].items?.map(cell => cell.resource)).toEqual(['cliente', 'pedido'])
  })

  it('mover fuera de rango no cambia nada', () => {
    const store = storeWith()

    store.moveCell(1, 0, 1, 2)

    expect(store.pages()[1].blocks[0].items?.map(cell => cell.resource)).toEqual(['pedido', 'cliente'])
  })
})
