output "server_name" {
  value = hcloud_server.app.name
}

# Donde apuntar el registro A del dominio (el DNS no lo gestiona este stack).
output "server_ipv4" {
  value = hcloud_server.app.ipv4_address
}

output "server_ipv6" {
  value = hcloud_server.app.ipv6_address
}

# Ruta que el docker-compose monta para los datos que deben sobrevivir al servidor.
output "data_mount_path" {
  value = "/srv/data"
}
