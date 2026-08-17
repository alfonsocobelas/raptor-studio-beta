# Terraform — SAP Licenses en Azure Container Apps

Un stack completo por entorno (state y valores separados). Los valores **nunca van al repo**:
llegan por el environment de GitHub (`Development` ← develop, `Production` ← main) a dos workflows:

- `terraform-deployment.yml` — `plan`/`apply` de esta carpeta (infra).
- `cd.yml` — build+push de imágenes al ACR y deploy de apps/jobs (código).

## Configuración del environment de GitHub

### Secrets

| Secret         | Contenido                                                                  |
| -------------- | -------------------------------------------------------------------------- |
| `TF_VARS_JSON` | JSON con las variables de Terraform del entorno (ver abajo). Es secret, no |
|                | variable: contiene la password de Postgres y los secretos del Key Vault.   |

### Variables

| Variable                       | Uso                                                              |
| ------------------------------ | ---------------------------------------------------------------- |
| `AZURE_CLIENT_ID`              | App registration con federated credential del environment (OIDC) |
| `AZURE_TENANT_ID`              | Tenant de Azure                                                  |
| `AZURE_SUBSCRIPTION_ID`        | Suscripción del entorno                                          |
| `TFSTATE_RESOURCE_GROUP_NAME`  | RG de la storage account del state                               |
| `TFSTATE_STORAGE_ACCOUNT_NAME` | Storage account del state                                        |
| `TFSTATE_CONTAINER_NAME`       | Container del state                                              |
| `TFSTATE_KEY_PREFIX`           | Prefijo del blob del state (`<prefijo>-<Environment>.tfstate`)   |
| `ACR_NAME`                     | Nombre corto del ACR (login server = `<ACR_NAME>.azurecr.io`)    |
| `RESOURCE_GROUP`               | RG del stack (= `resource_group_name` del TF_VARS_JSON)          |
| `BACKEND_APP_NAME`             | Nombre de la Container App del back (default terraform)          |
| `FRONTEND_APP_NAME`            | Nombre de la Container App del front (default terraform)         |
| `MIGRATE_JOB_NAME`             | Nombre del Job de migración (default terraform)                  |

## `TF_VARS_JSON`

Variables **sin default** (obligatorias en el JSON):

| Variable                  | Ejemplo / nota                                               |
| ------------------------- | ------------------------------------------------------------ |
| `resource_group_name`     | `rg-acelerador-dev`                                          |
| `acr_name`                | `acraceleradordev` — único global, solo alfanumérico         |
| `key_vault_name`          | `kv-acelerador-dev` — único global                           |
| `storage_account_name`    | `staceleradordev` — único global (3-24, minúsculas alfanum)  |
| `key_vault_secrets`       | map nombre → valor (ver tabla siguiente)                     |
| `postgres_server_name`    | `psql-acelerador-dev` — único global (DNS)                   |
| `postgres_admin_login`    | login del admin (también usuario de migraciones)             |
| `postgres_admin_password` | password del admin                                           |
| `postgres_allowed_ips`    | mapa nombre → `{start, end?}` de IPs autorizadas (DBeaver)   |
| `node_env`                | `dev` / `qa` / `prod` — elige el JSON del config-loader      |
| `backend_image`           | imagen inicial; después la gobierna el CD (`ignore_changes`) |
| `frontend_image`          | ídem                                                         |
| `migrate_image`           | ídem                                                         |

Con default (solo si quieres otro valor): `tags` (`{}`),
`managed_identity_name`, `log_analytics_workspace_name`, `container_app_environment_name`,
`backend_app_name`, `frontend_app_name`, `migrate_job_name`, `sap_sync_job_name`,
`postgres_database_name` (`acelerador`), `storage_container_name` (`qbr-evidences`),
`communication_service_name`, `email_communication_service_name`, `communication_data_location`
(`Europe`), `acs_custom_sender_domain` (`acelerador.avvale.com`), `acs_custom_sender_username`
(`noreply`), `frontend_custom_domain` (`""`), `frontend_custom_domain_verified` (`false`).

Ejemplo (Development):

```json
{
  "resource_group_name": "rg-acelerador-dev",
  "acr_name": "acraceleradordev",
  "key_vault_name": "kv-acelerador-dev",
  "storage_account_name": "staceleradordev",
  "postgres_server_name": "psql-acelerador-dev",
  "postgres_admin_login": "saplicadmin",
  "postgres_admin_password": "<password>",
  "postgres_allowed_ips": { "alfonso_cobelas": { "start": "x.x.x.x" } },
  "node_env": "dev",
  "backend_image": "acraceleradordev.azurecr.io/acelerador-backend:latest",
  "frontend_image": "acraceleradordev.azurecr.io/acelerador-frontend:latest",
  "migrate_image": "acraceleradordev.azurecr.io/acelerador-migrate:latest",
  "key_vault_secrets": {
    "typeorm-type": "postgres",
    "typeorm-host": "psql-acelerador-dev.postgres.database.azure.com",
    "typeorm-port": "5432",
    "typeorm-username": "saplicadmin",
    "typeorm-password": "<password>",
    "typeorm-database": "acelerador",
    "sap-sync-user": "<user>",
    "sap-sync-pass": "<pass>",
    "sap-sync-api-key": "<api-key>",
    "cors-origin": "https://<fqdn-del-front>",
    "app-base-url": "https://<fqdn-del-front>"
  }
}
```

