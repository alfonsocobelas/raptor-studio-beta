# Spec: Redis para sesiones en todos los proveedores de infra

## Contexto de negocio

La spec 55 dejó la ranura `sessionStore=redis` funcionando (adapter de sesiones, rate limit,
health, compose local/test) pero con la pieza de infraestructura cloud escrita **solo para
azure** (`managed-redis.tf` + secretos en Key Vault). Con `infra=aws` o `infra=raptor` el
generador deja una nota honesta de "Redis pendiente de IaC" en `iac/README.md` y valores de
entorno azure-specific (puerto 10000, TLS) que no valen para esos proveedores. Esta spec
cierra ese pendiente declarado: cada proveedor de infra emite su pieza de Redis y los
entornos cloud llevan los valores correctos por proveedor.

## User stories (formato EARS)

- WHEN se genera una app con `sessionStore=redis` e `infra=aws` THEN `iac/` contiene el
  Terraform de ElastiCache (nodo único, TLS + auth token, `noeviction`), los secretos
  `redis-host`/`redis-password` en Secrets Manager y la policy IAM ampliada para leerlos.
- WHEN se genera una app con `sessionStore=redis` e `infra=raptor` THEN
  `iac/docker-compose.prod.yml` incluye un servicio `redis:7-alpine` con `requirepass` y
  `noeviction`, y `iac/README.md` documenta las altas a mano (`.env` + Infisical).
- WHEN se genera una app con `sessionStore=redis` e `infra=azure` THEN el comportamiento
  actual no cambia (`managed-redis.tf` + secretos KV, entornos cloud a puerto 10000 TLS).
- WHEN se genera con `sessionStore=redis` THEN los `environments/{dev,qa,prod}.json` llevan
  el puerto y el flag TLS del proveedor de infra elegido (azure 10000/tls, aws 6379/tls,
  raptor 6379/sin tls), siempre con `vault.redis.host`/`vault.redis.password`.
- IF el proveedor de infra no tiene pieza de Redis (proveedor futuro) THEN se mantiene la
  nota "Redis pendiente de IaC" en `iac/README.md` (pendiente honesto, nunca en silencio).
- IF se genera con `--provisionedInfra` THEN no se emite nada bajo `iac/` y el plugin de
  Redis degrada en silencio (comportamiento actual, ahora fijado con test).

## Criterios de aceptación

- [ ] `PluginContext` lleva el proveedor de infra; desaparece el sniffing de `key-vault.tf`.
- [ ] aws: `iac/elasticache.tf` + secretos + patch de `iam.tf`; sin nota de pendiente.
- [ ] raptor: servicio redis en el compose de prod + sección en el README; sin nota de pendiente.
- [ ] azure: sin cambios de comportamiento (mismo `managed-redis.tf`, mismos secretos).
- [ ] Entornos dev/qa/prod con puerto/tls por proveedor.
- [ ] Suite del generador verde y `/golden-diff` limpio (el golden usa `sessionStore=postgres`,
      no debe moverse ni un byte).

## Referencias del proyecto de referencia

- `docs/referencia/iac/terraform/managed-redis.tf` (canon del que se calcó la pieza azure).
- Patrón de secretos aws: `libs/generators/src/generators/app/files-infra-aws/iac/secrets.tf.template` y `rds.tf.template`.
- Patrón de secretos raptor: `files-infra-raptor/iac/README.md` (tabla `vault.*` ↔ SCREAMING_SNAKE) y `docker-compose.prod.yml` (doble viaje de `POSTGRES_PASSWORD`).

## Reglas de negocio aplicables

- `noeviction` en todos los proveedores: este Redis es fuente de verdad de sesiones; bajo
  presión de memoria queremos fallos a gritos (503), no sesiones desalojadas (razonamiento
  de la spec 55, se replica en aws/raptor).
- Las piezas condicionales de IaC viven inline en el plugin (precedente `MANAGED_REDIS_TF`):
  los subárboles `files-infra-*` se copian literales y `iac-drift.spec.ts` exige igualdad
  exacta con el canon `iac/<proveedor>/`.

## Fuera de scope (deliberado)

- `terraform plan/apply` real contra cuentas aws/hetzner (la cuenta aws sigue pendiente
  desde la spec 47).
- Red privada / VPC connector nuevo en aws: se reutiliza el SG de App Runner ya existente
  (mismo patrón que RDS).
- Exponer `sessionStore` en el studio (pendiente aparte de la spec 55).
- Mover las piezas condicionales a plantillas `files-infra-*` (exigiría rediseñar el
  contrato del drift test; no aporta hoy).
