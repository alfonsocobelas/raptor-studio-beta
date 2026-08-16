# Diseño técnico: proveedor `infra=aws` (C3)

> Espejo de la spec 24 (`infra=azure`). Telemetría: opción 1 aprobada (logs JSON
> estructurados a stdout + transporte directo CloudWatch Logs opcional; sin OTel/X-Ray).

---

## 1. Reparto: qué es base y qué es del proveedor

```
  kernel/files (SIEMPRE emitido)                    files-infra-aws (sólo con --infra=aws)
  ─────────────────────────────────                 ─────────────────────────────────────────
  logger/app-logger.service.ts   winston →stdout    logger/aws-log-transports.ts
    JSON en dev/prod (Log Insights-ready)             transporte CloudWatch Logs en la costura
    costura EXTRA_LOG_TRANSPORTS                      EXTRA_LOG_TRANSPORTS
  config/loaders/config-loader.ts                   config/loaders/aws/aws-config-loader.ts
    JSON por entorno; falla si ve vault.*             vault.* → Secrets Manager
                                                      (prefijo por AWS_SECRETS_PREFIX)
  storage/                                          storage/s3-file-storage.ts
    file-storage.port.ts
    local-file-storage.ts
    storage.module.ts
```

A diferencia de Azure **no hay `telemetry/instrument.ts`**: no hay SDK que deba parchear
módulos antes del arranque. La decisión aprobada es que la telemetría de logs es el JSON
estructurado que winston ya emite a stdout (App Runner lo envía a CloudWatch Logs solo) más
el transporte directo para despliegues fuera de App Runner. Menos piezas, cero coste de
arranque.

## 2. Manifiesto del proveedor

Se añade `awsInfra` a `INFRA_PROVIDERS` en `app/infra/providers.ts` con el patrón
`defineInfra` existente (sin tocar el tipo `InfraProvider`):

```typescript
export const awsInfra = defineInfra({
  value: 'aws',
  label: 'AWS (Secrets Manager, S3, CloudWatch Logs)',
  files: 'files-infra-aws',
  dependencies: {
    '@aws-sdk/client-secrets-manager': '^3.700.0',
    '@aws-sdk/client-s3': '^3.700.0',
    '@aws-sdk/client-cloudwatch-logs': '^3.700.0'
  },
  apply(tree, context) {
    useAwsConfigLoader(tree, context)   // config-loader → loaders/aws/aws-config-loader
    addAwsLogTransport(tree, context)   // provider en logger.module.ts (costura)
    bindS3Storage(tree, context)        // StorageModule por sección de config
  }
})
```

El registro en la ranura hace aparecer `--infra=aws` en `schema.json` (test de paridad) y en
`slots.json` → wizard, sin más cableado.

## 3. Ficheros del subárbol `files-infra-aws`

| Fichero emitido | Origen (canon) |
| --- | --- |
| `config/loaders/aws/aws-config-loader.ts` | `libs/infra/config-aws` (resolveAwsConfig + AwsSecretsError), adaptado al estilo del loader azure emitido |
| `storage/s3-file-storage.ts` | `libs/infra/storage-s3` (S3FileStorage), sin las opciones R2/MinIO que la config de la app no expone: bucket + region; endpoint/forcePathStyle se quedan porque cubren MinIO local con la MISMA sección |
| `logger/aws-log-transports.ts` | **nuevo** — espejo de `azure-log-transports.ts` |

### 3.1 `aws-log-transports.ts` (la pieza nueva)

Mismo contrato que el de Azure: un `Provider` de Nest sobre `EXTRA_LOG_TRANSPORTS` que decide
por config, no por build:

```
  config trae `cloudwatch.logGroup`  →  [new CloudWatchLogsTransport(...)]
  no la trae                         →  []   (stdout ya llega a Log Insights en App Runner)
```

`CloudWatchLogsTransport` es un `winston.Transport` propio (~60 líneas) sobre
`@aws-sdk/client-cloudwatch-logs` (`PutLogEvents` + creación perezosa del log stream), en
vez de la dependencia `winston-cloudwatch` (sin mantenimiento, arrastra aws-sdk v2). Buffer
con flush por lote/intervalo, y los errores de envío se tragan a stderr: el logging nunca
tumba la app.

## 4. Secciones de config

Espejo de las secciones azure, decididas por presencia:

```typescript
// config-types.ts (añadidas por el subárbol/apply, como hace azure)
export interface CloudWatchConfig {
  logGroup: string
  logStream?: string   // default: nombre de la app + env
}
// storage reutiliza la sección existente con bucket/region en vez de connectionString
```

- `vault.*` en los JSON de dev/prod → Secrets Manager (prefijo `AWS_SECRETS_PREFIX`, ya
  inyectado por `apprunner.tf`).
