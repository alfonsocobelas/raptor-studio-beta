import { APPS, selectApp } from './registry'
import { MODELS } from '../../resource/models/registry'
import { composeApp } from '../composition'

describe('app registry', () => {
  it('registers frozen, validated app definitions', () => {
    for (const [name, app] of Object.entries(APPS)) {
      expect(app.name).toBe(name)
      expect(Object.isFrozen(app)).toBe(true)
    }
  })

  it('every registered app composes against the model registry', () => {
    for (const app of Object.values(APPS)) {
      expect(() => composeApp(app, MODELS)).not.toThrow()
    }
  })

  it('selectApp returns the app by name', () => {
    expect(selectApp('demo')).toBe(APPS['demo'])
  })

  it('selectApp rejects an unknown app listing the available ones', () => {
    expect(() => selectApp('nope')).toThrow(`Unknown app 'nope'. Available apps: ${Object.keys(APPS).join(', ')}`)
  })
})

/**
 * TASK-02 (spec 76): la app del gate de oro MONGO. Espejo del feature-set de `golden`
 * (kpi-row, medidas, series, kanban, flujo con transición) sobre los modelos que el motor
 * mongo puede honrar: sin project (lleva adjuntos, que mongo rechaza antes de emitir).
 */
describe('golden-mongo app', () => {
  it('compone solo modelos que mongo puede emitir: customer, contract y license', () => {
    const composition = composeApp(selectApp('golden-mongo'), MODELS)

    expect(composition.models.map(m => m.name).sort()).toEqual(['contract', 'customer', 'license'])
    expect(composition.models.some(m => m.attachments)).toBe(false)
  })

  it('el dashboard ejercita los bloques de las specs 70-73: kpi-row, medidas y series', () => {
    const app = selectApp('golden-mongo')
    const dashboard = app.pages.find(p => p.kind === 'dashboard')
    // la fila mixta (spec 73) vive en el schema; composeApp la normaliza en celdas
    expect(dashboard && 'blocks' in dashboard && dashboard.blocks?.some(b => b.kind === 'kpi-row')).toBe(true)

    const composition = composeApp(app, MODELS)
    const kinds = composition.dashboardBlocks.map(b => b.kind)

    expect(kinds).toContain('metrics')
    expect(kinds).toContain('top-n')
    expect(kinds).toContain('series')
    expect(kinds).toContain('table')
    // medidas reales del endpoint aggregate (71) y agregación agrupada (72)
    expect(composition.dashboardBlocks.some(b => b.kind === 'kpi' && b.kpi?.measure === 'sum')).toBe(true)
    expect(composition.dashboardBlocks.some(b => b.kind === 'count-by' && b.measure === 'sum')).toBe(true)
  })

  it('lleva brief y un flujo con paso de transición (el proceso también pasa por mongo)', () => {
    const app = selectApp('golden-mongo')

    expect(app.brief?.business).toBeTruthy()
    const nodes = (app.flows ?? []).flatMap(f => f.nodes)
    expect(nodes.some(n => n.kind === 'step' && n.transition === 'terminate')).toBe(true)
  })
})

describe('demo app', () => {
  it('mirrors the canonical flat composition: dashboard + the four golden resources', () => {
    const composition = composeApp(selectApp('demo'), MODELS)

    expect(composition.dashboard).toBe(true)
    expect(composition.models.map(m => m.name)).toEqual(['customer', 'contract', 'license', 'project'])
    expect(composition.dashboardBlocks).toEqual([
      { kind: 'metrics', width: 'full', models: composition.models }
    ])
  })
})
