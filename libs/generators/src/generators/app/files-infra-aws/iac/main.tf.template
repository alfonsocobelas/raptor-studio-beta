locals {
  name = "${var.project}-${var.env}"

  tags = {
    project     = var.project
    environment = var.env
    managed_by  = "terraform"
  }
}

data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}
