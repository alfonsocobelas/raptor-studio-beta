# Terraform — stack Hetzner de Raptor Cloud

Cómputo de las apps generadas con `--infra=raptor`. A diferencia de los stacks de Azure y
AWS, aquí **no hay servicios gestionados: hay un servidor**. Todo lo demás (secretos, logs,
ficheros, email) son SaaS con capa gratuita que se dan de alta a mano una vez — ver
[Alta de los SaaS](#alta-de-los-saas).

> **Esto no es alta disponibilidad.** Un servidor es un punto único de fallo: si se cae, la
> app se cae. Es el trato explícito de Raptor Cloud — unos 4 €/mes compran eso. Para un
> cliente que necesite failover, el proveedor correcto es `azure` o `aws`.

## Qué crea cada fichero

| Fichero           | Recursos                                                                  |
| ----------------- | ------------------------------------------------------------------------- |
| `server.tf`       | `hcloud_server` con el cloud-init, y el volumen persistente de datos       |
| `firewall.tf`     | 80/443 abiertos al mundo; 22 solo desde `admin_cidrs`                     |
| `cloud-init.yaml` | Docker, Caddy (TLS automático) y el enlace `/srv/data` → volumen           |
| `main.tf`         | Naming `${project}-${env}`, etiquetas comunes y render del cloud-init      |
| `outputs.tf`      | IPv4/IPv6 del servidor (para el registro A) y la ruta de datos             |

## Variables

Sin default (obligatoria): `env`. Con default: `project` (`acelerador`), `location`
(`nbg1`), `server_type` (`cx22`, el suelo que aguanta app + Postgres), `image`
(`ubuntu-24.04`), `volume_size_gb` (`20`), `domain` (vacío sirve HTTP por IP, solo dev),
`admin_email` (avisos de caducidad de Let's Encrypt), `ssh_key_names` (claves **ya subidas**
al proyecto de Hetzner) y `admin_cidrs` (vacío = nadie entra por SSH).

## Uso

```sh
export HCLOUD_TOKEN=...            # nunca en el repo
tofu init -backend=false           # sin estado remoto, para validar
tofu validate
tofu apply -var env=prod -var domain=app.cliente.com -var 'admin_cidrs=["1.2.3.4/32"]'
```

Tras el primer `apply`: apuntar el registro A del dominio a `server_ipv4` (el DNS no lo
gestiona este stack) y desplegar con `docker compose` contra `/srv/data`.

Estado remoto: cualquier almacén S3-compatible; R2 es el natural porque ya está en el stack.
R2 no implementa todas las APIs de S3, así que `init` necesita los `skip_*` que documenta
`backend.tf`.

## Alta de los SaaS

Se hacen **una vez, a mano**. Aprovisionarlos con Terraform exigiría dos proveedores más
(Cloudflare, Grafana) para gestionar capas gratuitas que se configuran en cinco minutos.

1. **Infisical** (secretos) — crear proyecto, crear una *machine identity* con universal
   auth y darle acceso de lectura al entorno. Se obtienen `INFISICAL_CLIENT_ID`,
   `INFISICAL_CLIENT_SECRET` y `INFISICAL_PROJECT_ID`, que van al entorno del contenedor.
2. **Cloudflare R2** (ficheros) — crear bucket y un token de API con permiso de
   lectura/escritura sobre él. El `endpoint` es `https://<account>.r2.cloudflarestorage.com`.
3. **Grafana Cloud** (logs) — la pila gratuita ya trae Loki; copiar la URL de push y el id
   de usuario, y crear un token de escritura.
4. **Sentry** (errores, opcional) — crear proyecto Node y copiar el DSN.
5. **Brevo** (email) — verificar el dominio remitente y crear la clave de API.

## Métricas (plugin `metrics` + Grafana Alloy)

Si la app se generó con `--plugins=metrics`, expone `/metrics` protegido por token (sección
`metrics` de su config). Grafana Cloud **no puede raspar** un VPS tras el firewall — ni
conviene abrirle un puerto—, así que el flujo va de dentro hacia fuera: el servicio `alloy`
del compose (`docker-compose.prod.yml`) raspa `backend:3000/metrics` en la red interna con
el bearer token y hace `remote_write` a Grafana Cloud (`config.alloy`).

Del stack gratuito de Grafana Cloud se copian al `.env` del servidor: la URL de
`remote_write` de Prometheus (`GRAFANA_CLOUD_PROM_URL`), el id de usuario
(`GRAFANA_CLOUD_PROM_USER`) y un token de escritura (`GRAFANA_CLOUD_PROM_TOKEN`).
`METRICS_TOKEN` es el mismo valor que el secreto `METRICS_TOKEN` de Infisical que resuelve
`vault.metrics.token`. Sin el plugin, el servicio `alloy` del compose sobra: bórralo.

## Secretos de Infisical ↔ marcadores `vault.*`

El loader del back traduce cada marcador a un secreto en SCREAMING_SNAKE: `vault.x.y` →
`X_Y`. Los que necesita una app completa:

| Marcador en el JSON de entorno | Secreto en Infisical      |
| ------------------------------ | ------------------------- |
| `vault.typeorm.password`       | `TYPEORM_PASSWORD`        |
| `vault.storage.accessKeyId`    | `STORAGE_ACCESSKEYID`     |
| `vault.storage.secretAccessKey`| `STORAGE_SECRETACCESSKEY` |
| `vault.loki.apiKey`            | `LOKI_APIKEY`             |
| `vault.metrics.token`          | `METRICS_TOKEN`           |
| `vault.sentry.dsn`             | `SENTRY_DSN`              |
| `vault.brevo.apiKey`           | `BREVO_APIKEY`            |

## Capas gratuitas (comprobadas 2026-08-17)

| Servicio       | Capa gratuita                                  |
| -------------- | ---------------------------------------------- |
| Infisical      | Proyectos y machine identities suficientes      |
| Cloudflare R2  | 10 GB de almacenamiento, sin coste de egress    |
| Grafana Cloud  | ~50 GB de logs y ~10k series de métricas al mes |
| Sentry         | ~5k eventos al mes                              |
| Brevo          | 300 emails al día                               |
| Hetzner        | No hay capa gratuita: ~4 €/mes el cx22          |

**Estos límites cambian sin avisar.** La cobertura del acelerador no es contractual sino
arquitectónica: cada pieza vive detrás de un puerto que ya tiene 2+ adapters, así que
sustituir Infisical o Loki es escribir un adapter, no rehacer la app. Al revisar esta tabla,
actualizar la fecha.
