# Espejo de key-vault.tf: los secretos que resuelve @acc/infra-config-aws (marcadores vault.*).
# Nombres = claves vault.* de environments/*.json.
resource "aws_secretsmanager_secret" "db_password" {
  name = "${local.name}/typeorm-password"
}

resource "aws_secretsmanager_secret_version" "db_password" {
  secret_id     = aws_secretsmanager_secret.db_password.id
  secret_string = random_password.db.result
}

resource "aws_secretsmanager_secret" "db_host" {
  name = "${local.name}/typeorm-host"
}

resource "aws_secretsmanager_secret_version" "db_host" {
  secret_id     = aws_secretsmanager_secret.db_host.id
  secret_string = aws_db_instance.main.address
}

resource "aws_secretsmanager_secret" "db_user" {
  name = "${local.name}/typeorm-username"
}

resource "aws_secretsmanager_secret_version" "db_user" {
  secret_id     = aws_secretsmanager_secret.db_user.id
  secret_string = var.db_username
}

resource "aws_secretsmanager_secret" "db_name" {
  name = "${local.name}/typeorm-database"
}

resource "aws_secretsmanager_secret_version" "db_name" {
  secret_id     = aws_secretsmanager_secret.db_name.id
  secret_string = var.db_name
}
