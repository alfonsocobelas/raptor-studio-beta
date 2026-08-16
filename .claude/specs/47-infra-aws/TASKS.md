# Tareas atómicas: proveedor `infra=aws` (C3)

> Cada tarea = un commit atómico en develop. Implementar UNA, commitear, informar, siguiente.
> Gate permanente: los 6 golden en verde (SIN re-baseline en esta spec) antes de cada commit.
> TDD: test fallido primero en cada tarea con lógica.

---

## Catálogo (la pieza nueva primero)

- [x] **TASK-01** (`bd2a64e7`): Tests + `CloudWatchLogsTransport` en la lib nueva
      `libs/infra/observability-aws` (winston.Transport sobre
      `@aws-sdk/client-cloudwatch-logs`, cliente fake estructural). Cubre: creación perezosa
      del log stream, lote con flush por tamaño/intervalo, timestamps del evento, error de
      envío se traga a stderr sin propagar. Barrel + project.json como las libs hermanas.

## Proveedor en el generador

- [x] **TASK-02** (`37336ce1`): Tests + manifiesto `awsInfra` en `app/infra/providers.ts` (value, label,
      `files: 'files-infra-aws'`, 3 dependencias `@aws-sdk/*`) registrado en
      `INFRA_PROVIDERS`. `--infra=aws` aparece en `schema.json` y `slots.json` (tests de
      paridad en verde). Subárbol con el primer fichero: `aws-config-loader.ts` (copiado del
      canon `config-aws`, adaptado al estilo del loader azure emitido) + `apply()` con
      `useAwsConfigLoader` (cambia el import en `config.module.ts`).
- [x] **TASK-03** (`9681c872`): Tests + storage: el subárbol emite `s3-file-storage.ts` (canon
      `storage-s3`) y `apply()` enlaza S3 en `StorageModule` por sección de config
      (`storage` presente → S3; ausente → disco local), espejo de `bindBlobStorage`.
      Secciones de config (`storage` con bucket/region/endpoint, `cloudwatch`) en
      config-types + config-validation del emitido.
- [x] **TASK-04** (`e7e8da2b`): Tests + logs: el subárbol emite `logger/aws-log-transports.ts` (mismo
      código que el catálogo TASK-01, decidido por sección `cloudwatch`) y `apply()` lo
      registra en la costura `EXTRA_LOG_TRANSPORTS` de `logger.module.ts`, espejo de
      `addAwsLogTransport` azure.
- [x] **TASK-05** (`f96fc406`): Candado extendido en `infra-free.spec.ts`: una app sin infra no contiene
      `@aws-sdk/` en ficheros ni en `package.json`; caso documentado aparte: `auth,email`
      sin infra sí lleva `@aws-sdk/client-ses` (es del plugin email, no de la ranura).

## Terraform

- [x] **TASK-06** (`70ddf1bd`): `iac/aws/cloudwatch.tf` (log group `local.name`, `retention_in_days`
      variable con default 30) + policy IAM ampliada (`logs:CreateLogStream`,
      `logs:PutLogEvents` sobre ese group, sin `CreateLogGroup`) + output del nombre.
      `terraform validate` en verde.
- [x] **TASK-07** (`d5d70e5b`): `iac/aws/README.md` espejo del de Azure: qué crea, variables, cómo se
      relaciona con las secciones de config del emitido, y 3-4 queries de ejemplo de Log
      Insights sobre los campos del JSON del logger.

## Verificación

- [x] **TASK-08** (2026-08-16): Verificación fuera del árbol con
      `tools/typecheck-emitted.sh --models=customer,contract,license,project --plugins=auth,email --infra=aws --dashboard`:
      `npm install` + `tsc` (backend, shared y frontend) a **0 errores** fuera del monorepo.
      Suite del plugin 764 en verde + 7 de `infra-observability-aws` + 6 golden vacíos
      **sin re-baseline** en toda la spec (nada se filtró a la base).

---

## Regla del juego

Implementar **UNA** tarea, commit, esperar aprobación antes de seguir.
Si una tarea parece > 1h o > ~150 líneas, partirla en subtareas antes de empezar.
