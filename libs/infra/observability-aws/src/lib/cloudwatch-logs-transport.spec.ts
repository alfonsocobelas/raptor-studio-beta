import { CreateLogStreamCommand, PutLogEventsCommand } from '@aws-sdk/client-cloudwatch-logs'
import { CloudWatchLogsTransport, type CloudWatchLogsSender } from './cloudwatch-logs-transport'

const MESSAGE = Symbol.for('message')

/** Fake estructural del cliente (mismo patrón que AwsSecretsReader en config-aws). */
class FakeCloudWatchClient implements CloudWatchLogsSender {
  readonly sent: (CreateLogStreamCommand | PutLogEventsCommand)[] = []
  failCreateWith?: Error
  failPutWith?: Error

  async send(command: CreateLogStreamCommand | PutLogEventsCommand): Promise<unknown> {
    if (command instanceof CreateLogStreamCommand && this.failCreateWith) {
      throw this.failCreateWith
    }
    if (command instanceof PutLogEventsCommand && this.failPutWith) {
      throw this.failPutWith
    }
    this.sent.push(command)
    return {}
  }

  putCommands(): PutLogEventsCommand[] {
    return this.sent.filter((c): c is PutLogEventsCommand => c instanceof PutLogEventsCommand)
  }

  createCommands(): CreateLogStreamCommand[] {
    return this.sent.filter((c): c is CreateLogStreamCommand => c instanceof CreateLogStreamCommand)
  }
}

function namedError(name: string): Error {
  const error = new Error(name)
  error.name = name
  return error
}

function info(message: string, level = 'info'): Record<string | symbol, unknown> {
  return { level, message, [MESSAGE]: JSON.stringify({ level, message }) }
}

