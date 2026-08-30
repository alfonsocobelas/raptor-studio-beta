# Espejo de cloudwatch.tf (AWS): retención de los logs del backend. Cloud Run reenvía el
# stdout del servicio al bucket _Default de Cloud Logging por sí solo, y el transporte
# directo de la app (logger/gcp-log-transports.ts, sección de config `cloudLogging`)
# escribe en el mismo sitio; un log bucket dedicado exigiría sink + exclusión para el mismo
# resultado. Aquí solo se gobierna la retención.
resource "google_logging_project_bucket_config" "default" {
  project        = var.project_id
  location       = "global"
  bucket_id      = "_Default"
  retention_days = var.log_retention_days
}
