import { describe, expect, it } from 'vitest'
import { STUDIO_MODES } from '../design/studio-modes'
import { chatPlaceholder } from './chat-placeholder'

describe('chatPlaceholder', () => {
  it('en Vistas sugiere una orden de maquetación', () => {
    expect(chatPlaceholder('views')).toContain('KPIs')
  })

  it('en Modelo sugiere una orden sobre los datos', () => {
    expect(chatPlaceholder('model')).toContain('caducidad')
  })

  it('ningún modo se queda sin sugerencia: un modo nuevo no deja el chat mudo', () => {
    for (const tab of STUDIO_MODES) {
      expect(chatPlaceholder(tab.mode).length).toBeGreaterThan(10)
    }
  })
})
