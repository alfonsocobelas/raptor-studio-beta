import {
  CreateLogStreamCommand,
  CloudWatchLogsClient,
  PutLogEventsCommand,
  type InputLogEvent
} from '@aws-sdk/client-cloudwatch-logs'
import Transport from 'winston-transport'

const MESSAGE = Symbol.for('message')

/**
 * Minimal structural contract over the CloudWatch Logs client, so tests inject a fake
 * without the SDK (same pattern as AwsSecretsReader in config-aws).
 */
export interface CloudWatchLogsSender {
  send(command: CreateLogStreamCommand | PutLogEventsCommand): Promise<unknown>
}

export interface CloudWatchLogsTransportOptions {
  logGroupName: string
  logStreamName: string
  /** Events buffered before an automatic flush (default 100) */
  batchSize?: number
  /** Periodic flush of whatever is buffered (default 2000ms) */
  flushIntervalMs?: number
}

/**
 * Winston transport that ships log events to CloudWatch Logs (queryable in Log Insights).
 * The base logger already writes structured JSON to stdout — App Runner forwards that to
 * CloudWatch by itself — so this transport exists for deployments where nothing collects
 * stdout. Design constraints:
 *
 * - The log stream is created lazily on the first flush (the GROUP is Terraform's job).
 * - Events are batched (PutLogEvents has quotas) and flushed by size or by interval.
 * - A failed batch is dropped and reported to stderr: logging never takes the app down
 *   and never grows an unbounded retry buffer.
 */
export class CloudWatchLogsTransport extends Transport {
  private readonly client: CloudWatchLogsSender
  private readonly logGroupName: string
  private readonly logStreamName: string
  private readonly batchSize: number
  private readonly timer: NodeJS.Timeout
  private buffer: InputLogEvent[] = []
  private streamReady = false
  private pending: Promise<void> = Promise.resolve()

  constructor(options: CloudWatchLogsTransportOptions, client?: CloudWatchLogsSender) {
    super()
    this.client = client ?? new CloudWatchLogsClient({})
    this.logGroupName = options.logGroupName
    this.logStreamName = options.logStreamName
    this.batchSize = options.batchSize ?? 100
    this.timer = setInterval(() => void this.flush(), options.flushIntervalMs ?? 2000)
    // El timer no debe mantener vivo el proceso él solo
    this.timer.unref?.()
  }

  override log(info: Record<string | symbol, unknown>, next: () => void): void {
    const formatted = info[MESSAGE]
    const message =
      typeof formatted === 'string' ? formatted : JSON.stringify({ level: info['level'], message: info['message'] })
    this.buffer.push({ timestamp: Date.now(), message })
    if (this.buffer.length >= this.batchSize) {
      void this.flush()
    }
    next()
  }

  /**
   * Envía lo acumulado; el lote fallido se descarta y se reporta a stderr. Los flushes se
   * encadenan en serie: awaitear cualquiera espera también a los que estaban en vuelo, y
   * los lotes llegan a CloudWatch en orden.
   */
  flush(): Promise<void> {
    this.pending = this.pending.then(() => this.doFlush())
    return this.pending
  }

  private async doFlush(): Promise<void> {
    if (this.buffer.length === 0) {
      return
    }
    const logEvents = this.buffer
    this.buffer = []
    try {
      await this.ensureStream()
      await this.client.send(
        new PutLogEventsCommand({ logGroupName: this.logGroupName, logStreamName: this.logStreamName, logEvents })
      )
    } catch (error) {
      console.error(`CloudWatchLogsTransport: dropped ${logEvents.length} log event(s)`, error)
    }
  }

  /** Flush final y parada del timer; llamar al apagar la app. */
  override async close(): Promise<void> {
    clearInterval(this.timer)
    await this.flush()
  }

  /** El stream se crea perezosamente una vez; si ya existía (proceso anterior), se reutiliza. */
  private async ensureStream(): Promise<void> {
    if (this.streamReady) {
      return
    }
    try {
      await this.client.send(
        new CreateLogStreamCommand({ logGroupName: this.logGroupName, logStreamName: this.logStreamName })
      )
    } catch (error) {
      if ((error as Error).name !== 'ResourceAlreadyExistsException') {
        throw error
      }
    }
    this.streamReady = true
  }
}
