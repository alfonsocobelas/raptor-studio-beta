# Una única managed identity user-assigned compartida por las Container Apps y los Jobs.
# Permisos (AcrPull en ACR, Get/List secrets en KV) se asignan en acr.tf y key-vault.tf.
resource "azurerm_user_assigned_identity" "apps" {
  name                = var.managed_identity_name
  resource_group_name = data.azurerm_resource_group.this.name
  location            = data.azurerm_resource_group.this.location
  tags                = var.tags
}
