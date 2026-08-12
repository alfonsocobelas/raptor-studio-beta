import { describe, expect, it } from 'vitest'
import { TestBed } from '@angular/core/testing'
import { CanvasNoticeService } from './canvas-notice.service'

describe('CanvasNoticeService', () => {
  const service = (): CanvasNoticeService => {
    TestBed.configureTestingModule({})
    return TestBed.inject(CanvasNoticeService)
  }

  it('arranca sin aviso: el lienzo no habla si no hay nada que decir', () => {
    expect(service().notice()).toBeNull()
  })

  it('el aviso lleva el texto y, si hace falta, una salida', () => {
    const notice = service()
    let visited = false

    notice.show('Los adjuntos viven en la ficha de la orden', { label: 'Ver la ficha', run: () => (visited = true) })
    notice.notice()?.action?.run()

    expect(notice.notice()?.text).toBe('Los adjuntos viven en la ficha de la orden')
    expect(notice.notice()?.action?.label).toBe('Ver la ficha')
    expect(visited).toBe(true)
  })

  it('un aviso nuevo tapa al anterior: solo el último gesto importa', () => {
    const notice = service()

    notice.show('primero')
    notice.show('segundo')

    expect(notice.notice()?.text).toBe('segundo')
  })

  it('el aviso nuevo no hereda la salida del anterior', () => {
    const notice = service()

    notice.show('con salida', { label: 'Ver la ficha', run: () => undefined })
    notice.show('sin salida')

    expect(notice.notice()?.action).toBeUndefined()
  })

  it('se puede cerrar', () => {
    const notice = service()

    notice.show('algo')
    notice.dismiss()

    expect(notice.notice()).toBeNull()
  })
})
