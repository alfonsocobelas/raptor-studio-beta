import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import { TestBed } from '@angular/core/testing'
import { provideHttpClient } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { DesignStore } from '../design/design-store'
import { StudioChatService } from './studio-chat.service'

/**
 * El turno del chat envía el diseño COMPLETO: si los flujos dibujados no viajan,
 * applyExternal de la respuesta los borra (spec 28 — «conserva los existentes»
 * solo funciona si el adapter los recibe).
 */
describe('StudioChatService — el diseño que viaja en cada turno', () => {
  let http: HttpTestingController

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    })
    http = TestBed.inject(HttpTestingController)
  })
  afterEach(() => http.verify())

  it('los flujos dibujados viajan con el turno', async () => {
    const store = TestBed.inject(DesignStore)
    store.addResource('Pedido')
    store.addFlow('Ciclo de pedido')
    const service = TestBed.inject(StudioChatService)

    const sent = service.send('añade un kpi de pedidos')
    const req = http.expectOne('/api/v1/studio/chat')

    expect(req.request.body.design.flows).toHaveLength(1)
    expect(req.request.body.design.flows[0].name).toBe('Ciclo de pedido')

    req.flush({
      reply: 'ok',
      design: { appName: store.appName(), resources: store.resources(), pages: [], flows: store.flows() },
      mode: 'fake'
    })
    await sent
  })
})
