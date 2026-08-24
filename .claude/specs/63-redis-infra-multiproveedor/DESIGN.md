# Diseño técnico: Redis para sesiones en todos los proveedores de infra

## Piezas del generador (no hay capa backend/frontend nueva: todo es emisión)

### 1. `PluginContext.infra` (sustituye el sniffing)

- `plugins/plugin.ts`: campo nuevo `infra: string` (nombre del proveedor: `none|azure|aws|raptor`).
- `app.ts:408`: `{ ..., sessionStore, infra: infra.name }`.
- `redis-session.plugin.ts#addCloudRedis`: `switch (context.infra)` en lugar de
  `tree.exists('iac/key-vault.tf')`. La rama por defecto conserva la nota
  "Redis pendiente de IaC" (proveedores futuros).

### 2. Entornos cloud por proveedor (`addRedisConfigSection`)

`perEnvironment` deja de ser constante única: local/test no cambian; dev/qa/prod salen de
una tabla por proveedor:

| infra  | host               | port  | password                | tls   |
| ------ | ------------------ | ----- | ----------------------- | ----- |
| azure  | vault.redis.host   | 10000 | vault.redis.password    | true  |
| aws    | vault.redis.host   | 6379  | vault.redis.password    | true  |
| raptor | vault.redis.host   | 6379  | vault.redis.password    | false |
| otro   | vault.redis.host   | 6379  | vault.redis.password    | true  |

En raptor `REDIS_HOST` (Infisical) valdrá `redis` (el servicio del compose) — mismo patrón
que `TYPEORM_HOST`; el marcador se mantiene `vault.*` para no especializar el JSON.

### 3. aws: `ELASTICACHE_TF` inline → `iac/elasticache.tf`

Espejo de `managed-redis.tf`, con el estilo de `rds.tf`:

```
random_password.redis (32, sin especiales — restricción de auth_token)
aws_elasticache_subnet_group.redis        (subnets de la VPC default, como RDS)
aws_security_group.redis                  (6379 solo desde aws_security_group.apprunner)
aws_elasticache_parameter_group.redis     (family redis7, maxmemory-policy=noeviction)
aws_elasticache_replication_group.redis   (nodo único cache.t4g.micro, engine 7.1,
                                           transit_encryption_enabled=true, auth_token,
                                           automatic_failover_enabled=false)
aws_secretsmanager_secret(+version) redis_host / redis_password
  → "${local.name}/redis-host" = primary_endpoint_address
  → "${local.name}/redis-password" = random_password.redis.result
```

Patch de `iam.tf` (guardado por `includes('redis_host')`): añadir los dos ARNs a la lista
`resources` del statement `ReadSecrets` — la policy enumera ARNs uno a uno y sin esto el
`GetSecretValue` falla en el arranque.

### 4. raptor: parche del compose de prod + README

- `iac/docker-compose.prod.yml`: servicio `redis` (`redis:7-alpine`, `restart:
  unless-stopped`, `command` con `--requirepass ${REDIS_PASSWORD}` y
  `--maxmemory-policy noeviction`, sin volumen), `redis` añadido al `depends_on` del
  backend, y `REDIS_PASSWORD` sumado a la lista de variables del `.env` en la cabecera.
- `iac/README.md`: sección nueva "Redis para sesiones" con el doble viaje (`.env` para el
  contenedor + `REDIS_HOST`/`REDIS_PASSWORD` en Infisical), mismo patrón que Postgres.

## Decisiones técnicas

- **Inline en el plugin, no plantillas `files-infra-*`**: `iac-drift.spec.ts` y los specs de
  infra exigen igualdad exacta subárbol↔canon; las piezas condicionales por ranura siguen el
  precedente `MANAGED_REDIS_TF`.
- **`infra` en el contexto y no flujo inverso** (infra sabiendo de sessionStore): los plugins
  corren antes de `infra.apply`, pero los ficheros `iac/` ya están copiados (app.ts:317);
  el plugin de la ranura sigue siendo el único dueño de la pieza Redis.
- **Nodo único sin HA en aws**: mismo razonamiento que azure (`high_availability_enabled=false`)
  — con backend en réplica única, pagar HA en Redis protege el eslabón equivocado.
- **TLS on en aws, off en raptor**: `auth_token` de ElastiCache exige transit encryption; en
  raptor el tráfico no sale de la red interna del compose.

## Riesgos identificados

- `engine_version`/atributos de ElastiCache sin `terraform plan` real (no hay cuenta aws,
  fuera de scope desde la spec 47): mitigado calcando el estilo/recursos de `rds.tf` y
  dejándolo anotado en el README de aws como pendiente de plan.
- Cambiar `PluginContext` rompe los tests que construyen contextos a mano: se actualizan en
  la misma tarea (typecheck lo caza).
- El golden no debe moverse (usa `sessionStore=postgres`): gate `/golden-diff` antes de
  cada commit que toque el plugin.
