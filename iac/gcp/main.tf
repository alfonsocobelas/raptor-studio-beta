locals {
  name = "${var.project}-${var.env}"

  labels = {
    project     = var.project
    environment = var.env
    managed_by  = "terraform"
  }
}
