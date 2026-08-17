import Transport from 'winston-transport'

const MESSAGE = Symbol.for('message')

/** The slice of `fetch` this transport uses; Node 24 ships it globally, so no SDK is needed. */
export type LokiFetch = (url: string, init?: RequestInit) => Promise<Response>

export interface LokiTransportOptions {
  /** Base URL of the Loki instance, e.g. https://logs-prod-eu-west-0.grafana.net */
  url: string
  /** Grafana Cloud user id; omit both credentials for an unauthenticated self-hosted Loki */
  user?: string
  apiKey?: string
  /**
   * Stream labels. Keep them FEW and low-cardinality (app, env): Loki indexes labels, and
   * high-cardinality ones (requestId, userId…) blow up cost and query time. Everything else
   * belongs in the JSON line, which Loki can still filter on.
   */
  labels?: Record<string, string>
  /** Events buffered before an automatic flush (default 100) */
  batchSize?: number
  /** Periodic flush of whatever is buffered (default 5000ms) */
  flushIntervalMs?: number
}

interface LokiEntry {
  timestampNs: string
  level: string
  line: string
}

/**
 * Winston transport that ships log events to Loki (Grafana Cloud's free tier, or a
 * self-hosted instance). Mirror of CloudWatchLogsTransport in observability-aws, and it
 * holds the same line: the base logger keeps writing structured JSON to stdout, and this
 * transport is what makes those lines queryable from Grafana.
 *
 * - Events are batched and flushed by size or by interval (Loki rejects tiny chatty pushes).
 * - Each batch is grouped into one stream per level, so `level` is a usable label.
 * - A failed push is dropped and reported to stderr: logging never takes the app down and
 *   never grows an unbounded retry buffer.
 */
export class LokiTransport extends Transport {
  private readonly endpoint: string
  private readonly headers: Record<string, string>
  private readonly labels: Record<string, string>
  private readonly batchSize: number
  private readonly http: LokiFetch
  private readonly timer: NodeJS.Timeout
  private buffer: LokiEntry[] = []
  private pending: Promise<void> = Promise.resolve()

  constructor(options: LokiTransportOptions, fetchImpl?: LokiFetch) {
    super()
    this.endpoint = `${options.url.replace(/\/$/, '')}/loki/api/v1/push`
    this.labels = options.labels ?? {}
    this.batchSize = options.batchSize ?? 100
    this.http = fetchImpl ?? (globalThis.fetch as LokiFetch)
    this.headers = { 'Content-Type': 'application/json' }
    if (options.user && options.apiKey) {
      this.headers['Authorization'] = `Basic ${Buffer.from(`${options.user}:${options.apiKey}`).toString('base64')}`
    }
    this.timer = setInterval(() => void this.flush(), options.flushIntervalMs ?? 5000)
    // El timer no debe mantener vivo el proceso él solo
    this.timer.unref?.()
  }

  override log(info: Record<string | symbol, unknown>, next: () => void): void {
    const formatted = info[MESSAGE]
    const level = typeof info['level'] === 'string' ? info['level'] : 'info'
    const line =
      typeof formatted === 'string' ? formatted : JSON.stringify({ level: info['level'], message: info['message'] })
    this.buffer.push({ timestampNs: nowInNanoseconds(), level, line })
    if (this.buffer.length >= this.batchSize) {
      void this.flush()
    }
    next()
  }

  /**
   * Envía lo acumulado; el lote fallido se descarta y se reporta a stderr. Los flushes se
   * encadenan en serie: awaitear cualquiera espera también a los que estaban en vuelo, y
   * los lotes llegan a Loki en orden.
   */
  flush(): Promise<void> {
    this.pending = this.pending.then(() => this.doFlush())
    return this.pending
  }

  private async doFlush(): Promise<void> {
    if (this.buffer.length === 0) {
      return
    }
    const entries = this.buffer
    this.buffer = []
    try {
      const response = await this.http(this.endpoint, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({ streams: this.toStreams(entries) })
      })
      if (!response.ok) {
        console.error(`LokiTransport: push rejected with status ${response.status}`, `${entries.length} line(s) dropped`)
      }
    } catch (error) {
      console.error(`LokiTransport: dropped ${entries.length} log line(s)`, error)
    }
  }

  /** Un stream por nivel: Loki exige que las líneas de un stream compartan etiquetas. */
  private toStreams(entries: LokiEntry[]): { stream: Record<string, string>; values: [string, string][] }[] {
    const byLevel = new Map<string, [string, string][]>()

    for (const entry of entries) {
      const values = byLevel.get(entry.level) ?? []
      values.push([entry.timestampNs, entry.line])
      byLevel.set(entry.level, values)
    }

    return [...byLevel].map(([level, values]) => ({ stream: { ...this.labels, level }, values }))
  }

  /** Flush final y parada del timer; llamar al apagar la app. */
  override async close(): Promise<void> {
    clearInterval(this.timer)
    await this.flush()
  }
}

/** Loki fecha cada línea en nanosegundos; Date.now() da milisegundos, así que se rellenan. */
function nowInNanoseconds(): string {
  return `${Date.now()}000000`
}
