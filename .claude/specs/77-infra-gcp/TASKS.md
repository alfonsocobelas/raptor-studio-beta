# Tareas atómicas: proveedor `infra=gcp` (C4)

> Cada tarea = un commit atómico en develop. Implementar UNA, commitear, informar, siguiente.
> Gate permanente: los 6 golden en verde (SIN re-baseline en esta spec) antes de cada commit.
> TDD: test fallido primero en cada tarea con lógica.

---

## Catálogo (la pieza nueva primero)

- [ ] **TASK-01**: Tests + `resolveGcpConfig` en la lib nueva `libs/infra/config-gcp`
      (espejo de `config-aws`): `GcpSecretsReader` estructural (`getProjectId` +
      `accessSecretVersion`), `GcpSecretsError`, separador `-` y prefijo
      `GCP_SECRETS_PREFIX`. Cubre: sin marcadores no toca el cliente, resolución
      `projects/<p>/secrets/<prefix>-<name>/versions/latest`, payload string/Uint8Array,
      error envuelto. Barrel + project.json como las libs hermanas.

## Proveedor en el generador

- [ ] **TASK-02**: Tests + manifiesto `gcpInfra` en `app/infra/providers.ts` (value, label,
      `files: 'files-infra-gcp'`, dependencias `@google-cloud/*`) registrado en
      `INFRA_PROVIDERS`. `--infra=gcp` en `schema.json` y `slots.json` (paridad en verde).
      Subárbol con los primeros ficheros: `gcp-config-loader.ts` + `gcp-secret-resolver.ts`
      (canon `config-gcp`, adaptados al estilo del loader aws emitido) + `apply()` con
      `useGcpConfigLoader` (cambia el import en `config.module.ts`).
- [ ] **TASK-03**: Tests + storage: el subárbol emite `gcs-file-storage.ts` (canon
      `storage-gcs`) y `apply()` enlaza GCS en `StorageModule` por sección de config
      (`storage` presente → GCS; ausente → disco local), espejo de `bindS3Storage`.
      Sección `storage` con bucket/apiEndpoint en config-types + config-validation del
      emitido (`reshapeStorageConfigForGcs`).
- [ ] **TASK-04**: Tests + logs: el subárbol emite `logger/gcp-log-transports.ts` (provider
      sobre `EXTRA_LOG_TRANSPORTS` que instancia `LoggingWinston` de
      `@google-cloud/logging-winston` si la sección `cloudLogging.logName` está presente;
      sin transporte propio — decisión del DESIGN §4) y `apply()` lo registra en la costura
      + sección `cloudLogging` en config-types (`addCloudLoggingConfigSection`).
- [ ] **TASK-05**: Candado extendido en `infra-free.spec.ts`: una app sin infra no contiene
      `@google-cloud/` en ficheros ni en `package.json` (sin excepciones: ningún plugin
      aditivo usa SDKs de Google).

## Terraform

- [ ] **TASK-06**: `iac/gcp/logging.tf` (`google_logging_project_bucket_config` del bucket
      `_Default`, `retention_days` variable con default 30) + `roles/logging.logWriter`
      para la service account en `iam.tf` + output del nombre del log.
      `terraform fmt -check` + `terraform validate` en verde.
- [ ] **TASK-07**: `iac/gcp/README.md` espejo del de AWS: qué crea, variables, bootstrap en
      dos applies, relación con las secciones de config del emitido, y 3-4 queries de
      ejemplo de Logs Explorer sobre los campos del JSON del logger.
- [ ] **TASK-08**: La IaC viaja en el emitido: copia de `iac/gcp` como
      `files-infra-gcp/iac/*.tf.template` + README, `nameTerraformProject` en `apply()`
      (default de `variable "project"` = nombre de la app) y fila
      `['gcp', 'files-infra-gcp']` en `iac-drift.spec.ts` (test de deriva en verde).

## Verificación

- [ ] **TASK-09**: Verificación fuera del árbol con
      `tools/typecheck-emitted.sh --models=customer,contract,license,project --plugins=auth,email --infra=gcp --dashboard`:
      `npm install` + `tsc` (backend, shared y frontend) a **0 errores** fuera del
      monorepo. Suite del plugin + `infra-config-gcp` en verde + 6 golden vacíos **sin
      re-baseline** en toda la spec.

---

## Regla del juego

Implementar **UNA** tarea, commit, esperar aprobación antes de seguir.
Si una tarea parece > 1h o > ~150 líneas, partirla en subtareas antes de empezar.
