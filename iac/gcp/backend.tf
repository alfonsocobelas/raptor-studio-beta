# Estado remoto en GCS (lock nativo). El bucket se crea UNA vez fuera del stack:
#   gcloud storage buckets create gs://<project>-tfstate --location=europe-west1
# Config parcial: bucket por -backend-config en init.
terraform {
  backend "gcs" {
    prefix = "acelerador/state"
  }
}
