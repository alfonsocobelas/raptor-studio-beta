import { LokiTransport, type LokiFetch } from './loki-transport'

const MESSAGE = Symbol.for('message')

interface LokiPush {
  streams: { stream: Record<string, string>; values: [string, string][] }[]
}

/** Fake estructural del `fetch` (mismo patrón que el reader de config-infisical). */
class FakeLokiEndpoint {
  readonly pushes: { url: string; init?: RequestInit }[] = []
  failWith?: Error
  status = 204

  readonly fetch: LokiFetch = async (url, init) => {
    if (this.failWith) {
      throw this.failWith
    }
    this.pushes.push({ url, init })
    return { ok: this.status >= 200 && this.status < 300, status: this.status } as Response
  }

  body(index = 0): LokiPush {
    return JSON.parse(String(this.pushes[index].init?.body)) as LokiPush
  }
}

function info(message: string, level = 'info'): Record<string | symbol, unknown> {
  return { level, message, [MESSAGE]: JSON.stringify({ level, message }) }
}

const options = { url: 'https://logs.example', user: '123', apiKey: 'glc_secret', labels: { app: 'demo', env: 'prod' } }

describe('LokiTransport', () => {
  it('buffers events without pushing until the batch size is reached', async () => {
    // GIVEN
    const loki = new FakeLokiEndpoint()
    const transport = new LokiTransport({ ...options, batchSize: 3 }, loki.fetch)

    // WHEN — dos eventos por debajo del lote
    transport.log(info('one'), jest.fn())
    transport.log(info('two'), jest.fn())

    // THEN — nada ha salido todavía
    expect(loki.pushes).toHaveLength(0)

    // WHEN — el tercero completa el lote
    transport.log(info('three'), jest.fn())
    await transport.flush()

    // THEN — un único push con las 3 líneas en orden
    expect(loki.pushes).toHaveLength(1)
    expect(loki.body().streams[0].values.map(([, line]) => line)).toEqual([
      JSON.stringify({ level: 'info', message: 'one' }),
      JSON.stringify({ level: 'info', message: 'two' }),
      JSON.stringify({ level: 'info', message: 'three' })
    ])
    await transport.close()
  })

  it('pushes to the Loki API with basic auth and nanosecond timestamps', async () => {
    // GIVEN
    const loki = new FakeLokiEndpoint()
    const transport = new LokiTransport(options, loki.fetch)

    // WHEN
    transport.log(info('one'), jest.fn())
    await transport.flush()

    // THEN — endpoint, credenciales y forma del payload
    const push = loki.pushes[0]
    expect(push.url).toBe('https://logs.example/loki/api/v1/push')
    expect(push.init?.method).toBe('POST')
    const headers = push.init?.headers as Record<string, string>
    expect(headers['Authorization']).toBe(`Basic ${Buffer.from('123:glc_secret').toString('base64')}`)
    expect(headers['Content-Type']).toBe('application/json')
    const [timestamp] = loki.body().streams[0].values[0]
    expect(timestamp).toMatch(/^\d{19}$/)
    await transport.close()
  })

  it('keeps stream labels low-cardinality: only the configured ones plus level', async () => {
    // GIVEN — Loki cobra caro y rinde mal con etiquetas de alta cardinalidad
    const loki = new FakeLokiEndpoint()
    const transport = new LokiTransport(options, loki.fetch)

    // WHEN — dos niveles distintos y un campo de contexto que NO debe convertirse en label
    transport.log({ ...info('one', 'error'), requestId: 'abc-123' }, jest.fn())
    await transport.flush()

    // THEN
    expect(loki.body().streams[0].stream).toEqual({ app: 'demo', env: 'prod', level: 'error' })
    await transport.close()
  })

  it('groups the batch into one stream per level', async () => {
    // GIVEN
    const loki = new FakeLokiEndpoint()
    const transport = new LokiTransport(options, loki.fetch)

    // WHEN
    transport.log(info('one', 'info'), jest.fn())
    transport.log(info('boom', 'error'), jest.fn())
    transport.log(info('two', 'info'), jest.fn())
    await transport.flush()

    // THEN — dos streams, el de info con sus dos líneas
    const streams = loki.body().streams
    expect(streams).toHaveLength(2)
    expect(streams.find(s => s.stream['level'] === 'info')?.values).toHaveLength(2)
    expect(streams.find(s => s.stream['level'] === 'error')?.values).toHaveLength(1)
    await transport.close()
  })

  it('flushes buffered events when the interval timer fires', async () => {
    // GIVEN
    jest.useFakeTimers()
    const loki = new FakeLokiEndpoint()
    const transport = new LokiTransport({ ...options, batchSize: 100, flushIntervalMs: 1000 }, loki.fetch)

    // WHEN
    transport.log(info('one'), jest.fn())
    expect(loki.pushes).toHaveLength(0)
    await jest.advanceTimersByTimeAsync(1000)

    // THEN
    expect(loki.pushes).toHaveLength(1)
    await transport.close()
    jest.useRealTimers()
  })

  it('swallows push errors to stderr and keeps working afterwards', async () => {
    // GIVEN — el logging nunca tumba la app
    const loki = new FakeLokiEndpoint()
    loki.failWith = new Error('ECONNREFUSED')
    const stderr = jest.spyOn(console, 'error').mockImplementation(() => undefined)
    const transport = new LokiTransport(options, loki.fetch)

    // WHEN
    transport.log(info('lost'), jest.fn())
    await expect(transport.flush()).resolves.toBeUndefined()
    expect(stderr).toHaveBeenCalled()

    // THEN — el siguiente evento sale sin arrastrar el lote perdido
    loki.failWith = undefined
    transport.log(info('recovered'), jest.fn())
    await transport.flush()
    expect(loki.pushes).toHaveLength(1)
    expect(loki.body().streams[0].values.map(([, line]) => line)).toEqual([
      JSON.stringify({ level: 'info', message: 'recovered' })
    ])
    stderr.mockRestore()
    await transport.close()
  })

  it('reports a rejected push (non-2xx) to stderr without throwing', async () => {
    // GIVEN
    const loki = new FakeLokiEndpoint()
    loki.status = 429
    const stderr = jest.spyOn(console, 'error').mockImplementation(() => undefined)
    const transport = new LokiTransport(options, loki.fetch)

    // WHEN
    transport.log(info('throttled'), jest.fn())
    await expect(transport.flush()).resolves.toBeUndefined()

    // THEN
    expect(stderr).toHaveBeenCalledWith(expect.stringContaining('429'), expect.anything())
    stderr.mockRestore()
    await transport.close()
  })

  it('falls back to serializing the info when winston did not format a message', async () => {
    // GIVEN
    const loki = new FakeLokiEndpoint()
    const transport = new LokiTransport(options, loki.fetch)

    // WHEN
    transport.log({ level: 'warn', message: 'raw' }, jest.fn())
    await transport.flush()

    // THEN
    expect(loki.body().streams[0].values[0][1]).toBe(JSON.stringify({ level: 'warn', message: 'raw' }))
    await transport.close()
  })

  it('close() flushes what is pending and stops the timer', async () => {
    // GIVEN
    jest.useFakeTimers()
    const loki = new FakeLokiEndpoint()
    const transport = new LokiTransport({ ...options, flushIntervalMs: 1000 }, loki.fetch)
    transport.log(info('pending'), jest.fn())

    // WHEN
    await transport.close()

    // THEN
    expect(loki.pushes).toHaveLength(1)
    await jest.advanceTimersByTimeAsync(5000)
    expect(loki.pushes).toHaveLength(1)
    jest.useRealTimers()
  })

  it('pushes without an Authorization header when no credentials are given (self-hosted Loki)', async () => {
    // GIVEN — un Loki en el propio VPS suele ir sin auth tras la red privada
    const loki = new FakeLokiEndpoint()
    const transport = new LokiTransport({ url: 'http://loki:3100', labels: { app: 'demo' } }, loki.fetch)

    // WHEN
    transport.log(info('one'), jest.fn())
    await transport.flush()

    // THEN
    expect((loki.pushes[0].init?.headers as Record<string, string>)['Authorization']).toBeUndefined()
    await transport.close()
  })
})
