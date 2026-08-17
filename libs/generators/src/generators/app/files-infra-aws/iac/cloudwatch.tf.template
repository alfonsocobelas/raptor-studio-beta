# Espejo de log-analytics.tf (Azure): el log group del transporte directo del backend
# (logger/aws-log-transports.ts, sección de config `cloudwatch`). App Runner crea aparte
# sus propios log groups gestionados con el stdout del servicio; este es el que la app
# referencia por nombre en `cloudwatch.logGroup`. Los streams los crea la app (el rol
# solo puede escribir en este group: menor privilegio, sin CreateLogGroup).
resource "aws_cloudwatch_log_group" "backend" {
  name              = local.name
  retention_in_days = var.log_retention_days

  tags = local.tags
}
