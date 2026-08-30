# Spec: Proveedor `infra=gcp` (C4)

## Contexto de negocio

Última pieza de la matriz de infra del ROADMAP (C4). La ranura `infra` ya tiene cuatro
proveedores (`none`, `azure`, `aws`, `raptor`); GCP cierra la cuadrícula de las tres nubes
grandes. Parte del catálogo ya existe: `@raptor/infra-storage-gcs` (ficheros, sobre
`@google-cloud/storage`) y el stack Terraform completo en `iac/gcp/` (Cloud Run, Cloud SQL,
GCS, Secret Manager, Artifact Registry, IAM). Lo que falta es lo mismo que faltaba en la
spec 47 para AWS: **convertir las piezas en un proveedor de la ranura `infra`** y cubrir los
dos huecos reales: **config contra Secret Manager** (no existe `config-gcp`) y
**observabilidad con Cloud Logging**.

## User stories (formato EARS)

- WHEN se genera una app con `--infra=gcp` THEN el módulo de config resuelve los marcadores
  `vault.*` contra GCP Secret Manager (loader emitido en
  `config/loaders/gcp/gcp-config-loader.ts`, proyecto por `GCP_PROJECT_ID` y prefijo de
  secretos por `GCP_SECRETS_PREFIX`, espejo de `AWS_SECRETS_PREFIX`).
- WHEN se genera una app con `--infra=gcp` THEN los ficheros van a GCS si la sección
  `storage` de config está presente, y a disco local si no (mismo binding por-sección que
  Blob y S3).
- WHEN se genera una app con `--infra=gcp` THEN los logs del backend salen como **JSON
  estructurado** consultable en Cloud Logging (Cloud Run reenvía stdout solo), y con la
  sección de config de Cloud Logging presente se añade un transporte directo vía la costura
  `EXTRA_LOG_TRANSPORTS` (espejo exacto de `aws-log-transports`).
- IF la app se genera sin `--infra` THEN no aparece ninguna clase, import ni dependencia
  `@google-cloud/*` en el emitido (candado `infra-free` extendido a GCP).
- WHEN se genera una app con `--infra=gcp` THEN `apps/<app>/iac/` contiene la copia del
  stack `iac/gcp` con el nombre del proyecto ya puesto, y el test de deriva
  (`iac-drift.spec.ts`) vigila la fila `['gcp', 'files-infra-gcp']`.
- WHEN se despliega con `iac/gcp` THEN la service account del servicio tiene permisos de
  mínimo privilegio para Secret Manager (accessor), GCS (objectAdmin sobre el bucket) y
  Cloud Logging (logWriter), espejo de la policy IAM de AWS.

## Criterios de aceptación

- [ ] `INFRA_PROVIDERS` incluye `gcpInfra` con manifiesto (`files-infra-gcp`, dependencias
      `@google-cloud/*` declaradas) y `--infra=gcp` aparece en `schema.json` y `slots.json`
      (tests de paridad en verde) y en el wizard del estudio sin más cableado.
- [ ] Nueva lib de catálogo `libs/infra/config-gcp` (lector de Secret Manager + resolución
      de marcadores `vault.*`) con tests unitarios sobre cliente fake estructural, espejo de
      `config-aws`; el subárbol emite el mismo código (canon = catálogo).
- [ ] Nueva lib de catálogo `libs/infra/observability-gcp` (`CloudLoggingTransport`,
      winston.Transport sobre `@google-cloud/logging`) con tests unitarios (batching,
      severidad mapeada, error de envío se traga a stderr), espejo de `observability-aws`.
- [ ] Subárbol `files-infra-gcp` con: `gcp-config-loader.ts`, `gcp-secret-resolver.ts`,
      `gcs-file-storage.ts` (canon `storage-gcs`) y `logger/gcp-log-transports.ts`.
- [ ] `apply()` del proveedor: cambia el config-loader, enlaza GCS en `StorageModule` por
      sección de config, enchufa el transporte Cloud Logging en la costura, y pone nombre
      al proyecto Terraform (espejo de `nameTerraformProject` de aws).
- [ ] `iac/gcp/` completado: retención de logs configurable si aplica (bucket `_Default` o
      recurso propio — decidir en DESIGN), rol `roles/logging.logWriter` en `iam.tf`, y
      `iac/gcp/README.md` (hoy no existe: crearlo, espejo del de AWS, con 3-4 queries de
      ejemplo de Logs Explorer sobre los campos del JSON del logger).
- [ ] Candado `infra-free.spec.ts` extendido: una app sin infra no nombra nada de
      `@google-cloud/` en ficheros ni en `package.json`.
- [ ] Los 6 gates de oro en verde SIN re-baseline (la fixture de `app` sigue en
      `--infra=azure`; GCP se valida con specs del plugin + typecheck del emitido).
- [ ] Verificación fuera del árbol: app generada con `--infra=gcp --plugins=auth,email`,
      movida fuera del monorepo, `npm install` + `tsc` a 0 errores
      (`tools/typecheck-emitted.sh`).

## Referencias del proyecto de referencia

- `.claude/specs/47-infra-aws/` — la spec espejo; misma secuencia de tareas y decisiones.
- `libs/generators/src/generators/app/infra/providers.ts` — `awsInfra` como patrón directo
  (loader + storage + transporte + `nameTerraformProject`).
- `libs/generators/src/generators/app/files-infra-aws/` — forma del subárbol a espejar.
- `libs/infra/storage-gcs/src/lib/gcs-file-storage.ts` — adapter GCS ya escrito (canon).
- `libs/infra/config-aws/` y `libs/infra/observability-aws/` — forma de las dos libs nuevas.
- `iac/gcp/` — stack ya escrito; solo se completa (README, logging, rol logWriter).

## Reglas de negocio aplicables

- Regla de los dos: los puertos (`vault.*`, `FileStoragePort`, `EXTRA_LOG_TRANSPORTS`) ya
  están validados con 3+ adapters; aquí NO se abre ninguna abstracción nueva.
- Plantillas tontas, lógica en `generator.ts`/`providers.ts`.
- El emitido debe compilar fuera del monorepo con sus dependencias declaradas.
- Región/proyecto/credenciales SIEMPRE del entorno estándar GCP (ADC, 12-factor); nunca en
  config.

## Decisiones ya tomadas (heredadas de la 47, no re-litigar)

- **Telemetría = opción 1 de la spec 47**: logs JSON a stdout (Cloud Run → Cloud Logging
  automático) + transporte directo opcional por sección de config. Sin OTel/Cloud Trace.
  El ROADMAP dice «Cloud Monitoring», pero el equivalente honesto del catálogo es **Cloud
  Logging** (Logs Explorer); métricas custom fuera (el puerto de métricas ya es Prometheus).
- **Fixture de oro se queda en Azure**: sin fixture nueva ni re-baseline.
- **Transporte winston propio** sobre el SDK oficial, no una lib de terceros abandonada.

## Fuera de scope (deliberado)

- Trazas distribuidas / Cloud Trace / OTel.
- Métricas custom en Cloud Monitoring (el puerto de métricas ya tiene Prometheus).
- Email: GCP no tiene servicio nativo de email; el plugin `email` (Brevo/SES) compone sin
  tocarse.
- Cambiar la fixture de oro de `app` a GCP.
- `terraform apply` real (sin cuenta GCP de pruebas: `terraform validate` + `fmt` como en
  las specs 47/50; el plan queda documentado como verificación pendiente si exige
  credenciales).
