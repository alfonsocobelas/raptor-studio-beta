# Solo 80/443 abiertos al mundo; SSH queda restringido a `admin_cidrs`, que por defecto está
# vacío — sin decir desde dónde administras, nadie entra por SSH.
resource "hcloud_firewall" "app" {
  name   = local.name
  labels = local.labels

  rule {
    direction  = "in"
    protocol   = "tcp"
    port       = "80"
    source_ips = ["0.0.0.0/0", "::/0"]
  }

  rule {
    direction  = "in"
    protocol   = "tcp"
    port       = "443"
    source_ips = ["0.0.0.0/0", "::/0"]
  }

  dynamic "rule" {
    for_each = length(var.admin_cidrs) > 0 ? [1] : []

    content {
      direction  = "in"
      protocol   = "tcp"
      port       = "22"
      source_ips = var.admin_cidrs
    }
  }
}
