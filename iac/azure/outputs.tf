output "resource_group_name" {
  description = "Name of the environment's resource group."
  value       = data.azurerm_resource_group.this.name
}

output "frontend_url" {
  description = "Public URL of the frontend (Container Apps ingress FQDN)."
  value       = "https://${azurerm_container_app.frontend.ingress[0].fqdn}"
}

output "frontend_custom_domain_dns_records" {
  description = "DNS records IT must publish on avvale.com for the frontend custom domain (CNAME + asuid TXT). Empty when frontend_custom_domain is unset."
  value = var.frontend_custom_domain == "" ? {} : {
    cname = {
      name  = var.frontend_custom_domain
      value = azurerm_container_app.frontend.ingress[0].fqdn
    }
    txt = {
      name  = "asuid.${var.frontend_custom_domain}"
      value = azurerm_container_app.frontend.custom_domain_verification_id
    }
  }
}

output "backend_internal_fqdn" {
  description = "Internal FQDN of the backend (reachable only inside the environment)."
  value       = azurerm_container_app.backend.ingress[0].fqdn
}

output "acr_login_server" {
  description = "Login server of the container registry (docker push/pull target for CD)."
  value       = azurerm_container_registry.this.login_server
}

output "key_vault_uri" {
  description = "URI of the Key Vault (AZURE_KEYVAULT_URL for local troubleshooting)."
  value       = azurerm_key_vault.this.vault_uri
}

output "postgres_fqdn" {
  description = "FQDN of the PostgreSQL Flexible Server (DBeaver connection host)."
  value       = azurerm_postgresql_flexible_server.this.fqdn
}

output "managed_identity_client_id" {
  description = "Client id of the shared user-assigned identity (AZURE_CLIENT_ID of apps and jobs)."
  value       = azurerm_user_assigned_identity.apps.client_id
}

output "acs_custom_domain_verification_records" {
  description = "DNS records IT must publish on avvale.com to verify acelerador.avvale.com in ACS (domain/spf/dkim/dkim2/dmarc)."
  value       = azurerm_email_communication_service_domain.custom.verification_records
}

# Nombres que el CD necesita para az containerapp update / job start.
output "backend_app_name" {
  description = "Name of the backend Container App."
  value       = azurerm_container_app.backend.name
}

output "frontend_app_name" {
  description = "Name of the frontend Container App."
  value       = azurerm_container_app.frontend.name
}

output "migrate_job_name" {
  description = "Name of the migration Container App Job."
  value       = azurerm_container_app_job.migrate.name
}
