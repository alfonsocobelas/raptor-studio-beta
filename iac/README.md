# IaC multi-proveedor

Un stack Terraform por proveedor, espejo componente a componente (ADR-004:
puertos estables, adapters por proveedor — la infra sigue el mismo patrón).

| Componente         | Azure (`iac/azure`)        | AWS (`iac/aws`)            | GCP (`iac/gcp`)          |
| ------------------ | -------------------------- | -------------------------- | ------------------------ |
| Registro imágenes  | ACR                        | ECR                        | Artifact Registry        |
| Cómputo (api/front)| Container Apps             | App Runner                 | Cloud Run v2             |
| Postgres           | Flexible Server            | RDS (`rds.force_ssl`)      | Cloud SQL (sin IP púb.)  |
| Secretos           | Key Vault                  | Secrets Manager            | Secret Manager           |
| Storage            | Storage Account (Blob)     | S3 (privado + versioning)  | GCS (privado + versioning)|
| Email transaccional| ACS                        | SES (identidad de dominio) | — (SendGrid/SES externo) |
| Identidad runtime  | Managed Identity + RBAC    | IAM instance role          | Service Account + IAM    |
| Observabilidad     | App Insights/Log Analytics | CloudWatch (integrado)     | Cloud Logging (integrado)|

Convenciones comunes a los tres:

- **Naming**: `${project}-${env}` como prefijo de todo; tags/labels `project/environment/managed_by`.
- **Secretos**: los stacks escriben en el gestor del proveedor las MISMAS claves
  que consumen los loaders (`vault.DB-PASSWORD`, `DB-HOST`, `DB-USER`, `DB-NAME`)
  vía `@acc/infra-config-azure` / `config-aws`. Nunca secretos en tfvars commiteados.
- **Bootstrap en dos apply**: el primero crea registro+datos (sin servicios de
  cómputo: la imagen aún no existe); tras el primer push se rellena
  `backend_image`/`frontend_image` y el segundo apply crea los servicios.
- **Estado remoto**: backend parcial (S3 con lockfile / GCS / azurerm); el bucket
  o storage account del estado se crea una única vez fuera del stack.
- **Validación**: `terraform init -backend=false && terraform validate` por stack
  (sin credenciales); los tres se validan en local antes de commitear.

GCP no tiene email transaccional nativo: se cubre con SES cross-cloud o un
tercero (SendGrid) detrás del mismo puerto de email del catálogo.
