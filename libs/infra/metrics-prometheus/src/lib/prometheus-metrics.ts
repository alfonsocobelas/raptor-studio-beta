import { Counter, Histogram, Registry, collectDefaultMetrics } from 'prom-client'
import { MetricsPort } from '@raptor/infra-ports'

export interface PrometheusMetricsOptions {
  /** Prefix for every metric name (e.g. 'acc_') */
  prefix?: string
  /** Collect Node.js default metrics (event loop, heap, GC) */
  defaultMetrics?: boolean
  /** Histogram buckets in seconds; defaults to prom-client's HTTP-friendly buckets */
  buckets?: number[]
}

/**
 * Prometheus adapter for the MetricsPort. The app exposes render() on /metrics and a
 * self-hosted Prometheus+Grafana stack scrapes it — the free-tier observability path
 * for deployments outside Azure (Application Insights covers the Azure path).
 *
 * Metrics are lazily registered on first use so callers never pre-declare them; labels
 * of a metric are fixed by its first call (Prometheus requirement).
 */
export class PrometheusMetrics extends MetricsPort {
  private readonly registry = new Registry()
  private readonly counters = new Map<string, Counter>()
  private readonly histograms = new Map<string, Histogram>()
  private readonly prefix: string
  private readonly buckets?: number[]

  constructor(options: PrometheusMetricsOptions = {}) {
    super()
    this.prefix = options.prefix ?? ''
    this.buckets = options.buckets
    if (options.defaultMetrics) collectDefaultMetrics({ register: this.registry })
  }

  incrementCounter(name: string, labels: Record<string, string> = {}): void {
    const labelNames = Object.keys(labels)
    let counter = this.counters.get(name)
    if (!counter) {
      counter = new Counter({
        name: `${this.prefix}${name}`,
        help: `${name} counter`,
        labelNames,
        registers: [this.registry]
      })
      this.counters.set(name, counter)
    }
    counter.inc(labels)
  }

  observeHistogram(name: string, value: number, labels: Record<string, string> = {}): void {
    const labelNames = Object.keys(labels)
    let histogram = this.histograms.get(name)
    if (!histogram) {
      histogram = new Histogram({
        name: `${this.prefix}${name}`,
        help: `${name} histogram`,
        labelNames,
        ...(this.buckets && { buckets: this.buckets }),
        registers: [this.registry]
      })
      this.histograms.set(name, histogram)
    }
    histogram.observe(labels, value)
  }

  render(): Promise<string> {
    return this.registry.metrics()
  }
}
