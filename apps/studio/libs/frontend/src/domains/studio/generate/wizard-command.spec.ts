import { describe, expect, it } from 'vitest'
import type { AppDefinition } from '@acc/schema'
import { buildAppFile, buildCommand, type WizardOptions } from './wizard-command'

const definition: AppDefinition = {
  schemaVersion: 1,
  name: 'boutique',
  pages: [{ kind: 'resource', resource: 'garment' }]
}

const options: WizardOptions = {
  name: 'tienda-sur',
  ui: 'material',
  database: 'mongo',
  plugins: ['auth', 'email']
}

describe('buildAppFile', () => {
  it('reescribe el name del schema al elegido en el wizard', () => {
    const file = buildAppFile(definition, 'tienda-sur')

    expect(JSON.parse(file.content)).toMatchObject({ name: 'tienda-sur', schemaVersion: 1 })
    expect(file.filename).toBe('tienda-sur.app.json')
  })
})

describe('buildCommand', () => {
  it('monta el comando completo con todas las opciones', () => {
    const command = buildCommand(options)

    expect(command).toBe(
      'npx nx g @acc/generators:app tienda-sur --appFile=tienda-sur.app.json --ui=material --database=mongo --plugins=auth,email'
    )
  })

  it('sin plugins emite plugins=none', () => {
    expect(buildCommand({ ...options, plugins: [] })).toContain('--plugins=none')
  })
})
