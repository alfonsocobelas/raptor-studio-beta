# Espejo de container-app-*.tf: Cloud Run v2 es el homólogo directo de Container Apps.
# Mismo baile de bootstrap que en Azure/AWS: primer apply sin servicios, push de imagen,
# segundo apply con la variable rellena.
resource "google_cloud_run_v2_service" "backend" {
  count    = var.backend_image == "" ? 0 : 1
  name     = "${local.name}-backend"
  location = var.region

  template {
    service_account = google_service_account.backend.email

    containers {
      image = var.backend_image

      ports {
        container_port = 3000
      }

      env {
        name  = "NODE_ENV"
        value = var.env
      }

      env {
        name  = "GCP_SECRETS_PREFIX"
        value = local.name
      }
    }

    volumes {
      name = "cloudsql"

      cloud_sql_instance {
        instances = [google_sql_database_instance.main.connection_name]
      }
    }

    scaling {
      min_instance_count = 0
      max_instance_count = 3
    }
  }

  labels = local.labels
}

resource "google_cloud_run_v2_service" "frontend" {
  count    = var.frontend_image == "" ? 0 : 1
  name     = "${local.name}-frontend"
  location = var.region

  template {
    containers {
      image = var.frontend_image

      ports {
        container_port = 8080
      }
    }

    scaling {
      min_instance_count = 0
      max_instance_count = 3
    }
  }

  labels = local.labels
}

# El frontend es público; el backend queda detrás del frontend/API gateway del cliente.
resource "google_cloud_run_v2_service_iam_member" "frontend_public" {
  count    = var.frontend_image == "" ? 0 : 1
  name     = google_cloud_run_v2_service.frontend[0].name
  location = var.region
  role     = "roles/run.invoker"
  member   = "allUsers"
}
