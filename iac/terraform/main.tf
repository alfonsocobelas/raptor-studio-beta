# Recursos azurerm directos (sin módulos externos) para desplegar las apps en Azure
# Container Apps. Un stack completo por entorno (state + TF_VARS_JSON separados).
# Los recursos concretos viven en ficheros por dominio: identity.tf, acr.tf, key-vault.tf,
# postgres.tf, log-analytics.tf, container-apps-env.tf, container-app-*.tf, role-assignments.tf.

data "azurerm_client_config" "current" {}

# El RG ya existe y es compartido (Cloud_Development); el SP del CI solo tiene permisos dentro de
# él, no para crear RGs. Se usa como data source: Terraform crea sus recursos dentro, sin gestionar
# el RG (ni lo crea ni lo borra). La location de los recursos deriva del propio RG.
data "azurerm_resource_group" "this" {
  name = var.resource_group_name
}
