# PostgreSQL Flexible Server público con allowlist por firewall: entra la IP del
# dev (DBeaver) y la salida de los servicios de Azure (Container Apps). Trade-off
# asumido en DESIGN §6: privada pura exigiría bastión/VPN de pago.
# Los roles de solo lectura para DBeaver NO se crean aquí (viven dentro del
# servidor): ver iac/sql/create-readonly-{group,user}.sql, ejecución manual por entorno.
resource "azurerm_postgresql_flexible_server" "this" {
  name                          = var.postgres_server_name
  resource_group_name           = data.azurerm_resource_group.this.name
  location                      = data.azurerm_resource_group.this.location
  version                       = "16"
  administrator_login           = var.postgres_admin_login
  administrator_password        = var.postgres_admin_password
  sku_name                      = "B_Standard_B1ms"
  storage_mb                    = 32768
  backup_retention_days         = 7
  public_network_access_enabled = true
  tags                          = var.tags

  # Azure asigna la availability zone por su cuenta al crear el servidor (aqui: "2").
  # Sin HA no se puede cambiar (`zone` solo se intercambia con la standby), y no la
  # gestionamos nosotros: se ignora para que el drift no rompa cada apply.
  lifecycle {
    ignore_changes = [zone]
  }
}

resource "azurerm_postgresql_flexible_server_database" "this" {
  name      = var.postgres_database_name
  server_id = azurerm_postgresql_flexible_server.this.id
  charset   = "UTF8"
  collation = "en_US.utf8"
}

# Una regla por entrada del mapa, para poder autorizar a varias personas (o un rango corporativo)
# sin tocar este fichero. Nota: la VPN de Avvale usa split tunnel y NO enruta Azure por el tunel,
# asi que aqui van IPs publicas de cada puesto; ver docs/BACKLOG.md.
resource "azurerm_postgresql_flexible_server_firewall_rule" "workstations" {
  for_each = var.postgres_allowed_ips

  name             = each.key
  server_id        = azurerm_postgresql_flexible_server.this.id
  start_ip_address = each.value.start
  end_ip_address   = coalesce(each.value.end, each.value.start)
}

# 0.0.0.0-0.0.0.0 es el rango especial "permitir servicios de Azure" (salida de
# las Container Apps), no un allow-all de internet.
resource "azurerm_postgresql_flexible_server_firewall_rule" "azure_services" {
  name             = "allow-azure-services"
  server_id        = azurerm_postgresql_flexible_server.this.id
  start_ip_address = "0.0.0.0"
  end_ip_address   = "0.0.0.0"
}
