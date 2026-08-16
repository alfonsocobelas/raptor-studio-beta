# Spec: Proveedor `infra=aws` (C3)

## Contexto de negocio

El acelerador entrega apps a clientes con distinta infra. Hoy la ranura `infra` tiene dos
proveedores (`none`, `azure`); el ROADMAP define C3 como `infra-aws` (S3 + CloudWatch +
Secrets Manager + SES). Gran parte del catálogo ya existe: `@raptor/infra-config-aws`
(secretos), `@raptor/infra-storage-s3` (ficheros), el `SesEmailSender` del plugin `email`
y el directorio `iac/aws/` de Terraform. Lo que falta es **convertir esas piezas en un
proveedor de la ranura `infra`** del generador de apps (como hizo la spec 24 con Azure) y
cubrir el hueco real: **observabilidad con CloudWatch Logs / Log Insights**.

## User stories (formato EARS)

- WHEN se genera una app con `--infra=aws` THEN el módulo de config resuelve los marcadores
  `vault.*` contra Secrets Manager (loader emitido en
  `config/loaders/aws/aws-config-loader.ts`, prefijo por `AWS_SECRETS_PREFIX`).
- WHEN se genera una app con `--infra=aws` THEN los ficheros van a S3 si la sección
  `storage` de config está presente, y a disco local si no (mismo patrón por-sección que
  Blob en Azure).
- WHEN se genera una app con `--infra=aws --plugins=auth,email` THEN los emails salen por
  SES si la sección `ses` está presente (ya funciona hoy vía plugin `email`; esta spec solo
  verifica que la combinación compone).
- WHEN se genera una app con `--infra=aws` THEN los logs del backend salen como **JSON
  estructurado** consultable en CloudWatch Log Insights, y con la sección de config de
  CloudWatch presente se añade un transporte directo a CloudWatch Logs vía la costura
  `EXTRA_LOG_TRANSPORTS` (espejo de `azure-log-transports`).
- IF la app se genera sin `--infra` THEN no aparece ninguna clase, import ni dependencia
  `@aws-sdk/*` en el emitido (candado `infra-free` ya existente, extendido a AWS).
- WHEN se despliega con `iac/aws` THEN existe un log group de CloudWatch con retención
  configurable y el servicio tiene permisos IAM para Secrets Manager, S3, SES y CloudWatch
  Logs (mínimo privilegio, espejo de `identity.tf` de Azure).

## Criterios de aceptación

- [ ] `INFRA_PROVIDERS` incluye `awsInfra` con manifiesto (`files-infra-aws`, dependencias
      `@aws-sdk/*` declaradas, secciones de config) y `--infra=aws` aparece en `schema.json`
      y `slots.json` (tests de paridad en verde).
- [ ] Subárbol `files-infra-aws` con: `aws-config-loader.ts`, `aws-secret-resolver.ts`
      (copiados/adaptados del catálogo `config-aws`), `s3-file-storage.ts`,
      `aws-log-transports.ts` y telemetría (`instrument.ts`/`init-telemetry.ts` o su
      equivalente honesto para AWS — ver decisión abierta).
- [ ] `apply()` del proveedor: cambia el config-loader, enlaza S3 en `StorageModule` por
      sección de config, y enchufa el transporte CloudWatch en la costura del logger.
- [ ] Nueva lib de catálogo `libs/infra/observability-aws` (logger JSON estructurado +
      transporte CloudWatch Logs) con tests unitarios; el subárbol del generador emite el
      mismo código (canon = catálogo).
- [ ] `iac/aws/` completado: `cloudwatch.tf` (log group + retención), política IAM del
      servicio ampliada a CloudWatch Logs, y outputs necesarios; queries de ejemplo de Log
      Insights documentadas en `iac/aws/README.md` (hoy no existe: crearlo, espejo del de
      Azure).
- [ ] Candado `infra-free.spec.ts` extendido: una app sin infra no nombra nada de AWS.
- [ ] Los 6 gates de oro en verde (la fixture de `app` NO cambia de proveedor: sigue en
      `--infra=azure`; AWS se valida con specs del plugin + typecheck del emitido).
- [ ] Verificación fuera del árbol: app generada con `--infra=aws`, movida fuera del
      monorepo, `npm install` + `tsc` con 0 errores (la lección de TASK-08 de la spec 24).

## Referencias del proyecto de referencia

- `.claude/specs/24-infra-azure/` — la spec espejo; misma secuencia de tareas.
- `libs/generators/src/generators/app/infra/providers.ts` — patrón `defineInfra` + `apply()`.
- `libs/generators/src/generators/app/files-infra-azure/` — forma del subárbol a espejar.
- `libs/infra/config-aws/src/lib/aws-config-loader.ts` — loader ya escrito (canon).
- `libs/infra/storage-s3/src/lib/s3-file-storage.ts` — adapter S3 ya escrito (canon).
- `iac/azure/` — espejo de nombres/estructura para completar `iac/aws/`.

## Reglas de negocio aplicables

- Regla de los dos: los puertos (`vault.*`, `FileStoragePort`, `EXTRA_LOG_TRANSPORTS`,
  `EmailSender`) ya están validados con 2+ adapters; aquí NO se abre ninguna abstracción
  nueva.
- Plantillas tontas, lógica en `generator.ts`/`providers.ts`.
- Nunca copiar credenciales de `docs/referencia/` (tfvars, probe.env).
- El emitido debe compilar fuera del monorepo con sus dependencias declaradas.

## Decisión abierta (resolver antes del DESIGN)

**Telemetría AWS**: Azure usa `@azure/monitor-opentelemetry` (auto-instrumentación OTel +
transporte winston). En AWS el espejo exacto sería ADOT/X-Ray, pero App Runner ya envía
stdout a CloudWatch Logs automáticamente. Opciones:

1. **Solo logs estructurados + transporte CloudWatch opcional** (recomendada): JSON a
   stdout cubre Log Insights en App Runner sin SDK; el transporte directo
   (`@aws-sdk/client-cloudwatch-logs`) queda para despliegues fuera de App Runner. Sin
   trazas distribuidas en esta spec (YAGNI: una app, un backend).
2. OTel completo con ADOT + X-Ray: paridad total con Azure, pero más dependencias y
   complejidad para valor dudoso en el caso canónico.

## Fuera de scope (deliberado)

- Trazas distribuidas / X-Ray (salvo que la decisión abierta diga lo contrario).
- Cambiar la fixture de oro de `app` a AWS (se queda en Azure como "todo encendido").
- Métricas custom (CloudWatch Metrics/EMF) — el puerto de métricas ya tiene Prometheus.
- GCP (C4) — espejo posterior.
- Tocar el plugin `email` (SES ya está; solo se verifica la composición).
