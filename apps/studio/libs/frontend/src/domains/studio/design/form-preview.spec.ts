import { describe, expect, it } from 'vitest'
import type { DraftField, DraftResource } from '@app/shared/domain'
import { formControlFor, formDialogDescription, formDialogTitle } from './form-preview'

function resource(overrides: Partial<DraftResource> = {}): DraftResource {
  return {
    name: 'muestra',
    plural: 'muestras',
    labelSingular: 'Muestra',
    labelPlural: 'Muestras',
    gender: 'f',
    fields: [],
    ...overrides
  }
}

function field(type: DraftField['type']): DraftField {
  return { name: 'campo', label: 'Campo', type }
}

describe('formDialogTitle', () => {
  // GIVEN/WHEN/THEN: misma fórmula que build-substitutions (createLabel / dialogEditTitle)
  it('en alta concuerda el género como el generador', () => {
    expect(formDialogTitle(resource(), 'create')).toBe('Nueva muestra')
    expect(formDialogTitle(resource({ gender: 'm', labelSingular: 'Cliente' }), 'create')).toBe('Nuevo cliente')
  })

  it('en edición antepone Editar al singular en minúsculas', () => {
    expect(formDialogTitle(resource(), 'edit')).toBe('Editar muestra')
    expect(formDialogTitle(resource({ gender: 'm', labelSingular: 'Cliente' }), 'edit')).toBe('Editar cliente')
  })
})

describe('formDialogDescription', () => {
  it('en alta usa la fórmula del generador con género', () => {
    expect(formDialogDescription(resource(), 'create')).toBe('Introduce los datos de la nueva muestra')
    expect(formDialogDescription(resource({ gender: 'm', labelSingular: 'Cliente' }), 'create')).toBe(
      'Introduce los datos del nuevo cliente'
    )
  })

  it('en edición usa la fórmula del generador con género', () => {
    expect(formDialogDescription(resource(), 'edit')).toBe('Modifica los datos de la muestra')
    expect(formDialogDescription(resource({ gender: 'm', labelSingular: 'Cliente' }), 'edit')).toBe(
      'Modifica los datos del cliente'
    )
  })
})

describe('formControlFor', () => {
  // el vocabulario de controles es el del generador: text|textarea|select|date|checkbox|number
  it.each([
    ['string', 'text'],
    ['uuid', 'text'],
    ['text', 'textarea'],
    ['number', 'number'],
    ['integer', 'number'],
    ['boolean', 'checkbox'],
    ['date', 'date'],
    ['enum', 'select'],
    ['ref', 'select']
  ] as const)('%s → %s', (type, control) => {
    expect(formControlFor(field(type))).toBe(control)
  })
})
