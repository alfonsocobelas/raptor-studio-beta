locals {
  name = "${var.project}-${var.env}"

  labels = {
    project     = var.project
    environment = var.env
    managed_by  = "terraform"
  }

  # El cloud-init deja el servidor listo para `docker compose up`: Docker, el volumen
  # montado y Caddy delante como terminador de TLS. La app la sube el despliegue, no este
  # stack — Terraform crea la casa, no la amuebla.
  cloud_init = templatefile("${path.module}/cloud-init.yaml", {
    domain      = var.domain
    volume_name = local.name
    admin_email = var.admin_email
  })
}
