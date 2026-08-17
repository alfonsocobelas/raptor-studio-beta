# infra-observability-loki

Winston transport that ships log lines to [Loki](https://grafana.com/oss/loki/) — Grafana
Cloud's free tier or a self-hosted instance — for the Raptor Cloud provider
(`--infra=raptor`). Sibling of `infra-observability-aws` (CloudWatch Logs) and
`infra-observability-azure` (App Insights).

```ts
logger.add(new LokiTransport({ url, user, apiKey, labels: { app: 'demo', env: 'prod' } }))
```

No SDK: one `fetch` against `/loki/api/v1/push`. Lines are batched and flushed by size or
interval, and a failed push is dropped to stderr — logging never takes the app down.

## Labels: keep them few

Loki indexes labels, so high-cardinality ones (`requestId`, `userId`, `path`) blow up cost
and query time. Only `app`/`env` plus `level` are labels here; everything else stays in the
JSON line, which Loki still filters on:

```logql
{app="demo", env="prod", level="error"} | json | requestId = "abc-123"
```

## Building

Run `nx build infra-observability-loki` to build the library.

## Running unit tests

Run `nx test infra-observability-loki` to execute the unit tests via [Jest](https://jestjs.io).
