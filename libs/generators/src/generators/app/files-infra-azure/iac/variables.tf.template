variable "resource_group_name" {
  description = "Resource group that holds the environment's stack (existing, consumed as data source)."
  type        = string
}

variable "acr_name" {
  description = "Globally unique name of the container registry (alphanumeric only, per environment)."
  type        = string
}

variable "application_insights_name" {
  description = "Name of the Application Insights component for the backend."
  type        = string
  default     = "appi-acelerador"
}

variable "communication_service_name" {
  description = "Name of the Azure Communication Service (transactional email data plane)."
  type        = string
  default     = "acs-acelerador"
}

variable "email_communication_service_name" {
  description = "Name of the Email Communication Service (holds the sender domain)."
  type        = string
  default     = "acs-email-acelerador"
}

variable "communication_data_location" {
  description = "Data residency region for Communication Services (e.g. Europe, United States)."
  type        = string
  default     = "Europe"
}

variable "acs_custom_sender_domain" {
  description = "Custom sender domain verified in ACS (CustomerManaged). Requires DNS records published by IT."
  type        = string
  default     = "acelerador.avvale.com"
}

variable "acs_custom_sender_username" {
  description = "Local part of the custom sender address (e.g. noreply -> noreply@acelerador.avvale.com)."
  type        = string
  default     = "noreply"
}

# Azure rechaza linkear un dominio CustomerManaged al Communication Service hasta que esta
# verificado por DNS. Mientras IT no publique los verification_records (expuestos por output) y
# Azure marque el dominio como Verified, la asociacion custom NO debe crearse: se queda en false.
# Flip a true (+ re-apply) una vez confirmada la verificacion.
variable "acs_custom_domain_verified" {
  description = "Set to true only after IT publishes the DNS records and ACS marks acelerador.avvale.com as Verified. Gates the custom domain association."
  type        = bool
  default     = false
}

# Hostname propio del front (licencias.avvale.com en prod, licencias-dev.avvale.com en dev). El
# FQDN que genera Container Apps es impresentable ante un cliente y, peor, dev y prod solo se
# distinguen por un sufijo aleatorio, asi que es facil confundirlos.
#
# Deliberadamente NO se reutiliza acelerador.avvale.com (el dominio remitente de ACS): ese nombre
# ya tiene registros TXT publicados y un CNAME no puede convivir con otros registros en el mismo
# nombre. Azure pide CNAME para subdominios; el registro A es solo para el apex de la zona, que
# aqui es avvale.com.
variable "frontend_custom_domain" {
  description = "Custom hostname for the frontend (e.g. licencias.avvale.com). Empty disables the custom domain."
  type        = string
  default     = ""
}

# Azure no emite el certificado gestionado hasta que el hostname ya resuelve a la app, asi que el
# binding falla si se aplica antes de que IT publique el DNS. Mismo patron de gate que
# acs_custom_domain_verified: se queda en false y se hace flip a true (+ re-apply) despues.
variable "frontend_custom_domain_verified" {
  description = "Set to true only after IT publishes the CNAME and asuid TXT records for frontend_custom_domain. Gates the binding and the managed certificate."
  type        = bool
  default     = false
}

variable "storage_account_name" {
  description = "Globally unique name of the Storage Account for QBR evidence files (3-24 lowercase alphanumeric)."
  type        = string
}

variable "storage_container_name" {
  description = "Blob container that holds the QBR evidence files."
  type        = string
  default     = "qbr-evidences"
}

variable "backend_app_name" {
  description = "Name of the backend Container App."
  type        = string
  default     = "ca-acelerador-backend"
}

variable "backend_image" {
  description = "Initial backend image reference (registry/repo:tag). Later deploys update it via az containerapp update."
  type        = string
}

variable "container_app_environment_name" {
  description = "Name of the Container Apps environment."
  type        = string
  default     = "cae-acelerador"
}

variable "frontend_app_name" {
  description = "Name of the frontend Container App."
  type        = string
  default     = "ca-acelerador-frontend"
}

variable "frontend_image" {
  description = "Initial frontend image reference (registry/repo:tag). Later deploys update it via az containerapp update."
  type        = string
}

variable "key_vault_name" {
  description = "Globally unique name of the Key Vault (per environment)."
  type        = string
}

variable "key_vault_secrets" {
  description = "Secrets to create in the Key Vault, name => value (vault.x.y placeholders map to secret x-y)."
  type        = map(string)
  sensitive   = true
}

variable "log_analytics_workspace_name" {
  description = "Name of the Log Analytics workspace that receives the environment's logs."
  type        = string
  default     = "log-acelerador"
}

variable "managed_identity_name" {
  description = "Name of the user-assigned managed identity shared by the Container Apps and Jobs."
  type        = string
  default     = "id-acelerador-apps"
}

variable "migrate_job_name" {
  description = "Name of the database migration Container App Job."
  type        = string
  default     = "caj-acelerador-migrate"
}

variable "migrate_image" {
  description = "Initial migration image reference (registry/repo:tag). Later deploys update it via az containerapp job update."
  type        = string
}

variable "sap_sync_job_name" {
  description = "Name of the monthly sap-sync trigger Container App Job."
  type        = string
  default     = "caj-acelerador-sap-sync"
}

variable "node_env" {
  description = "NODE_ENV for the backend and jobs; selects the config file (dev/qa/prod) the config-loader reads."
  type        = string
}

variable "postgres_server_name" {
  description = "Globally unique name of the PostgreSQL Flexible Server (per environment)."
  type        = string
}

variable "postgres_admin_login" {
  description = "Administrator login for the PostgreSQL server."
  type        = string
}

variable "postgres_admin_password" {
  description = "Administrator password for the PostgreSQL server."
  type        = string
  sensitive   = true
}

variable "postgres_database_name" {
  description = "Name of the application database."
  type        = string
  default     = "acelerador"
}

# Mapa (no lista) para que quitar a una persona no recree las reglas de las demas: con for_each
# sobre un mapa la clave es la identidad de la regla, mientras con una lista los indices se
# desplazan. `end` es opcional: si se omite, la regla cubre una sola IP.
variable "postgres_allowed_ips" {
  description = "Public IPs or ranges allowed through the Postgres firewall (DBeaver), keyed by a stable name."
  type        = map(object({ start = string, end = optional(string) }))
  default     = {}
}

variable "tags" {
  description = "Tags applied to all resources."
  type        = map(string)
  default     = {}
}
