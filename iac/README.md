# IaC multi-proveedor

Un stack Terraform por proveedor, espejo componente a componente (ADR-004:
puertos estables, adapters por proveedor — la infra sigue el mismo patrón).

| Componente         | Azure (`iac/azure`)        | AWS (`iac/aws`)            | GCP (`iac/gcp`)          | Raptor Cloud (`iac/hetzner`)   |
| ------------------ | -------------------------- | -------------------------- | ------------------------ | ------------------------------ |
| Registro imágenes  | ACR                        | ECR                        | Artifact Registry        | — (registro externo/GHCR)      |
| Cómputo (api/front)| Container Apps             | App Runner                 | Cloud Run v2             | Un VPS + Docker Compose + Caddy|
| Postgres           | Flexible Server            | RDS (`rds.force_ssl`)      | Cloud SQL (sin IP púb.)  | Contenedor sobre volumen        |
| Secretos           | Key Vault                  | Secrets Manager            | Secret Manager           | Infisical (alta manual)         |
| Storage            | Storage Account (Blob)     | S3 (privado + versioning)  | GCS (privado + versioning)| Cloudflare R2 (alta manual)    |
| Email transaccional| ACS                        | SES (identidad de dominio) | — (SendGrid/SES externo) | Brevo (alta manual)             |
| Identidad runtime  | Managed Identity + RBAC    | IAM instance role          | Service Account + IAM    | Machine identity de Infisical   |
| Observabilidad     | App Insights/Log Analytics | CloudWatch (integrado)     | Cloud Logging (integrado)| Grafana Cloud Loki + Sentry     |

Raptor Cloud rompe el espejo a propósito: es la opción **low cost**, y su stack solo crea el
servidor. Los SaaS con capa gratuita que cubren el resto se dan de alta a mano una vez —
añadir dos proveedores Terraform más para gestionarlos sería coste sin retorno. Tampoco
ofrece alta disponibilidad: un servidor es un punto único de fallo, y ese es el trato.

Convenciones comunes a los cuatro:

- **Naming**: `${project}-${env}` como prefijo de todo; tags/labels `project/environment/managed_by`.
- **Secretos**: los stacks escriben en el gestor del proveedor las MISMAS claves
  que consumen los loaders (`vault.typeorm.password` → `typeorm-password`, `typeorm-host`, `typeorm-username`, `typeorm-database`)
  vía `@raptor/infra-config-azure` / `config-aws` / `config-infisical` (que los nombra en
  SCREAMING_SNAKE: `TYPEORM_PASSWORD`). Nunca secretos en tfvars commiteados.
- **Bootstrap en dos apply**: el primero crea registro+datos (sin servicios de
  cómputo: la imagen aún no existe); tras el primer push se rellena
  `backend_image`/`frontend_image` y el segundo apply crea los servicios.
- **Estado remoto**: backend parcial (S3 con lockfile / GCS / azurerm); el bucket
  o storage account del estado se crea una única vez fuera del stack.
- **Validación**: `terraform init -backend=false && terraform validate` por stack
  (sin credenciales); los cuatro se validan en local antes de commitear. Ninguno de
  Hetzner ni de AWS se ha llegado a aplicar: no hay cuentas, así que `plan` está pendiente.

GCP no tiene email transaccional nativo: se cubre con SES cross-cloud o un
tercero (SendGrid) detrás del mismo puerto de email del catálogo.
