variable "project" {
  description = "Short project slug used as naming prefix (e.g. acelerador)."
  type        = string
  default     = "acelerador"
}

variable "env" {
  description = "Environment name (dev, qa, prod). Part of every resource name."
  type        = string
}

variable "location" {
  description = "Hetzner location; Nuremberg by default (EU data residency, lowest price)."
  type        = string
  default     = "nbg1"
}

variable "server_type" {
  description = "Hetzner server type. cx22 (2 vCPU / 4 GB) is the floor that runs app + Postgres."
  type        = string
  default     = "cx22"
}

variable "image" {
  description = "Base OS image of the server."
  type        = string
  default     = "ubuntu-24.04"
}

variable "volume_size_gb" {
  description = "Persistent volume for Postgres data and uploads that stay on disk."
  type        = number
  default     = 20
}

variable "domain" {
  description = "Domain served by Caddy; it issues the TLS certificate for it. Empty serves plain HTTP (dev only)."
  type        = string
  default     = ""
}

variable "admin_email" {
  description = "Contact e-mail Let's Encrypt uses for expiry notices."
  type        = string
  default     = ""
}

variable "ssh_key_names" {
  description = "Names of SSH keys ALREADY uploaded to the Hetzner project; without them the server is unreachable."
  type        = list(string)
  default     = []
}

variable "admin_cidrs" {
  description = "Source ranges allowed to reach SSH. Defaults to nobody: open it to your own IP."
  type        = list(string)
  default     = []
}
