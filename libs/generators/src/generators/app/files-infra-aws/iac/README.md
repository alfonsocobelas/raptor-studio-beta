# Terraform — stack AWS del acelerador

Espejo del stack de Azure (`iac/azure`) para apps generadas con `--infra=aws`. Un stack
completo por entorno: App Runner (backend + frontend), RDS Postgres, S3, Secrets Manager,
SES, ECR y CloudWatch Logs. Los valores **nunca van al repo** (misma regla que Azure).

## Qué crea cada fichero

| Fichero         | Recursos                                                                     |
| --------------- | ---------------------------------------------------------------------------- |
| `apprunner.tf`  | Servicios App Runner del back y el front (inyecta `AWS_SECRETS_PREFIX`)      |
| `rds.tf`        | Postgres (password generada → Secrets Manager)                               |
| `secrets.tf`    | Secretos `${local.name}/<clave>` que resuelve el config-loader (`vault.*`)   |
| `s3.tf`         | Bucket de adjuntos (sección de config `storage`)                             |
| `ses.tf`        | Identidad de dominio remitente (sección `ses` del plugin email)              |
| `cloudwatch.tf` | Log group del transporte directo del logger (sección `cloudwatch`)           |
| `iam.tf`        | Rol de instancia con menor privilegio (secretos, bucket, logs) + rol de ECR  |
| `ecr.tf`        | Repositorios de imágenes                                                     |

## Variables

Sin default (obligatorias): `env`. Con default: `project` (`acelerador`), `region`
(`eu-west-1`), `db_name`, `db_username`, `db_instance_class` (`db.t4g.micro`),
`backend_image` / `frontend_image` (vacías en el primer apply, el ECR aún está vacío),
`sender_domain` (vacía desactiva SES), `log_retention_days` (`30`).

## Secretos y marcadores `vault.*`

El config-loader del back (`loaders/aws/aws-config-loader.ts`) resuelve cada marcador
`vault.x.y` del JSON de entorno contra el secreto `${AWS_SECRETS_PREFIX}/x-y` (regla:
fuera el prefijo `vault.`, puntos → guiones; el namespace lo inyecta `apprunner.tf` como
`AWS_SECRETS_PREFIX = local.name`, espejo de `AZURE_KEYVAULT_URL`).

| Secreto (`${local.name}/…`) | Placeholder               | Origen                    |
| --------------------------- | ------------------------- | ------------------------- |
| `typeorm-host`              | `vault.typeorm.host`      | lo escribe Terraform (RDS) |
| `typeorm-username`          | `vault.typeorm.username`  | Terraform                 |
| `typeorm-password`          | `vault.typeorm.password`  | Terraform (generada)      |
| `typeorm-database`          | `vault.typeorm.database`  | Terraform                 |

## Secciones de config de la app emitida

| Sección      | Campos                                        | Efecto                                              |
| ------------ | --------------------------------------------- | --------------------------------------------------- |
| `storage`    | `bucket`, `region?`, `endpoint?`, `forcePathStyle?` | presente → adjuntos a S3; ausente → disco local (endpoint+forcePathStyle = MinIO local) |
| `cloudwatch` | `logGroup` (= output `log_group_name`), `logStream?` | presente → transporte directo a CloudWatch Logs; ausente → solo stdout |
| `ses`        | `region`, `from`                              | presente → emails por SES (plugin email)             |

**Nota sobre logs**: en App Runner el stdout del servicio ya llega solo a los log groups
gestionados (`/aws/apprunner/...`), y el logger emite JSON estructurado en dev/prod, así
que Log Insights funciona **sin** la sección `cloudwatch`. La sección solo hace falta en
despliegues donde nada recoge stdout.

## Queries de ejemplo (CloudWatch Log Insights)

Sobre los campos del JSON del logger (`level`, `message`, `context`, `trace`):

```
# Errores recientes con su contexto
fields @timestamp, level, context, message
| filter level = 'error'
| sort @timestamp desc
| limit 50
```

```
# Volumen por nivel en franjas de 5 minutos (detección de picos)
stats count(*) by level, bin(5m)
```

```
# Actividad de un módulo concreto (context = clase NestJS que logueó)
fields @timestamp, level, message
| filter context like /UserService/
| sort @timestamp desc
```

```
# Trazas de error completas (el campo trace solo viaja en level=error)
fields @timestamp, message, trace
| filter ispresent(trace)
| sort @timestamp desc
| limit 20
```

## Pasos manuales por entorno (una vez)

1. **Verificación DNS de SES**: con `sender_domain` configurado, publicar los registros
   DKIM del output `ses_dkim_tokens` (IT). La identidad no envía hasta que SES la marque
   verificada; mientras tanto el factory de email cae al log sender.
2. **Primer apply en dos fases**: aplicar con `backend_image`/`frontend_image` vacías
   (crea ECR), hacer push de las imágenes, y re-aplicar con las URIs.
3. **Salir del sandbox de SES** (producción): solicitar el aumento de límite en la consola;
   en sandbox solo se puede enviar a direcciones verificadas.
