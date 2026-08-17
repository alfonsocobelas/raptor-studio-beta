# Backend NestJS. Ingress interno (solo lo alcanza el front y los jobs dentro del
# environment); min_replicas = 1 porque el arranque es lento (Nest + Chromium) y
# no queremos cold-start en cada petición.
resource "azurerm_container_app" "backend" {
  name                         = var.backend_app_name
  container_app_environment_id = azurerm_container_app_environment.this.id
  resource_group_name          = data.azurerm_resource_group.this.name
  revision_mode                = "Single"
  tags                         = var.tags

  identity {
    type         = "UserAssigned"
    identity_ids = [azurerm_user_assigned_identity.apps.id]
  }

  registry {
    server   = azurerm_container_registry.this.login_server
    identity = azurerm_user_assigned_identity.apps.id
  }

  ingress {
    external_enabled = false
    target_port      = 3000
    # El front proxya por HTTP plano (puerto 80); sin esto el ingress contesta
    # 301 a HTTPS y nginx se lo pasaría al navegador. Tráfico solo interno.
    allow_insecure_connections = true

    traffic_weight {
      latest_revision = true
      percentage      = 100
    }
  }

  # KV reference sin versión: Container Apps la resuelve con la MI y sigue las
  # rotaciones del secreto. Se materializa como env ANTES de arrancar el proceso
  # (lo exige initTelemetry, primer módulo del bundle).
  secret {
    name                = "appinsights-connection-string"
    key_vault_secret_id = "${azurerm_key_vault.this.vault_uri}secrets/applicationinsights-connection-string"
    identity            = azurerm_user_assigned_identity.apps.id
  }

  template {
    min_replicas = 1
    max_replicas = 1

    container {
      name   = "backend"
      image  = var.backend_image
      cpu    = 0.5
      memory = "1Gi"

      env {
        name  = "NODE_ENV"
        value = var.node_env
      }

      env {
        name  = "AZURE_KEYVAULT_URL"
        value = azurerm_key_vault.this.vault_uri
      }

      # DefaultAzureCredential elige esta MI entre las identidades disponibles.
      env {
        name  = "AZURE_CLIENT_ID"
        value = azurerm_user_assigned_identity.apps.client_id
      }

      env {
        name        = "APPLICATIONINSIGHTS_CONNECTION_STRING"
        secret_name = "appinsights-connection-string"
      }

      liveness_probe {
        transport = "HTTP"
        port      = 3000
        path      = "/api/health/liveness"
      }

      readiness_probe {
        transport = "HTTP"
        port      = 3000
        path      = "/api/health/readiness"
      }
    }
  }

  # La imagen la actualiza el CD (az containerapp update); Terraform solo la fija
  # en la creación. Sin esto, cada apply revertiría al tag inicial de TF_VARS_JSON.
  lifecycle {
    ignore_changes = [template[0].container[0].image]
  }
}
