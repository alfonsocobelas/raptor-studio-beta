# Espejo de communication.tf (ACS email): identidad SES del dominio remitente.
# Igual que en Azure, la verificación DNS la publica IT: los registros salen por output
# y la identidad no envía hasta que SES la marque verificada.
resource "aws_sesv2_email_identity" "sender" {
  count          = var.sender_domain == "" ? 0 : 1
  email_identity = var.sender_domain
}
