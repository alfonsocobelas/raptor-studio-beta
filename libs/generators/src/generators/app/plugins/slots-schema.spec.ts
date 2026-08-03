import { readFileSync } from 'fs'
import * as path from 'path'
import { SLOTS } from './slots'
import { PLUGINS } from './registry'

interface SchemaProperty {
  type: string
  description?: string
  default?: string
  enum?: string[]
  /** Texto libre (pregunta abierta) o formulario de lista */
  'x-prompt'?: string | { message: string; type: string; items: { value: string; label: string }[] }
}

/**
 * TASK-04 (spec 23): el formulario del CLI (`schema.json`, que lee Nx) no puede
 * derivarse en runtime del registro, así que se escribe a mano — y este test impide
 * que se desincronice: mismos proveedores, mismo orden, mismos defaults y etiquetas.
 */
describe('app/schema.json frente al registro de ranuras', () => {
  const schema = JSON.parse(
    readFileSync(path.join(__dirname, '..', 'schema.json'), 'utf-8')
  ) as { properties: Record<string, SchemaProperty> }

  const choosableSlots = Object.values(SLOTS).filter(slot => slot.providers.length > 1)

  it('expone un flag por ranura con más de un proveedor', () => {
    for (const slot of choosableSlots) {
      expect(schema.properties[slot.name]).toBeDefined()
    }
  })

  it('no expone ranuras con un solo proveedor (no hay nada que elegir)', () => {
    for (const slot of Object.values(SLOTS)) {
      if (slot.providers.length === 1) {
        expect(schema.properties[slot.name]).toBeUndefined()
      }
    }
  })

  it('cada flag declara enum, default y etiquetas idénticos a los del registro', () => {
    for (const slot of choosableSlots) {
      const property = schema.properties[slot.name]
      const prompt = property['x-prompt']

      expect(property.default).toBe(slot.default)
      expect(property.enum).toEqual(slot.providers.map(p => p.value))
      expect(typeof prompt === 'string' ? undefined : prompt?.items).toEqual(
        slot.providers.map(p => ({ value: p.value, label: p.label }))
      )
    }
  })

  it('el x-prompt de plugins ofrece exactamente los aditivos registrados', () => {
    // la lista que lee el usuario, extraída del paréntesis: "(email, observability — separados…)"
    const prompt = schema.properties['plugins']['x-prompt']
    const offered = (typeof prompt === 'string' ? prompt : '')
      .match(/\(([^—)]+)/)?.[1]
      ?.split(',')
      .map(name => name.trim())

    expect(offered).toEqual(Object.keys(PLUGINS))
  })
})
