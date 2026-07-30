# Entorno compartido por las apps (back, front) y los jobs (migración, sap-sync).
# Sin workload profiles: plan Consumption puro (pago por uso, escala a cero).
resource "azurerm_container_app_environment" "this" {
  name                       = var.container_app_environment_name
  resource_group_name        = data.azurerm_resource_group.this.name
  location                   = data.azurerm_resource_group.this.location
  log_analytics_workspace_id = azurerm_log_analytics_workspace.this.id
  tags                       = var.tags
}
