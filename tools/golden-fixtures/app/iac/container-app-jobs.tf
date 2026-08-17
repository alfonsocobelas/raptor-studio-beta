# Job de migración (trigger manual): gate del deploy en cd.yml — si falla, las
# apps no se actualizan. Sin reintentos: una migración fallida se revisa, no se
# repite a ciegas.
resource "azurerm_container_app_job" "migrate" {
  name                         = var.migrate_job_name
  container_app_environment_id = azurerm_container_app_environment.this.id
  resource_group_name          = data.azurerm_resource_group.this.name
  location                     = data.azurerm_resource_group.this.location
  replica_timeout_in_seconds   = 600
  replica_retry_limit          = 0
  tags                         = var.tags

  manual_trigger_config {
    parallelism              = 1
    replica_completion_count = 1
  }

  identity {
    type         = "UserAssigned"
    identity_ids = [azurerm_user_assigned_identity.apps.id]
  }

  registry {
    server   = azurerm_container_registry.this.login_server
    identity = azurerm_user_assigned_identity.apps.id
  }

  template {
    container {
      name   = "migrate"
      image  = var.migrate_image
      cpu    = 0.5
      memory = "1Gi"

      command = ["npm", "run", "typeorm:migration:run:deploy"]

      env {
        name  = "NODE_ENV"
        value = var.node_env
      }

      env {
        name  = "AZURE_KEYVAULT_URL"
        value = azurerm_key_vault.this.vault_uri
      }

      env {
        name  = "AZURE_CLIENT_ID"
        value = azurerm_user_assigned_identity.apps.client_id
      }
    }
  }

  # La imagen la actualiza el CD antes de cada arranque; Terraform solo la fija
  # en la creación (mismo criterio que en las apps).
  lifecycle {
    ignore_changes = [template[0].container[0].image]
  }
}

# Job sap-sync (mensual, 03:00 UTC del día 1): dispara el endpoint HTTP del back
# que ya orquesta la sincronización. Imagen pública de azure-cli (MCR, sin
# registry block); la MI da acceso al secreto del api-key en el KV.
resource "azurerm_container_app_job" "sap_sync" {
  name                         = var.sap_sync_job_name
  container_app_environment_id = azurerm_container_app_environment.this.id
  resource_group_name          = data.azurerm_resource_group.this.name
  location                     = data.azurerm_resource_group.this.location
  replica_timeout_in_seconds   = 300
  replica_retry_limit          = 1
  tags                         = var.tags

  schedule_trigger_config {
    cron_expression          = "0 3 1 * *"
    parallelism              = 1
    replica_completion_count = 1
  }

  identity {
    type         = "UserAssigned"
    identity_ids = [azurerm_user_assigned_identity.apps.id]
  }

  template {
    container {
      name   = "sap-sync-trigger"
      image  = "mcr.microsoft.com/azure-cli:latest"
      cpu    = 0.25
      memory = "0.5Gi"

      command = ["/bin/sh", "-c", local.sap_sync_trigger_script]

      env {
        name  = "AZURE_CLIENT_ID"
        value = azurerm_user_assigned_identity.apps.client_id
      }

      env {
        name  = "KEY_VAULT_NAME"
        value = azurerm_key_vault.this.name
      }

      env {
        name  = "BACKEND_FQDN"
        value = azurerm_container_app.backend.ingress[0].fqdn
      }
    }
  }
}

locals {
  # -sS: silencia el progreso pero no los errores; -f: exit != 0 si el back
  # devuelve >= 400 (el job queda Failed y se ve en el portal). El 202 esperado
  # se imprime en el log con -w.
  sap_sync_trigger_script = <<-EOT
    set -eu
    az login --identity --client-id "$AZURE_CLIENT_ID" --allow-no-subscriptions --output none
    API_KEY="$(az keyvault secret show --vault-name "$KEY_VAULT_NAME" --name sap-sync-api-key --query value --output tsv)"
    # La API va con prefijo global "api" MAS versionado por URI (default 1): /api/v1/...
    # (setup-app.ts). Sin el /v1 el POST responde 404 y, con -f, tumba el job entero.
    curl -sS -f -X POST -H "x-api-key: $API_KEY" -w "HTTP %%{http_code}\n" "http://$BACKEND_FQDN/api/v1/sap-sync/runs"
  EOT
}
