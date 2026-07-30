# Azure Communication Services para el envío de email transaccional (invitaciones y
# reset de contraseña, spec 49). El back se autentica con la connection string, que
# Terraform escribe directamente en el Key Vault (mismo patrón que application-insights.tf);
# el valor nunca pasa por TF_VARS_JSON ni por el Portal.
#
# Dominio AzureManaged para arrancar: remitente donotreply@<guid>.azurecomm.net (funcional
# de inmediato, sin DNS). El dominio custom acelerador.avvale.com (verificación DNS por IT)
# se añade en una tarea aparte.
resource "azurerm_communication_service" "this" {
  name                = var.communication_service_name
  resource_group_name = data.azurerm_resource_group.this.name
  data_location       = var.communication_data_location
  tags                = var.tags
}

resource "azurerm_email_communication_service" "this" {
  name                = var.email_communication_service_name
  resource_group_name = data.azurerm_resource_group.this.name
  data_location       = var.communication_data_location
  tags                = var.tags
}

resource "azurerm_email_communication_service_domain" "azure_managed" {
  name              = "AzureManagedDomain"
  email_service_id  = azurerm_email_communication_service.this.id
  domain_management = "AzureManaged"
  tags              = var.tags
}

resource "azurerm_communication_service_email_domain_association" "this" {
  communication_service_id = azurerm_communication_service.this.id
  email_service_domain_id  = azurerm_email_communication_service_domain.azure_managed.id
}

# La app resuelve `vault.acs.connection-string` y `vault.acs.sender-address` (el config-loader
# convierte los puntos en guiones para el nombre del secreto).
resource "azurerm_key_vault_secret" "acs_connection_string" {
  name         = "acs-connection-string"
  value        = azurerm_communication_service.this.primary_connection_string
  key_vault_id = azurerm_key_vault.this.id

  depends_on = [azurerm_key_vault_access_policy.terraform]
}

resource "azurerm_key_vault_secret" "acs_sender_address" {
  name         = "acs-sender-address"
  value        = "donotreply@${azurerm_email_communication_service_domain.azure_managed.from_sender_domain}"
  key_vault_id = azurerm_key_vault.this.id

  depends_on = [azurerm_key_vault_access_policy.terraform]
}

# --- Dominio custom acelerador.avvale.com (remitente noreply@acelerador.avvale.com) ---
# CustomerManaged: al aplicar, Azure genera los `verification_records` (TXT/SPF/DKIM/DMARC) que
# IT debe publicar en el DNS de avvale.com. El dominio no verifica ni envía hasta entonces, por
# eso `acs-sender-address` (arriba) sigue apuntando al dominio AzureManaged hasta que IT confirme
# la verificación: el flip a noreply@acelerador.avvale.com es un cambio posterior de una línea.
# Los records se exponen por output (outputs.tf) para pasárselos a IT.
resource "azurerm_email_communication_service_domain" "custom" {
  name              = var.acs_custom_sender_domain
  email_service_id  = azurerm_email_communication_service.this.id
  domain_management = "CustomerManaged"
  tags              = var.tags
}

resource "azurerm_email_communication_service_domain_sender_username" "noreply" {
  name                    = var.acs_custom_sender_username
  email_service_domain_id = azurerm_email_communication_service_domain.custom.id
  display_name            = "SAP Licenses"
}

# Solo se crea cuando el dominio custom esta verificado (var.acs_custom_domain_verified = true).
# Hasta entonces Azure rechaza el link con PatchDomainLinkingError; el dominio y sus records
# (arriba) se crean igualmente para que IT complete la verificacion en el DNS.
resource "azurerm_communication_service_email_domain_association" "custom" {
  count                    = var.acs_custom_domain_verified ? 1 : 0
  communication_service_id = azurerm_communication_service.this.id
  email_service_domain_id  = azurerm_email_communication_service_domain.custom.id
}
