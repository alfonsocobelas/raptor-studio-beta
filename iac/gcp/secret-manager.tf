# Espejo de key-vault.tf: secretos que resuelve @acc/infra-config-gcp/aws (marcadores vault.*).
locals {
  secrets = {
    "DB-PASSWORD" = random_password.db.result
    "DB-HOST"     = google_sql_database_instance.main.connection_name
    "DB-USER"     = var.db_username
    "DB-NAME"     = var.db_name
  }
}

resource "google_secret_manager_secret" "app" {
  for_each  = local.secrets
  secret_id = "${local.name}-${each.key}"
  labels    = local.labels

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "app" {
  for_each    = local.secrets
  secret      = google_secret_manager_secret.app[each.key].id
  secret_data = each.value
}
