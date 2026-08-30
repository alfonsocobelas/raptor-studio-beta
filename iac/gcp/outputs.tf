output "artifact_registry" {
  value = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.main.repository_id}"
}

output "db_connection_name" {
  value = google_sql_database_instance.main.connection_name
}

output "backend_url" {
  value = length(google_cloud_run_v2_service.backend) > 0 ? google_cloud_run_v2_service.backend[0].uri : null
}

output "frontend_url" {
  value = length(google_cloud_run_v2_service.frontend) > 0 ? google_cloud_run_v2_service.frontend[0].uri : null
}

output "storage_bucket" {
  value = google_storage_bucket.storage.name
}

output "log_name" {
  description = "The logName the app's `cloudLogging.logName` config should reference (Logs Explorer)."
  value       = local.name
}
