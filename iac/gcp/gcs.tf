# Espejo de storage.tf: bucket privado para el FileStoragePort (@acc/infra-storage-gcs).
resource "google_storage_bucket" "storage" {
  name                        = "${local.name}-storage"
  location                    = var.region
  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"
  labels                      = local.labels

  versioning {
    enabled = true
  }
}
