# infra-observability-aws

Adapter de observabilidad para AWS (catálogo ADR-004): transporte winston que envía los
logs a CloudWatch Logs (`PutLogEvents`), consultables en Log Insights. Complementa al
logger base del emitido, que ya escribe JSON estructurado a stdout: en App Runner ese
stdout llega solo a CloudWatch; este transporte cubre los despliegues donde no.

## Running unit tests

Run `nx test infra-observability-aws` to execute the unit tests via [Jest](https://jestjs.io).
