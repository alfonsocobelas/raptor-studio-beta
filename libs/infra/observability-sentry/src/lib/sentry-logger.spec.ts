import { SentryLike, SentryLogger } from './sentry-logger'

const fakeSentry = (): SentryLike & { captureException: jest.Mock; captureMessage: jest.Mock } => ({
  captureException: jest.fn(),
  captureMessage: jest.fn()
})

describe('SentryLogger', () => {
  it('captures Error instances as exceptions with the context tag', () => {
    const sentry = fakeSentry()
    const logger = new SentryLogger(sentry)
    const boom = new Error('boom')

    logger.error(boom, undefined, 'Contracts')

    expect(sentry.captureException).toHaveBeenCalledWith(boom, { tags: { context: 'Contracts' } })
  })

  it('wraps non-Error payloads and attaches the trace as extra', () => {
    const sentry = fakeSentry()
    const logger = new SentryLogger(sentry)

    logger.error('db down', 'stack-lines')

    expect(sentry.captureException).toHaveBeenCalledWith(expect.any(Error), { extra: { stackTrace: 'stack-lines' } })
  })

  it('sanitizes sensitive content before sending messages', () => {
    const sentry = fakeSentry()
    const logger = new SentryLogger(sentry)

    logger.warn({ msg: 'retry', apiKey: 'abc' }, 'Sync')

    expect(sentry.captureMessage).toHaveBeenCalledWith('[Sync] {"msg":"retry","apiKey":"***"}', 'warning')
  })
})
