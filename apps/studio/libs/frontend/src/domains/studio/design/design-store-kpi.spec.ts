import { describe, expect, it } from 'vitest'
import { DesignStore } from './design-store'

/** Spec 70: la tarjeta KPI y el Top N se configuran en el bloque, no en la entidad. */
describe('DesignStore — bloques kpi y top-n (spec 70)', () => {
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
    return store
  }

  it('el kpi nace sin condición: es el total del recurso, y ya es un diseño válido', () => {
    const store = storeWith()

    store.addBlock(1, { kind: 'kpi', resource: 'pedido' })

    expect(store.pages()[1].blocks[0]).toMatchObject({ kind: 'kpi', resource: 'pedido' })
    expect(store.toAppSchema().pages.some(p => p.kind === 'dashboard')).toBe(true)
  })

  it('el top-n nace con 5 filas y el primer campo numérico', () => {
    const store = storeWith()

    store.addBlock(1, { kind: 'top-n', resource: 'pedido' })

    expect(store.pages()[1].blocks[0]).toMatchObject({ kind: 'top-n', topN: 5, topField: 'importe', topDir: 'desc' })
  })

  it('la config del kpi se guarda en el bloque y NO toca la entidad', () => {
    const store = storeWith()
    store.addBlock(1, { kind: 'kpi', resource: 'pedido' })

    const ok = store.setKpiConfig(1, 0, {
      kpiLabel: 'Pendientes',
      kpiConditionField: 'estado',
      kpiConditionOperator: 'eq',
      kpiConditionValue: 'pendiente',
      kpiCompare: true,
      kpiWindowField: 'creado',
      kpiWindowPreset: 'month'
    })

    expect(ok).toBe(true)
    expect(store.pages()[1].blocks[0]).toMatchObject({
      kpiLabel: 'Pendientes',
      kpiConditionField: 'estado',
      kpiConditionValue: 'pendiente',
      kpiCompare: true
    })
    expect(store.resources()[0]).not.toHaveProperty('kpi')
  })

  it('ratio y objetivo son excluyentes: encender uno apaga el otro', () => {
    const store = storeWith()
    store.addBlock(1, { kind: 'kpi', resource: 'pedido' })

    store.setKpiConfig(1, 0, { kpiTarget: 60 })
    store.setKpiConfig(1, 0, { kpiRatio: true })

    expect(store.pages()[1].blocks[0].kpiTarget).toBeUndefined()
    expect(store.pages()[1].blocks[0].kpiRatio).toBe(true)
  })

  it('apagar la ventana apaga la comparación: no hay periodo anterior de «siempre»', () => {
    const store = storeWith()
    store.addBlock(1, { kind: 'kpi', resource: 'pedido' })
    store.setKpiConfig(1, 0, { kpiWindowField: 'creado', kpiWindowPreset: 'month', kpiCompare: true })

    store.setKpiConfig(1, 0, { kpiWindowPreset: '' })

    expect(store.pages()[1].blocks[0].kpiCompare).toBeUndefined()
    expect(store.pages()[1].blocks[0].kpiWindowPreset).toBeUndefined()
  })

  it('el setter rechaza un bloque que no es kpi ni top-n', () => {
    const store = storeWith()
    store.addBlock(1, { kind: 'table', resource: 'pedido' })

    expect(store.setKpiConfig(1, 0, { kpiLabel: 'X' })).toBe(false)
  })
})