## Secretos del Key Vault (`key_vault_secrets`)

El config-loader del back resuelve cada placeholder `vault.x.y` de
`libs/backend/src/contexts/shared/infrastructure/config/environments/<node_env>.json`
contra el secreto `x-y` (regla: fuera el prefijo, puntos → guiones).

| Secreto                                 | Placeholder                                                                                                                | Entornos                  |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| `typeorm-type`                          | `vault.typeorm.type`                                                                                                       | todos                     |
| `typeorm-host`                          | `vault.typeorm.host`                                                                                                       | todos                     |
| `typeorm-port`                          | `vault.typeorm.port`                                                                                                       | todos                     |
| `typeorm-username`                      | `vault.typeorm.username`                                                                                                   | todos                     |
| `typeorm-password`                      | `vault.typeorm.password`                                                                                                   | todos                     |
| `typeorm-database`                      | `vault.typeorm.database`                                                                                                   | todos                     |
| `sap-sync-user`                         | `vault.sap-sync.user`                                                                                                      | todos                     |
| `sap-sync-pass`                         | `vault.sap-sync.pass`                                                                                                      | todos                     |
| `sap-sync-api-key`                      | `vault.sap-sync.api-key`                                                                                                   | todos (y el job sap-sync) |
| `cors-origin`                           | `vault.cors.origin`                                                                                                        | todos                     |
| `app-base-url`                          | `vault.app.base-url` — URL absoluta del front (enlaces de email); mismo valor que `cors-origin`                            | todos                     |
| `logger-level`                          | `vault.logger.level`                                                                                                       | solo prod                 |
| `applicationinsights-connection-string` | — NO va en `key_vault_secrets`: lo escribe Terraform (`application-insights.tf`) y lo referencia la Container App del back | todos                     |
| `acs-connection-string`                 | `vault.acs.connection-string` — NO va en `key_vault_secrets`: lo escribe Terraform (`communication.tf`)                    | todos                     |
| `acs-sender-address`                    | `vault.acs.sender-address` — NO va en `key_vault_secrets`: lo escribe Terraform (`communication.tf`)                       | todos                     |
| `storage-connection-string`             | `vault.storage.connection-string` — NO va en `key_vault_secrets`: lo escribe Terraform (`storage.tf`)                      | todos                     |

## Pasos manuales por entorno (una vez)

1. **Federated credential** del app registration para cada environment de GitHub
   (subject `environment:Development` / `environment:Production`) con permisos de
   contribuir sobre el RG (y AcrPush — concedido en `c99fe08`).
2. **Roles de Postgres** (DBeaver): `iac/sql/create-readonly-group.sql` (solo lectura) y
   `create-readwrite-group.sql` (lectura y escritura), y luego `create-db-user.sql` por
   persona (instrucciones en sus cabeceras). El acceso "superuser" es el propio
   `postgres_admin_login`.

   Para un mantenimiento puntual de un compañero, la escritura se da y se quita con
   `grant-write-access.sql` / `revoke-write-access.sql` (mueven la membresía del grupo, no
   borran al usuario). En **producción** nadie debe quedarse miembro del grupo `rw` en
   reposo, y hay que acordarse de quitar su IP de `postgres_allowed_ips` al acabar.

3. **Dominio propio del front** (`licencias.avvale.com` en prod, `licencias-dev.avvale.com` en
   dev). Va en dos fases porque Azure no emite el certificado gestionado hasta que el hostname
   ya resuelve a la app:

   1. Poner `frontend_custom_domain` en el `TF_VARS_JSON` dejando
      `frontend_custom_domain_verified` en `false`, y aplicar. Esto no toca Azure: solo hace que
      el output `frontend_custom_domain_dns_records` publique el CNAME y el TXT `asuid.` que
      necesita IT.
   2. Cuando IT confirme los registros, flip de `frontend_custom_domain_verified` a `true` y
      re-apply. Azure valida el dominio, emite el certificado (gratuito, se renueva solo) y lo
      enlaza. Tarda unos minutos.

   Después, y **solo después** de que la URL nueva responda, cambiar `cors-origin` y
   `app-base-url` en `key_vault_secrets`. Si se cambian antes, los enlaces de los emails de
   invitación apuntan a una URL que todavía no existe.

   Si `avvale.com` tuviera algún registro CAA, IT debe añadir `0 issue digicert.com` o la
   emisión del certificado falla.

4. Cargar `TF_VARS_JSON` (secret) y las variables de la tabla en el environment.
