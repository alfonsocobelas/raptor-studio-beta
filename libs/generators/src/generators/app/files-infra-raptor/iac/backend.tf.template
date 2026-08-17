# Estado remoto en cualquier almacén S3-compatible (Cloudflare R2 es el del propio stack).
# El bucket se crea UNA vez fuera de este stack (huevo-gallina del estado).
#
# R2 no implementa todas las APIs de S3, así que init necesita saltarse las comprobaciones:
#   terraform init \
#     -backend-config="bucket=<project>-tfstate" \
#     -backend-config="endpoints={s3=\"https://<account>.r2.cloudflarestorage.com\"}" \
#     -backend-config="access_key=..." -backend-config="secret_key=..."
terraform {
  backend "s3" {
    key                         = "acelerador/terraform.tfstate"
    region                      = "auto"
    use_lockfile                = true
    skip_credentials_validation = true
    skip_metadata_api_check     = true
    skip_region_validation      = true
    skip_requesting_account_id  = true
    skip_s3_checksum            = true
  }
}
