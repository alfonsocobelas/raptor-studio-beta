import { describe, expect, it } from 'vitest'
import { MAX_ROWS, autosize, shouldSubmit } from './chat-input'

const key = (over: Partial<{ key: string; shiftKey: boolean; isComposing: boolean }> = {}) => ({
  key: 'Enter',
  shiftKey: false,
  isComposing: false,
  ...over
})

describe('shouldSubmit', () => {
  it('sends on Enter', () => {
    expect(shouldSubmit(key())).toBe(true)
  })

  it('inserts a newline on Shift+Enter instead of sending', () => {
    expect(shouldSubmit(key({ shiftKey: true }))).toBe(false)
  })

  it('ignores the Enter that closes an IME composition', () => {
    expect(shouldSubmit(key({ isComposing: true }))).toBe(false)
  })

  it('ignores any other key', () => {
    expect(shouldSubmit(key({ key: 'a' }))).toBe(false)
  })
})

describe('autosize', () => {
  const textarea = (lineHeight = '20px'): HTMLTextAreaElement => {
    const el = document.createElement('textarea')
    el.style.lineHeight = lineHeight
    document.body.append(el)
    return el
  }

  it('caps the box at MAX_ROWS lines so the rest scrolls', () => {
    const el = textarea()
    autosize(el)
    expect(el.style.maxHeight).toBe(`${20 * MAX_ROWS}px`)
  })

  it('measures the cap with the real line height', () => {
    const el = textarea('28px')
    autosize(el, 3)
    expect(el.style.maxHeight).toBe('84px')
  })

  it('falls back to a sane line height when the style is not resolvable', () => {
    const el = textarea('normal')
    autosize(el, 4)
    expect(el.style.maxHeight).toBe('80px')
  })
})
