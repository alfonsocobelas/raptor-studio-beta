# Key Vault del entorno. El config-loader del back resuelve los placeholders
# `vault.x.y` contra secretos llamados `x-y`; los nombres/valores concretos los
# aporta cada entorno en `key_vault_secrets` (TF_VARS_JSON), incluido
# `applicationinsights-connection-string` que referencia la Container App del back.
resource "azurerm_key_vault" "this" {
  name                       = var.key_vault_name
  resource_group_name        = data.azurerm_resource_group.this.name
  location                   = data.azurerm_resource_group.this.location
  tenant_id                  = data.azurerm_client_config.current.tenant_id
  sku_name                   = "standard"
  soft_delete_retention_days = 7
  purge_protection_enabled   = false
  tags                       = var.tags
}

# Principal que ejecuta Terraform: necesita escribir los secretos.
resource "azurerm_key_vault_access_policy" "terraform" {
  key_vault_id       = azurerm_key_vault.this.id
  tenant_id          = data.azurerm_client_config.current.tenant_id
  object_id          = data.azurerm_client_config.current.object_id
  secret_permissions = ["Get", "List", "Set", "Delete", "Purge", "Recover"]
}

# MI de las apps y jobs: solo lectura de secretos.
resource "azurerm_key_vault_access_policy" "apps" {
  key_vault_id       = azurerm_key_vault.this.id
  tenant_id          = data.azurerm_client_config.current.tenant_id
  object_id          = azurerm_user_assigned_identity.apps.principal_id
  secret_permissions = ["Get", "List"]
}

resource "azurerm_key_vault_secret" "this" {
  # Los nombres de secreto no son sensibles (van como instance key); los valores sí.
  for_each = toset(nonsensitive(keys(var.key_vault_secrets)))

  name         = each.value
  value        = var.key_vault_secrets[each.value]
  key_vault_id = azurerm_key_vault.this.id

  depends_on = [azurerm_key_vault_access_policy.terraform]
}
