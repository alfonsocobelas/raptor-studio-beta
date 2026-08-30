# Terraform — stack GCP del acelerador

Espejo de los stacks de Azure (`iac/azure`) y AWS (`iac/aws`) para apps generadas con
`--infra=gcp`. Un stack completo por entorno: Cloud Run (backend + frontend), Cloud SQL
Postgres, GCS, Secret Manager, Artifact Registry y Cloud Logging. Los valores **nunca van
al repo** (misma regla que Azure/AWS).

## Qué crea cada fichero

| Fichero                | Recursos                                                                  |
| ---------------------- | ------------------------------------------------------------------------- |
| `cloud-run.tf`         | Servicios Cloud Run v2 del back y el front (inyecta `GCP_SECRETS_PREFIX`) |
| `cloud-sql.tf`         | Postgres (password generada → Secret Manager)                             |
| `secret-manager.tf`    | Secretos `${local.name}-<clave>` que resuelve el config-loader (`vault.*`) |
| `gcs.tf`               | Bucket de adjuntos (sección de config `storage`)                          |
| `logging.tf`           | Retención del bucket `_Default` de Cloud Logging                          |
| `iam.tf`               | Service account del back con menor privilegio (Cloud SQL, secretos, bucket, logs) |
| `artifact-registry.tf` | Repositorio de imágenes                                                    |

## Variables

Sin default (obligatorias): `project_id`, `env`. Con default: `project` (`acelerador`),
`region` (`europe-west1`), `db_name`, `db_username`, `db_tier` (`db-f1-micro`),
`backend_image` / `frontend_image` (vacías en el primer apply, el registry aún está vacío),
`log_retention_days` (`30`).

## Secretos y marcadores `vault.*`

El config-loader del back (`loaders/gcp/gcp-config-loader.ts`) resuelve cada marcador
`vault.x.y` del JSON de entorno contra el secreto `${GCP_SECRETS_PREFIX}-x-y` (regla:
fuera el prefijo `vault.`, puntos → guiones; el namespace lo inyecta `cloud-run.tf` como
`GCP_SECRETS_PREFIX = local.name`, espejo de `AWS_SECRETS_PREFIX`). El proyecto sale de
las Application Default Credentials, nunca de la config.

| Secreto (`${local.name}-…`) | Placeholder              | Origen                          |
| --------------------------- | ------------------------ | ------------------------------- |
| `typeorm-host`              | `vault.typeorm.host`     | lo escribe Terraform (Cloud SQL) |
| `typeorm-username`          | `vault.typeorm.username` | Terraform                       |
| `typeorm-password`          | `vault.typeorm.password` | Terraform (generada)            |
| `typeorm-database`          | `vault.typeorm.database` | Terraform                       |

## Secciones de config de la app emitida

| Sección        | Campos                  | Efecto                                                                        |
| -------------- | ----------------------- | ------------------------------------------------------------------------------ |
| `storage`      | `bucket`, `apiEndpoint?` | presente → adjuntos a GCS; ausente → disco local (apiEndpoint = fake-gcs-server local) |
| `cloudLogging` | `logName` (= output `log_name`) | presente → transporte directo a Cloud Logging; ausente → solo stdout   |

**Nota sobre logs**: en Cloud Run el stdout del servicio ya llega solo a Cloud Logging
(logName `run.googleapis.com/stdout`), y el logger emite JSON estructurado en dev/prod
—Cloud Logging lo indexa como `jsonPayload`— así que Logs Explorer funciona **sin** la
sección `cloudLogging`. La sección solo hace falta en despliegues donde nada recoge stdout.

## Queries de ejemplo (Logs Explorer)

Sobre los campos del JSON del logger (`level`, `message`, `context`, `trace`), que Cloud
Logging expone bajo `jsonPayload`:

```
# Errores recientes con su contexto
resource.type="cloud_run_revision"
jsonPayload.level="error"
```

```
# Actividad de un módulo concreto (context = clase NestJS que logueó)
resource.type="cloud_run_revision"
jsonPayload.context=~"UserService"
```

```
# Trazas de error completas (el campo trace solo viaja en level=error)
resource.type="cloud_run_revision"
jsonPayload.trace:*
```

```
# Lo enviado por el transporte directo (LoggingWinston), fuera de Cloud Run
logName="projects/<project_id>/logs/<log_name>"
```

## Pasos manuales por entorno (una vez)

1. **APIs habilitadas**: `run`, `sqladmin`, `secretmanager`, `artifactregistry`, `logging`
   (una vez por proyecto: `gcloud services enable ...`).
2. **Primer apply en dos fases**: aplicar con `backend_image`/`frontend_image` vacías
   (crea el Artifact Registry), hacer push de las imágenes, y re-aplicar con las URIs.
3. **Email**: GCP no tiene servicio nativo; el plugin `email` (Brevo/SES) se configura
   aparte por su propia sección de config.
