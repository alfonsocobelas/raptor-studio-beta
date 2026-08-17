# Espejo de container-app-backend/frontend.tf: App Runner es el homólogo de Container Apps
# (imagen → URL con autoscaling gestionado; ADR-004: cómputo = contenedor Node portable).
# Los servicios se crean cuando hay imagen publicada (mismo baile que en Azure: primer
# apply sin servicios, push de imagen, segundo apply con la variable rellena).
resource "aws_security_group" "apprunner" {
  name   = "${local.name}-apprunner"
  vpc_id = data.aws_vpc.default.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_apprunner_vpc_connector" "main" {
  vpc_connector_name = "${local.name}-connector"
  subnets            = data.aws_subnets.default.ids
  security_groups    = [aws_security_group.apprunner.id]
}

resource "aws_apprunner_service" "backend" {
  count        = var.backend_image == "" ? 0 : 1
  service_name = "${local.name}-backend"

  source_configuration {
    authentication_configuration {
      access_role_arn = aws_iam_role.ecr_access.arn
    }

    image_repository {
      image_identifier      = var.backend_image
      image_repository_type = "ECR"

      image_configuration {
        port = "3000"

        runtime_environment_variables = {
          NODE_ENV           = var.env
          AWS_SECRETS_PREFIX = local.name
        }
      }
    }

    auto_deployments_enabled = false
  }

  instance_configuration {
    cpu               = "1024"
    memory            = "2048"
    instance_role_arn = aws_iam_role.backend.arn
  }

  network_configuration {
    egress_configuration {
      egress_type       = "VPC"
      vpc_connector_arn = aws_apprunner_vpc_connector.main.arn
    }
  }

  health_check_configuration {
    protocol = "HTTP"
    path     = "/health"
  }
}

resource "aws_apprunner_service" "frontend" {
  count        = var.frontend_image == "" ? 0 : 1
  service_name = "${local.name}-frontend"

  source_configuration {
    authentication_configuration {
      access_role_arn = aws_iam_role.ecr_access.arn
    }

    image_repository {
      image_identifier      = var.frontend_image
      image_repository_type = "ECR"

      image_configuration {
        port = "8080"
      }
    }

    auto_deployments_enabled = false
  }

  instance_configuration {
    cpu    = "1024"
    memory = "2048"
  }
}
