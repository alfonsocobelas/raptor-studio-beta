import { PrometheusMetrics } from './prometheus-metrics'

describe('PrometheusMetrics', () => {
  it('registers counters lazily, applies the prefix and accumulates increments', async () => {
    const metrics = new PrometheusMetrics({ prefix: 'acc_' })

    metrics.incrementCounter('exports_total', { format: 'csv' })
    metrics.incrementCounter('exports_total', { format: 'csv' })

    const output = await metrics.render()
    expect(output).toContain('acc_exports_total{format="csv"} 2')
  })

  it('observes histogram values with labels', async () => {
    const metrics = new PrometheusMetrics({ buckets: [0.1, 1] })

    metrics.observeHistogram('request_duration_seconds', 0.5, { route: '/api/v1/contracts' })

    const output = await metrics.render()
    expect(output).toContain('request_duration_seconds_count{route="/api/v1/contracts"} 1')
    expect(output).toContain('request_duration_seconds_sum{route="/api/v1/contracts"} 0.5')
  })

  it('keeps separate registries per instance (no global state leaks)', async () => {
    const a = new PrometheusMetrics()
    const b = new PrometheusMetrics()

    a.incrementCounter('only_in_a')

    expect(await a.render()).toContain('only_in_a')
    expect(await b.render()).not.toContain('only_in_a')
  })
})
