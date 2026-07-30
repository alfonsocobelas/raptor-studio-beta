// Stable port for application metrics (ADR-004). Adapters: Prometheus (self-hosted free,
// pairs with Grafana), future StatsD/OTel-metrics. Least common denominator: counters,
// histograms and an exposition endpoint body.
export abstract class MetricsPort {
  abstract incrementCounter(name: string, labels?: Record<string, string>): void
  abstract observeHistogram(name: string, value: number, labels?: Record<string, string>): void
  /** Exposition payload for the /metrics endpoint (Prometheus text format). */
  abstract render(): Promise<string>
}
