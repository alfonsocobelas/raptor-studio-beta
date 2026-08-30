variable "project_id" {
  description = "GCP project that holds the environment's stack."
  type        = string
}

variable "project" {
  description = "Short project slug used as naming prefix (e.g. acelerador)."
  type        = string
  default     = "acelerador"
}

variable "env" {
  description = "Environment name (dev, qa, prod). Part of every resource name."
  type        = string
}

variable "region" {
  description = "GCP region for the whole stack."
  type        = string
  default     = "europe-west1"
}

variable "db_name" {
  description = "Name of the application database."
  type        = string
  default     = "acelerador"
}

variable "db_username" {
  description = "Application database user (password generated and stored in Secret Manager)."
  type        = string
  default     = "app_admin"
}

variable "db_tier" {
  description = "Cloud SQL machine tier; shared-core by default (cost floor)."
  type        = string
  default     = "db-f1-micro"
}

variable "backend_image" {
  description = "Fully qualified image for the backend Cloud Run service (Artifact Registry URI:tag). Empty on first apply."
  type        = string
  default     = ""
}

variable "frontend_image" {
  description = "Fully qualified image for the frontend Cloud Run service. Empty on first apply."
  type        = string
  default     = ""
}

variable "log_retention_days" {
  description = "Retention of the _Default Cloud Logging bucket (Logs Explorer queries read from it)."
  type        = number
  default     = 30
}
