# Storage de evidencias QBR (subida/descarga de ficheros), retención operativa a 20 años.
# El back se autentica con la connection string, que Terraform escribe en el Key Vault
# (mismo patrón que application-insights.tf y communication.tf); nunca pasa por TF_VARS_JSON.
#
# Config orientada a durabilidad barata a largo plazo:
# - GRS: geo-redundante (sobrevive a un desastre regional) y compatible con tier Archive.
# - Soft delete (blob + contenedor) 7 días: recuperar un borrado equivocado sin impedir el
#   borrado normal (el usuario puede subir mal un fichero y borrarlo al instante).
# - Versioning: protege contra sobrescrituras.
# - Lifecycle: Archive a 365 días → el primer año en Hot (acceso instantáneo, que es cuando la
#   evidencia se revisa), y después al tier más barato para el resto de la retención a 20 años.
resource "azurerm_storage_account" "this" {
  name                            = var.storage_account_name
  resource_group_name             = data.azurerm_resource_group.this.name
  location                        = data.azurerm_resource_group.this.location
  account_kind                    = "StorageV2"
  account_tier                    = "Standard"
  account_replication_type        = "GRS"
  access_tier                     = "Hot"
  min_tls_version                 = "TLS1_2"
  allow_nested_items_to_be_public = false
  tags                            = var.tags

  blob_properties {
    versioning_enabled = true

    delete_retention_policy {
      days = 7
    }

    container_delete_retention_policy {
      days = 7
    }
  }
}

resource "azurerm_storage_container" "evidences" {
  name                  = var.storage_container_name
  storage_account_id    = azurerm_storage_account.this.id
  container_access_type = "private"
}

# Abarata la retención a 20 años: el primer año en Hot (acceso instantáneo), luego Archive.
# Solo el tier Archive (>1 año) requiere rehidratación (horas) para descargarse.
resource "azurerm_storage_management_policy" "this" {
  storage_account_id = azurerm_storage_account.this.id

  rule {
    name    = "evidence-tiering"
    enabled = true

    filters {
      blob_types = ["blockBlob"]
    }

    actions {
      base_blob {
        tier_to_archive_after_days_since_modification_greater_than = 365
      }
    }
  }
}

# La app resuelve `vault.storage.connection-string`; el contenedor va en claro en el JSON.
resource "azurerm_key_vault_secret" "storage_connection_string" {
  name         = "storage-connection-string"
  value        = azurerm_storage_account.this.primary_connection_string
  key_vault_id = azurerm_key_vault.this.id

  depends_on = [azurerm_key_vault_access_policy.terraform]
}
