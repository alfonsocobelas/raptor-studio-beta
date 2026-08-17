# App Insights del back (workspace-based, sobre el Log Analytics existente).
# Terraform escribe la connection string directamente como secreto del KV: la
# Container App del back la referencia (KV reference → env) y el valor nunca
# pasa por TF_VARS_JSON ni por el Portal.
resource "azurerm_application_insights" "this" {
  name                = var.application_insights_name
  resource_group_name = data.azurerm_resource_group.this.name
  location            = data.azurerm_resource_group.this.location
  workspace_id        = azurerm_log_analytics_workspace.this.id
  application_type    = "web"
  tags                = var.tags
}

resource "azurerm_key_vault_secret" "appinsights_connection_string" {
  name         = "applicationinsights-connection-string"
  value        = azurerm_application_insights.this.connection_string
  key_vault_id = azurerm_key_vault.this.id

  depends_on = [azurerm_key_vault_access_policy.terraform]
}
