# Espejo de postgres.tf: Cloud SQL Postgres, sin IP pública (solo conector).
resource "random_password" "db" {
  length  = 32
  special = false
}

resource "google_sql_database_instance" "main" {
  name             = "${local.name}-postgres"
  database_version = "POSTGRES_16"
  region           = var.region

  settings {
    tier = var.db_tier

    ip_configuration {
      ipv4_enabled = false
      # Cloud Run llega por el conector integrado (cloudsql instance annotation), no por IP.
    }

    backup_configuration {
      enabled = true
    }

    user_labels = local.labels
  }

  deletion_protection = var.env == "prod"
}

resource "google_sql_database" "app" {
  name     = var.db_name
  instance = google_sql_database_instance.main.name
}

resource "google_sql_user" "app" {
  name     = var.db_username
  instance = google_sql_database_instance.main.name
  password = random_password.db.result
}
