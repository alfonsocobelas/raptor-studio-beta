# Diseño técnico: proveedor `infra=gcp` (C4)

> Espejo de la spec 47 (`infra=aws`). Telemetría heredada de aquella: logs JSON a stdout
> (Cloud Run → Cloud Logging automático) + transporte directo opcional por config.

---

## 1. Reparto: qué es base y qué es del proveedor

```
  kernel/files (SIEMPRE emitido)                    files-infra-gcp (sólo con --infra=gcp)
  ─────────────────────────────────                 ─────────────────────────────────────────
  logger/app-logger.service.ts   winston →stdout    logger/gcp-log-transports.ts
    JSON en dev/prod (Logs Explorer-ready)            transporte Cloud Logging en la costura
    costura EXTRA_LOG_TRANSPORTS                      EXTRA_LOG_TRANSPORTS
  config/loaders/config-loader.ts                   config/loaders/gcp/gcp-config-loader.ts
    JSON por entorno; falla si ve vault.*             vault.* → Secret Manager
                                                      (prefijo por GCP_SECRETS_PREFIX)
  storage/                                          storage/gcs-file-storage.ts
    file-storage.port.ts                              (canon: libs/infra/storage-gcs)
    local-file-storage.ts
    storage.module.ts
                                                    iac/*.tf.template (copia de iac/gcp,
                                                      vigilada por iac-drift.spec.ts)
```

Como en AWS, **no hay `instrument.ts`**: ningún SDK necesita parchear módulos al arranque.

## 2. Manifiesto del proveedor

`gcpInfra` en `INFRA_PROVIDERS` (`app/infra/providers.ts`), patrón `defineInfra` sin tocar
el tipo:

```typescript
export const gcpInfra = defineInfra({
  value: 'gcp',
  label: 'GCP (Secret Manager, GCS, Cloud Logging)',
  files: 'files-infra-gcp',
  dependencies: {
    '@google-cloud/logging-winston': '^6.0.0',
    '@google-cloud/secret-manager': '^5.6.0',
    '@google-cloud/storage': '^7.14.0'
  },
  apply(tree: Tree, context: PluginContext): void {
    useGcpConfigLoader(tree, context)        // config.module.ts → loaders/gcp/
    reshapeStorageConfigForGcs(tree, context) // sección storage: bucket (sin connectionString)
    bindGcsStorage(tree, context)            // StorageModule por sección de config
    addCloudLoggingConfigSection(tree, context)
    addGcpLogTransport(tree, context)        // provider en logger.module.ts (costura)
    nameTerraformProject(tree, context)      // variable "project" → nombre de la app
  }
})
```

El registro hace aparecer `--infra=gcp` en `schema.json` y `slots.json` → wizard (tests de
paridad ya existentes).

## 3. Catálogo: `libs/infra/config-gcp` (la pieza nueva con lógica)

Espejo de `config-aws`, misma firma y mismas garantías:

```typescript
export async function resolveGcpConfig<T>(
  rawConfig: T,
  client?: GcpSecretsReader,           // contrato estructural: fake en tests sin SDK
  options: GcpConfigLoaderOptions = {} // separator ('-') y prefix (GCP_SECRETS_PREFIX)
): Promise<T>
```

- Sin marcadores `vault.*` → devuelve el config tal cual, GCP nunca se toca (local/test sin
  credenciales, la propiedad clave de toda la familia).
- Cliente real: `SecretManagerServiceClient` de `@google-cloud/secret-manager`; el proyecto
  sale de ADC (`client.getProjectId()`), nunca de config. Nombre del secreto:
  `projects/${projectId}/secrets/${prefix}-${name}/versions/latest`.
- **Separador `-` y prefijo `${GCP_SECRETS_PREFIX}-`**: no es elección libre — el
  `secret-manager.tf` ya escrito nombra los secretos `${local.name}-typeorm-password` y
  `cloud-run.tf` ya inyecta `GCP_SECRETS_PREFIX = local.name`. El loader se pliega al
  contrato que la IaC ya fijó.
