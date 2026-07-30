# Frontend nginx (SPA + reverse-proxy /api). Ingress externo; min_replicas = 0:
# tolera cold-start (poco tráfico) a cambio de coste cero en reposo.
resource "azurerm_container_app" "frontend" {
  name                         = var.frontend_app_name
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
    external_enabled = true
    target_port      = 8080

    traffic_weight {
      latest_revision = true
      percentage      = 100
    }
  }

  template {
    min_replicas = 0
    max_replicas = 1

    container {
      name   = "frontend"
      image  = var.frontend_image
      cpu    = 0.25
      memory = "0.5Gi"

      # FQDN interno del back; nginx proxya /api por HTTP plano (puerto 80 del
      # ingress interno, allow_insecure_connections en el back).
      env {
        name  = "BACKEND_HOST"
        value = azurerm_container_app.backend.ingress[0].fqdn
      }

      env {
        name  = "BACKEND_PORT"
        value = "80"
      }
    }
  }

  # La imagen la actualiza el CD (az containerapp update); Terraform solo la fija
  # en la creación. Sin esto, cada apply revertiría al tag inicial de TF_VARS_JSON.
  lifecycle {
    ignore_changes = [template[0].container[0].image]
  }
}

# Dominio propio con certificado gestionado (gratuito, Azure lo emite y lo renueva solo).
# Solo se crea cuando IT ya ha publicado el CNAME y el TXT asuid: sin `container_app_environment_
# certificate_id`, Azure entiende que el certificado es gestionado y lo emite el, pero para eso
# necesita que el hostname resuelva ya a la app. Aplicarlo antes deja el apply en error.
#
# ignore_changes segun la documentacion del provider: el binding y el id del certificado los
# rellena Azure de forma asincrona una vez emitido, y sin esto Terraform intentaria revertirlo en
# cada apply.
resource "azurerm_container_app_custom_domain" "frontend" {
  count            = var.frontend_custom_domain != "" && var.frontend_custom_domain_verified ? 1 : 0
  name             = var.frontend_custom_domain
  container_app_id = azurerm_container_app.frontend.id

  lifecycle {
    ignore_changes = [certificate_binding_type, container_app_environment_certificate_id]
  }
}
