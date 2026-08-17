# Estado remoto en S3 con lock nativo (use_lockfile, Terraform >= 1.10 no necesita DynamoDB).
# El bucket se crea UNA vez fuera de este stack (huevo-gallina del estado):
#   aws s3api create-bucket --bucket <project>-tfstate --region eu-west-1 \
#     --create-bucket-configuration LocationConstraint=eu-west-1
# Config parcial: los valores van por -backend-config en init (nunca hardcodear el bucket aquí).
terraform {
  backend "s3" {
    key          = "acelerador/terraform.tfstate"
    use_lockfile = true
  }
}