- `GcpSecretsError` con causa, espejo de `AwsSecretsError`.
- Contrato estructural del cliente para los tests (fake sin SDK, como `AwsSecretsReader`):

```typescript
export interface GcpSecretsReader {
  getProjectId(): Promise<string>
  accessSecretVersion(request: { name: string }): Promise<[{ payload?: { data?: Uint8Array | string | null } }]>
}
```

## 4. Logs: `@google-cloud/logging-winston` en vez de transporte propio

**Desviación deliberada respecto a la 47** (allí: transporte propio de ~60 líneas). El
motivo de escribir `CloudWatchLogsTransport` a mano fue que `winston-cloudwatch` está
abandonada y arrastra aws-sdk v2. En GCP no se da el motivo: **`@google-cloud/logging-winston`
es de Google, está mantenida y es exactamente esto** — un `winston.Transport` (`LoggingWinston`)
con batching, mapeo de severidad y detección de recurso incluidos. Escribir el nuestro sería
poseer 60 líneas para duplicar una pieza oficial viva (regla: pragmatismo > simetría).

Consecuencia: **no hay lib `observability-gcp`** — no queda lógica propia que testear en el
catálogo (el criterio de aceptación correspondiente del REQUIREMENTS se sustituye por este
diseño). Lo que sí se emite y testea es el *seam*:

```
  logger/gcp-log-transports.ts (subárbol, espejo de aws-log-transports.ts)
  config trae `cloudLogging.logName`  →  [new LoggingWinston({ logName })]
  no la trae                          →  []   (stdout ya llega a Logs Explorer en Cloud Run)
```

Los tests del plugin cubren el provider (decisión por sección de config); el transporte en
sí es de Google y no se re-testea.

## 5. Ficheros del subárbol `files-infra-gcp`

| Fichero emitido | Origen (canon) |
| --- | --- |
| `config/loaders/gcp/gcp-config-loader.ts` | `libs/infra/config-gcp` (§3), adaptado al estilo del loader aws emitido |
| `config/loaders/gcp/gcp-secret-resolver.ts` | ídem (partición espejo de aws) |
| `storage/gcs-file-storage.ts` | `libs/infra/storage-gcs` tal cual: `bucket` + `client?` (el `apiEndpoint` cubre fake-gcs-server local, como MinIO en S3) |
| `logger/gcp-log-transports.ts` | **nuevo** — provider sobre la costura (§4) |
| `iac/*.tf.template` + `iac/README.md` | copia de `iac/gcp` (§7), vigilada por `iac-drift.spec.ts` con la fila `['gcp', 'files-infra-gcp']` |

## 6. Secciones de config

Decididas por presencia, espejo exacto de AWS:

```typescript
// config-types.ts del emitido (añadidas por el subárbol/apply)
export interface StorageConfig {
  bucket: string        // GCS: solo bucket; projectId/credenciales por ADC
  apiEndpoint?: string  // fake-gcs-server en local, misma sección
}
export interface CloudLoggingConfig {
  logName: string       // default sugerido en los JSON: nombre de la app
}
```

- `vault.*` en dev/prod → Secret Manager (prefijo `GCP_SECRETS_PREFIX`, ya inyectado por
  `cloud-run.tf`).
- `storage` presente → GCS; ausente → disco local (binding idéntico a Blob/S3).
- `cloudLogging` presente → `LoggingWinston`; ausente → solo stdout.
- Proyecto/credenciales SIEMPRE de ADC (12-factor); nunca en config.

## 7. Terraform (`iac/gcp`)

Ya existen cloud-run/cloud-sql/gcs/secret-manager/artifact-registry/iam. Se añade:

- `logging.tf`: `google_logging_project_bucket_config` del bucket `_Default` con
  `retention_days` variable (default 30) — el homólogo de `retention_in_days` del log group
  de AWS. Cubre tanto el stdout reenviado por Cloud Run como el transporte directo.
- `iam.tf`: `roles/logging.logWriter` para la service account del backend (el transporte
  directo escribe; el reenvío de stdout no lo necesita, pero el rol es el mínimo que
  habilita ambos caminos).
