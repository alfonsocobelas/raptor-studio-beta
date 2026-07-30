output "ecr_backend_url" {
  value = aws_ecr_repository.backend.repository_url
}

output "ecr_frontend_url" {
  value = aws_ecr_repository.frontend.repository_url
}

output "db_endpoint" {
  value = aws_db_instance.main.address
}

output "backend_url" {
  value = length(aws_apprunner_service.backend) > 0 ? aws_apprunner_service.backend[0].service_url : null
}

output "frontend_url" {
  value = length(aws_apprunner_service.frontend) > 0 ? aws_apprunner_service.frontend[0].service_url : null
}

output "storage_bucket" {
  value = aws_s3_bucket.storage.bucket
}

# Registros DNS que IT debe publicar para verificar el dominio remitente en SES.
output "ses_dkim_tokens" {
  value = var.sender_domain == "" ? [] : aws_sesv2_email_identity.sender[0].dkim_signing_attributes[0].tokens
}