- `storage` presente → S3; ausente → disco local (binding idéntico al de Blob).
- `cloudwatch` presente → transporte directo; ausente → solo stdout.
- Región/credenciales SIEMPRE del entorno estándar AWS (12-factor); nunca en config.

## 5. Catálogo: `libs/infra/observability-aws`

Nueva lib espejo de `observability-azure`, con `CloudWatchLogsTransport` como única pieza
(el logger base ya es del kernel). El subárbol del generador emite el mismo código: el
catálogo es el canon y lleva los tests unitarios de verdad (batching, creación de stream,
errores tragados) con un cliente fake estructural, como `AwsSecretsReader` en `config-aws`.

## 6. Terraform (`iac/aws`)

Ya existen apprunner/rds/s3/ses/secrets/ecr/iam. Se añade:

- `cloudwatch.tf`: `aws_cloudwatch_log_group` con `retention_in_days` (variable, default 30).
  App Runner crea sus propios log groups gestionados; este es el del transporte directo
  (nombre = `local.name`, el que la config `cloudwatch.logGroup` referencia).
- `iam.tf`: ampliar la policy de la instancia con `logs:CreateLogStream`/`logs:PutLogEvents`
  sobre ese log group (mínimo privilegio; `logs:CreateLogGroup` NO — el group lo crea TF).
- `outputs.tf`: nombre del log group.
- `iac/aws/README.md` (hoy no existe): espejo del de Azure + 3-4 queries de ejemplo de Log
  Insights sobre los campos del JSON del logger (`level`, `context`, `message`, `timestamp`).

## 7. El candado

`infra-free.spec.ts` se extiende: una app sin infra no contiene `@aws-sdk/` en ningún
fichero emitido ni en `package.json` (hoy solo vigila `@azure/`). Ojo: el plugin `email`
declara `@aws-sdk/client-ses` a propósito — el candado vigila la app SIN plugins, y un caso
aparte documenta que `auth,email` sin infra sí lleva el SDK de SES (es del plugin, no de la
ranura).

## 8. Fixtures y gates

Sin fixture nueva y sin re-baseline: `app` sigue siendo `--infra=azure` ("todo encendido")
y `app-mongo` cubre la ausencia de infra. AWS se valida con:

- unit tests del plugin (manifiesto, apply, paridad schema/slots),
- unit tests del catálogo (`observability-aws`),
- candado extendido,
- typecheck fuera del árbol (§9).

## 9. Testing

- Unit (plugin): registro del proveedor, deps declaradas, loader cambiado, binding S3 por
  sección, provider del transporte en `logger.module.ts`, `--infra=aws` en schema/slots.
- Unit (catálogo): `CloudWatchLogsTransport` con cliente fake — batching, stream perezoso,
  error de envío no propaga.
- Candado: sin `@aws-sdk/` en el emitido sin infra.
- Golden: 6 gates vacíos SIN re-baseline (si alguno se mueve, algo se filtró a la base).
- Verificación manual (una vez): app `--infra=aws` + `--plugins=auth,email`, movida fuera
  del monorepo, `npm install` + `tsc` a 0 errores (lección TASK-08 de la spec 24).
- Terraform: `terraform validate` + `terraform plan` en `iac/aws` (sin apply; no hay cuenta
  de pruebas).

## Decisiones técnicas

- **Transporte CloudWatch propio en vez de `winston-cloudwatch`**: la lib está abandonada y
  arrastra aws-sdk v2; 60 líneas sobre el SDK v3 que ya declaramos son más baratas de poseer.
- **Sin `instrument.ts`/OTel**: decisión de REQUIREMENTS (opción 1). Si un cliente pide
  trazas, ADOT entra como spec propia sobre la misma costura de arranque que usa Azure.
- **Fixture de oro se queda en Azure**: dos fixtures cubren las dos dimensiones
  (con/sin infra); una tercera por proveedor no escala a C4 (gcp).
- **`endpoint`/`forcePathStyle` se conservan en el adapter S3 emitido**: no es abstracción
  especulativa — es lo que permite `make local-setup` contra MinIO con la misma sección.

## Riesgos identificados

- **PutLogEvents tiene cuotas y exige orden temporal**: mitigado con lote + timestamps del
  propio evento; los tests del catálogo fijan el comportamiento.
- **Deriva catálogo ↔ subárbol emitido** (mismo código en dos sitios, como ya pasa con
  azure): riesgo aceptado y conocido; el canon es el catálogo y el golden congela el emitido.
- **`terraform plan` sin cuenta AWS**: `validate` sí corre en frío; el plan puede requerir
  credenciales — si no las hay, se documenta como verificación pendiente, no se finge.