describe('CloudWatchLogsTransport', () => {
  it('buffers events without sending until the batch size is reached', async () => {
    // GIVEN
    const client = new FakeCloudWatchClient()
    const transport = new CloudWatchLogsTransport({ logGroupName: 'g', logStreamName: 's', batchSize: 3 }, client)

    // WHEN — dos eventos por debajo del lote
    transport.log(info('one'), jest.fn())
    transport.log(info('two'), jest.fn())
    await transport.flush()

    // THEN — aún nada enviado como lote automático… (el flush manual sí los manda)
    // El buffer se vacía por flush manual, así que reiniciamos el escenario para el disparo por tamaño:
    const client2 = new FakeCloudWatchClient()
    const transport2 = new CloudWatchLogsTransport({ logGroupName: 'g', logStreamName: 's', batchSize: 3 }, client2)
    transport2.log(info('one'), jest.fn())
    transport2.log(info('two'), jest.fn())
    expect(client2.putCommands()).toHaveLength(0)

    // WHEN — el tercero completa el lote
    transport2.log(info('three'), jest.fn())
    await transport2.flush()

    // THEN — un único PutLogEvents con los 3 eventos en orden y timestamps numéricos
    const puts = client2.putCommands()
    expect(puts).toHaveLength(1)
    const events = puts[0].input.logEvents ?? []
    expect(events.map(e => e.message)).toEqual([
      JSON.stringify({ level: 'info', message: 'one' }),
      JSON.stringify({ level: 'info', message: 'two' }),
      JSON.stringify({ level: 'info', message: 'three' })
    ])
    expect(events.every(e => typeof e.timestamp === 'number')).toBe(true)
    expect(puts[0].input.logGroupName).toBe('g')
    expect(puts[0].input.logStreamName).toBe('s')
    await transport.close()
    await transport2.close()
  })

  it('creates the log stream lazily and only once', async () => {
    // GIVEN
    const client = new FakeCloudWatchClient()
    const transport = new CloudWatchLogsTransport({ logGroupName: 'g', logStreamName: 's' }, client)
    expect(client.createCommands()).toHaveLength(0)

    // WHEN — dos flushes con eventos
    transport.log(info('one'), jest.fn())
    await transport.flush()
    transport.log(info('two'), jest.fn())
    await transport.flush()

    // THEN — el stream se creó una sola vez, antes del primer envío
    expect(client.createCommands()).toHaveLength(1)
    expect(client.putCommands()).toHaveLength(2)
    await transport.close()
  })

  it('tolerates a log stream that already exists', async () => {
    // GIVEN — CreateLogStream falla porque el stream quedó de una ejecución anterior
    const client = new FakeCloudWatchClient()
    client.failCreateWith = namedError('ResourceAlreadyExistsException')
    const transport = new CloudWatchLogsTransport({ logGroupName: 'g', logStreamName: 's' }, client)

    // WHEN
    transport.log(info('one'), jest.fn())
    await transport.flush()

    // THEN — el envío sigue adelante
    expect(client.putCommands()).toHaveLength(1)
    await transport.close()
  })

  it('flushes buffered events when the interval timer fires', async () => {
    // GIVEN
    jest.useFakeTimers()
    const client = new FakeCloudWatchClient()
    const transport = new CloudWatchLogsTransport(
      { logGroupName: 'g', logStreamName: 's', batchSize: 100, flushIntervalMs: 1000 },
      client
    )

    // WHEN — un evento por debajo del lote y pasa el intervalo
    transport.log(info('one'), jest.fn())
    expect(client.putCommands()).toHaveLength(0)
    await jest.advanceTimersByTimeAsync(1000)

    // THEN
    expect(client.putCommands()).toHaveLength(1)
    await transport.close()
    jest.useRealTimers()
  })

  it('swallows send errors to stderr and keeps working afterwards', async () => {
    // GIVEN — PutLogEvents falla; el logging nunca tumba la app
    const client = new FakeCloudWatchClient()
    client.failPutWith = namedError('ThrottlingException')
    const stderr = jest.spyOn(console, 'error').mockImplementation(() => undefined)
    const transport = new CloudWatchLogsTransport({ logGroupName: 'g', logStreamName: 's' }, client)

    // WHEN — el flush con error no lanza y el lote fallido se descarta
    transport.log(info('lost'), jest.fn())
    await expect(transport.flush()).resolves.toBeUndefined()
    expect(stderr).toHaveBeenCalled()

    // THEN — el siguiente evento se envía con normalidad (sin arrastrar el lote perdido)
    client.failPutWith = undefined
    transport.log(info('recovered'), jest.fn())
    await transport.flush()
    const puts = client.putCommands()
    expect(puts).toHaveLength(1)
    expect((puts[0].input.logEvents ?? []).map(e => e.message)).toEqual([
      JSON.stringify({ level: 'info', message: 'recovered' })
    ])
    stderr.mockRestore()
    await transport.close()
  })

  it('falls back to serializing the info when winston did not format a message', async () => {
    // GIVEN — info sin Symbol(message): el transporte serializa él mismo
    const client = new FakeCloudWatchClient()
    const transport = new CloudWatchLogsTransport({ logGroupName: 'g', logStreamName: 's' }, client)

    // WHEN
    transport.log({ level: 'warn', message: 'raw' }, jest.fn())
    await transport.flush()

    // THEN
    const events = client.putCommands()[0].input.logEvents ?? []
    expect(events[0].message).toBe(JSON.stringify({ level: 'warn', message: 'raw' }))
    await transport.close()
  })

  it('close() flushes what is pending and stops the timer', async () => {
    // GIVEN
    jest.useFakeTimers()
    const client = new FakeCloudWatchClient()
    const transport = new CloudWatchLogsTransport(
      { logGroupName: 'g', logStreamName: 's', flushIntervalMs: 1000 },
      client
    )
    transport.log(info('pending'), jest.fn())

    // WHEN
    await transport.close()

    // THEN — lo pendiente salió y el timer no vuelve a disparar
    expect(client.putCommands()).toHaveLength(1)
    await jest.advanceTimersByTimeAsync(5000)
    expect(client.putCommands()).toHaveLength(1)
    jest.useRealTimers()
  })
})
