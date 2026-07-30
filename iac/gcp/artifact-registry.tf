# Espejo de acr.tf: registro docker regional.
resource "google_artifact_registry_repository" "main" {
  repository_id = local.name
  location      = var.region
  format        = "DOCKER"
  labels        = local.labels
}
