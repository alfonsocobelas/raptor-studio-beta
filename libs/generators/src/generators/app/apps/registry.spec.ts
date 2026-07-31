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

describe('demo app', () => {
  it('mirrors the canonical flat composition: dashboard + the four golden resources', () => {
    const composition = composeApp(selectApp('demo'), MODELS)

    expect(composition.dashboard).toBe(true)
    expect(composition.models.map(m => m.name)).toEqual(['customer', 'contract', 'license', 'project'])
    expect(composition.kpiModels.map(m => m.name)).toEqual(['customer', 'contract', 'license', 'project'])
  })
})
