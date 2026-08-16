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
  description = "AWS region for the whole stack."
  type        = string
  default     = "eu-west-1"
}

variable "db_name" {
  description = "Name of the application database."
  type        = string
  default     = "acelerador"
}

variable "db_username" {
  description = "Master username of the RDS instance (password is generated and stored in Secrets Manager)."
  type        = string
  default     = "app_admin"
}

variable "db_instance_class" {
  description = "RDS instance class; burstable graviton by default (cost floor)."
  type        = string
  default     = "db.t4g.micro"
}

variable "backend_image" {
  description = "Fully qualified image for the backend App Runner service (ECR URI:tag). Empty on first apply (ECR still empty)."
  type        = string
  default     = ""
}

variable "frontend_image" {
  description = "Fully qualified image for the frontend App Runner service (ECR URI:tag). Empty on first apply."
  type        = string
  default     = ""
}

variable "log_retention_days" {
  description = "Retention of the backend CloudWatch log group (Log Insights queries read from it)."
  type        = number
  default     = 30
}

variable "sender_domain" {
  description = "Verified SES sender domain (empty disables the email identity)."
  type        = string
  default     = ""
}
