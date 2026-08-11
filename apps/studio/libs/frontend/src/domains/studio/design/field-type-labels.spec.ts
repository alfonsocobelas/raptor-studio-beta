import { describe, expect, it } from 'vitest'
import { DRAFT_FIELD_TYPES } from '@app/shared/domain'
import { SHORT_TYPE_LABELS, labelOfType, shortLabelOfType } from './field-type-labels'

describe('etiquetas cortas de tipo (las del diagrama)', () => {
  it('ningún tipo del contrato se queda sin etiqueta corta', () => {
    for (const type of DRAFT_FIELD_TYPES) {
      expect(SHORT_TYPE_LABELS[type], `falta la etiqueta corta de ${type}`).toBeTruthy()
    }
  })

  it('son cortas de verdad: en el diagrama compiten con el nombre del campo', () => {
    for (const label of Object.values(SHORT_TYPE_LABELS)) {
      expect(label.length).toBeLessThanOrEqual(7)
    }
  })

  it('un tipo desconocido se muestra por su identificador, nunca vacío', () => {
    expect(shortLabelOfType('vector')).toBe('vector')
  })

  it('la etiqueta larga sigue siendo la del inspector', () => {
    expect(labelOfType('ref')).toBe('referencia a…')
    expect(shortLabelOfType('ref')).toBe('ref')
  })
})