- `outputs.tf`: nombre del log (`local.name`) para localizarlo en Logs Explorer.
- `iac/gcp/README.md` (hoy no existe): espejo del de AWS — qué crea, variables, bootstrap
  en dos applies, relación con las secciones de config del emitido, y 3-4 queries de
  ejemplo de Logs Explorer sobre los campos del JSON (`level`, `context`, `message`).

Tras completarlo, la copia entra en `files-infra-gcp/iac/` y `nameTerraformProject` templa
el default de `variable "project"` (mismo mecanismo que aws; el test de deriva lo congela).

## 8. El candado

`infra-free.spec.ts` se extiende: una app sin infra no contiene `@google-cloud/` en ningún
fichero emitido ni en `package.json`. Aquí no hay excepción tipo SES: ningún plugin aditivo
declara SDKs de Google.

## 9. Fixtures y gates

Sin fixture nueva y sin re-baseline: `app` sigue en `--infra=azure`. GCP se valida con:

- unit tests del plugin (manifiesto, apply, paridad schema/slots, fila gcp en iac-drift),
- unit tests del catálogo (`config-gcp` con fake estructural),
- candado extendido,
- typecheck fuera del árbol (§10).

## 10. Testing

- Unit (catálogo): `resolveGcpConfig` — sin marcadores no toca el cliente, resolución con
  prefijo/separador, error envuelto en `GcpSecretsError`, payload string/Uint8Array.
- Unit (plugin): registro del proveedor, deps declaradas, loader cambiado, binding GCS por
  sección, provider del transporte en `logger.module.ts`, `--infra=gcp` en schema/slots,
  deriva iac/gcp ↔ subárbol.
- Candado: sin `@google-cloud/` en el emitido sin infra.
- Golden: 6 gates vacíos SIN re-baseline.
- Verificación manual (una vez):
  `tools/typecheck-emitted.sh --models=customer,contract,license,project --plugins=auth,email --infra=gcp --dashboard`
  fuera del monorepo, `npm install` + `tsc` a 0 errores.
- Terraform: `terraform fmt -check` + `terraform validate` en `iac/gcp` (sin apply ni plan:
  no hay cuenta GCP de pruebas; queda documentado, no fingido).

## Decisiones técnicas

- **`@google-cloud/logging-winston` en vez de transporte propio** (§4): la razón de la 47
  (lib de terceros abandonada) no existe aquí; la pieza oficial está viva y hace batching,
  severidad y recurso. Menos código que poseer. Consecuencia: sin lib `observability-gcp`.
- **El contrato de nombres de secretos lo fija la IaC ya escrita** (§3): separador `-`,
  prefijo `local.name`. El loader se adapta a Terraform y no al revés.
- **`client.getProjectId()` (ADC) para el nombre completo del secreto**: Secret Manager
  exige `projects/<p>/secrets/<s>`; el proyecto sale de las credenciales del entorno, nunca
  de config (12-factor, mismo principio que región en AWS).
- **Retención sobre el bucket `_Default` y no un log bucket propio**: Cloud Run escribe ahí
  de serie; un bucket dedicado obligaría a un sink + exclusión (dos piezas más) para el
  mismo resultado. YAGNI.
- **Fixture de oro se queda en Azure**: tres fixtures por proveedor no escalan; dos
  dimensiones (con/sin infra) ya están cubiertas.

## Riesgos identificados

- **Versiones de los SDK `@google-cloud/*`**: se declaran en el manifiesto sin lockfile del
  emitido; el typecheck fuera del árbol (§10) es el detector si un major rompe tipos.
- **`logging-winston` arrastra `@google-cloud/logging`** (dependencia transitiva pesada):
  aceptado — solo entra con `--infra=gcp`, y el candado garantiza que no se filtra al resto.
- **Deriva catálogo ↔ subárbol** (`config-gcp` y `storage-gcs` duplicados en el emitido):
  riesgo conocido y aceptado como en azure/aws; el canon es el catálogo.
- **`terraform plan` sin cuenta GCP**: `fmt`/`validate` corren en frío; el plan real queda
  como verificación pendiente documentada.
