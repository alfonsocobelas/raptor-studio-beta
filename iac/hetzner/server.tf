# Un único servidor, sin orquestador: en un proveedor cuyo argumento es el coste, Kubernetes
# sería una contradicción. Docker Compose sobre este servidor sostiene app, front y Postgres.
resource "hcloud_server" "app" {
  name         = local.name
  server_type  = var.server_type
  image        = var.image
  location     = var.location
  labels       = local.labels
  user_data    = local.cloud_init
  ssh_keys     = var.ssh_key_names
  firewall_ids = [hcloud_firewall.app.id]

  public_net {
    ipv4_enabled = true
    ipv6_enabled = true
  }

  lifecycle {
    # Cambiar el cloud-init recrearía el servidor y con él todo lo que no esté en el volumen.
    # El aprovisionamiento posterior es cosa del despliegue, no de un `apply`.
    ignore_changes = [user_data]
  }
}

# Los datos que deben sobrevivir a la muerte del servidor (Postgres y los adjuntos que no
# viajen a R2) viven aquí. Hetzner lo monta en /mnt/HC_Volume_<id>; el cloud-init lo enlaza
# como /srv/data para que el compose no dependa del id.
resource "hcloud_volume" "data" {
  name      = local.name
  size      = var.volume_size_gb
  server_id = hcloud_server.app.id
  automount = true
  format    = "ext4"
  labels    = local.labels
}
