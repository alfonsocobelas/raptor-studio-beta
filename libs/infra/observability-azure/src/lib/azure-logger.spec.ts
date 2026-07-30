import * as winston from 'winston'
import { AzureLogger } from './azure-logger'

jest.mock('winston', () => {
  const log = jest.fn()
  const createLogger = jest.fn(() => ({ log }))
  return {
    __esModule: true,
    createLogger,
    format: {
      json: jest.fn(),
      combine: jest.fn(),
      colorize: jest.fn(),
      timestamp: jest.fn(),
      printf: jest.fn()
    },
    transports: { Console: jest.fn() },
    __mocks: { createLogger, log }
  }
})

jest.mock('@opentelemetry/winston-transport', () => ({
  __esModule: true,
  OpenTelemetryTransportV3: jest.fn()
}))

const sdk = (winston as unknown as { __mocks: { createLogger: jest.Mock; log: jest.Mock } }).__mocks

describe('AzureLogger', () => {
  beforeEach(() => jest.clearAllMocks())

  it('uses the OTel + JSON transports only in deployed environments', () => {
    new AzureLogger({ env: 'prod' })
    new AzureLogger({ env: 'local' })

    const [prodCall, localCall] = sdk.createLogger.mock.calls
    expect(prodCall[0].transports).toHaveLength(2)
    expect(localCall[0].transports).toHaveLength(1)
  })

  it('sanitizes sensitive metadata before emitting', () => {
    const logger = new AzureLogger({ env: 'local' })

    logger.log({ message: 'login ok', accessToken: 'abc123' }, 'Auth')

    expect(sdk.log).toHaveBeenCalledWith(
      expect.objectContaining({
        context: 'Auth',
        metadata: expect.objectContaining({ accessToken: '***' })
      })
    )
  })

  it('honors the configured minimum level and silent mode', () => {
    const errorOnly = new AzureLogger({ env: 'local', level: 'error' })
    errorOnly.debug('noise')
    errorOnly.error('boom')
    expect(sdk.log).toHaveBeenCalledTimes(1)

    sdk.log.mockClear()
    const silent = new AzureLogger({ env: 'local', level: 'silent' })
    silent.error('never')
    expect(sdk.log).not.toHaveBeenCalled()
  })
})
