# Diseño técnico: proveedor `infra=raptor` (Raptor Cloud)

## Mapa: qué pieza cubre cada puerto

```
                       ┌──────────────── app emitida (backend) ────────────────┐
                       │                                                        │
  vault.* ────────────>│ ConfigModule ── loader ──┐                            │
                       │                           └─> Infisical REST  (NUEVO) │
  FileStoragePort ────>│ StorageModule ── adapter ─┴─> S3Client → R2 (REUSO)   │
  EXTRA_LOG_TRANSPORTS>│ LoggerModule ── transport ─> Loki push    (NUEVO)     │
  AppLogger ──────────>│              └───────────── > Sentry      (REUSO)     │
  EmailSender ────────>│ AuthModule  ── sender ─────> Brevo        (YA EXISTE) │
                       └────────────────────────────────────────────────────────┘
                                          │
                                   corre sobre
                                          ▼
                       ┌──────────── iac/hetzner (NUEVO) ──────────┐
                       │ hcloud_server + firewall + volumen        │
                       │ cloud-init: Docker Compose + Caddy (TLS)  │
                       │ contenedores: backend · frontend · postgres│
                       └───────────────────────────────────────────┘
```

Tres piezas de código genuinamente nuevas (loader de Infisical, transporte de Loki, stack
de Hetzner). Todo lo demás es cableado de adapters que ya existen y están probados.

## Ranura del generador

`libs/generators/src/generators/app/infra/providers.ts` gana un cuarto manifiesto, calcado
del de AWS:

```ts
export const raptorInfra = defineInfra({
  value: 'raptor',
  label: 'Raptor Cloud (Infisical, R2, Grafana Loki, Brevo — low cost)',
  files: 'files-infra-raptor',
  dependencies: {
    '@aws-sdk/client-s3': '^3.700.0',   // R2 habla S3; es el único SDK de nube que entra
    'winston-transport': '^4.7.0'
  },

  apply(tree, context) {
    useInfisicalConfigLoader(tree, context)   // espejo de useAwsConfigLoader
    reshapeStorageConfigForR2(tree, context)  // sección storage con endpoint obligatorio
    bindR2Storage(tree, context)              // espejo de bindS3Storage
    addLokiConfigSection(tree, context)
    addRaptorLogTransports(tree, context)     // costura EXTRA_LOG_TRANSPORTS
    nameTerraformProject(tree, context)       // default de `project` en variables.tf
  }
})
```

Nótese lo que **no** hay: ni `instrument.ts` ni auto-instrumentación OTel. El logger base ya
escribe JSON estructurado a stdout; Loki lo recoge por el transporte, y las trazas
distribuidas siguen fuera de scope (una app, un backend) igual que en AWS.

## Pieza nueva 1 — `libs/infra/config-infisical`

Mismo contrato que `config-aws`: una función que resuelve los marcadores contra el
proveedor, apoyada en `containsVaultReferences` / `resolvePlaceholders` de
`@raptor/infra-ports`. Si la config no trae marcadores, **no se hace ni una llamada** — es
lo que permite que local y test arranquen sin credenciales.

```ts
export interface InfisicalReader {
  /** Contrato estructural mínimo; el test inyecta un falso y la prod usa fetch */
  fetchSecret(name: string): Promise<string | undefined>
}

export async function resolveInfisicalConfig<T>(raw: T, reader?: InfisicalReader): Promise<T>
```

Flujo del lector real, dos llamadas HTTP con el `fetch` nativo (sin SDK):

```
  POST {siteUrl}/api/v1/auth/universal-auth/login   {clientId, clientSecret}
       └─> accessToken (se cachea en memoria mientras viva el proceso)
  GET  {siteUrl}/api/v3/secrets/raw/{SECRET_NAME}?workspaceId=…&environment=…
       └─> secretValue
```

Variables de entorno (el "dónde", igual que `AZURE_KEYVAULT_URL` y `AWS_SECRETS_PREFIX`):
`INFISICAL_SITE_URL` (default `https://app.infisical.com`, la costura del autohospedaje),
`INFISICAL_CLIENT_ID`, `INFISICAL_CLIENT_SECRET`, `INFISICAL_PROJECT_ID`, `INFISICAL_ENV`.

Traducción de la clave: `vault.typeorm.password` → `TYPEORM_PASSWORD` (los puntos se unen
con `_` y se sube a mayúsculas, que es la convención de nombres de Infisical; Azure usa `-`
y AWS `/`). Errores: `InfisicalSecretsError` con causa, sin filtrar el token en el mensaje.

## Pieza nueva 2 — `libs/infra/observability-loki`

`winston.Transport` espejo exacto de `CloudWatchLogsTransport` (spec 47, TASK-01): lote con
descarga por tamaño o por intervalo, y error de envío **tragado a stderr sin propagar** —un
fallo del backend de logs no puede tumbar la petición del usuario.

```
  log() ──> cola en memoria ──┬── ≥ batchSize ──┐
                              └── cada flushMs ─┴──> POST {url}/loki/api/v1/push
                                                     Authorization: Basic user:apiKey
                                                     { streams: [{ stream: {app, env, level},
                                                                   values: [[nanoTs, línea]] }] }
```

Etiquetas de stream fijas y de baja cardinalidad (`app`, `env`, `level`): Loki cobra caro
—y rinde mal— con etiquetas de alta cardinalidad, así que el resto del contexto viaja en la
línea JSON, no en las labels. Es la trampa clásica de Loki y conviene dejarla escrita.

## Reusos, sin código nuevo

- **Ficheros → R2**: `s3-file-storage.ts` ya admite `endpoint` y `forcePathStyle`
  (verificado en el catálogo y en la plantilla de `files-infra-aws`). El subárbol de Raptor
  emite el mismo fichero; solo cambia la config de ejemplo:
  `{ endpoint: 'https://<account>.r2.cloudflarestorage.com', region: 'auto', forcePathStyle: true }`.
- **Errores → Sentry**: `SentryLogger` ya existe con contrato estructural sobre el SDK. Se
  enchufa por sección `sentry` de config; sin sección, no se carga `@sentry/node` (import
  perezoso en el factory, igual que hace el plugin de email con sus proveedores).
- **Email → Brevo**: nada que hacer. Ya está en el plugin `email`; esta spec solo verifica
  con un test que `--infra=raptor --plugins=auth,email` compone.

## Secciones de config del emitido

```jsonc
// config/production.json  (los valores sensibles son marcadores, nunca literales)
{
  "storage":  { "bucket": "…", "region": "auto", "endpoint": "https://…r2.cloudflarestorage.com",
                "forcePathStyle": true, "accessKeyId": "vault.storage.accessKeyId",
                "secretAccessKey": "vault.storage.secretAccessKey" },
  "loki":     { "url": "https://logs-prod-…grafana.net", "user": "123456",
                "apiKey": "vault.loki.apiKey", "batchSize": 100, "flushMs": 5000 },
  "sentry":   { "dsn": "vault.sentry.dsn", "environment": "production" },
  "brevo":    { "apiKey": "vault.brevo.apiKey", "from": "no-reply@cliente.com" }
}
```

Cada sección ausente apaga su adapter y deja el de por defecto (disco local, solo stdout,
sin Sentry, email al log). La misma imagen sirve para local y para producción.

## Emisión de la IaC dentro de la app

Descubrimiento que simplifica la tarea: `copyVerbatim` ya copia el subárbol del proveedor
tal cual al raíz del proyecto emitido, quitando el sufijo `.template`. **No hace falta
mecanismo nuevo**: basta con colgar `iac/` dentro de cada `files-infra-*`.

```
  files-infra-raptor/iac/*.tf.template  ──copyVerbatim──>  apps/<app>/iac/*.tf
  files-infra-aws/iac/*.tf.template     ──copyVerbatim──>  apps/<app>/iac/*.tf
  files-infra-azure/iac/*.tf.template   ──copyVerbatim──>  apps/<app>/iac/*.tf
```

El único valor que depende de la app es el nombre del proyecto, que hoy es el default de la
variable `project` en `variables.tf`. Lo reescribe `nameTerraformProject()` en `apply()` —
lógica en `providers.ts`, plantilla tonta, como manda la doctrina.

Riesgo asumido: los `.tf` quedan duplicados entre el catálogo `iac/<prov>` (canon) y el
subárbol del generador, exactamente como ya pasa con `config-aws` → `files-infra-aws`. La
mitigación es un **test de deriva** que compara byte a byte cada fichero del subárbol con su
gemelo del catálogo y falla si se separan. Barato y cierra el agujero que hoy solo cubre la
disciplina.

## Pieza nueva 3 — `iac/hetzner`

Espejo de los otros tres stacks del catálogo (mismo naming `${project}-${env}`, mismos tags,
mismo backend remoto parcial, misma regla de "sin valores en el repo"), pero con una forma
mucho más simple: **no hay servicios gestionados, hay un servidor**.

| Fichero          | Recursos                                                              |
| ---------------- | --------------------------------------------------------------------- |
| `server.tf`      | `hcloud_server` (cx22, Ubuntu 24.04) con `user_data` de cloud-init     |
| `firewall.tf`    | Solo 80/443 abiertos al mundo y 22 restringido a `admin_cidrs`         |
| `volume.tf`      | Volumen persistente montado en `/srv/data` (Postgres + adjuntos)       |
| `dns.tf`         | Registro A opcional (desactivado si no se da la zona)                  |
| `cloud-init.yaml`| Docker, Compose, Caddy con TLS automático, `docker compose up -d`      |
| `variables.tf`   | `env` (obligatoria), `project`, `location` (`nbg1`), `server_type`, …  |
| `outputs.tf`     | IP pública, nombre del servidor, ruta del volumen                      |

Los SaaS (Infisical, Grafana Cloud, R2, Brevo, Sentry) **no se aprovisionan aquí**: se crean
a mano una vez y su paso a paso vive en `iac/hetzner/README.md`, junto con qué secreto de
Infisical alimenta a qué marcador `vault.*`.

Gate de esta spec: `terraform init -backend=false && terraform validate`. Sin cuenta de
Hetzner no hay `plan` posible — la misma situación en la que quedó AWS en la spec 47, y se
declara como tal en lugar de fingir verificación.

## Decisiones técnicas

- **HTTP con `fetch` nativo en vez de SDK** (Infisical y Loki): cero dependencias nuevas,
  cero binarios nativos, y tests con un falso estructural en vez de mocks del SDK. El coste
  es mantener nosotros dos clientes HTTP diminutos; a cambio, el proveedor "barato" no
  arrastra 30 MB de `node_modules`.
- **El token de Infisical se cachea en memoria, no en disco**, y se renueva al caducar.
  Nada de ficheros de credenciales en el contenedor.
- **Adapters por sección de config, no por variable de entorno**: es el patrón que ya usan
  Azure, AWS y el plugin de email. Coherencia por encima de novedad.
- **Un solo servidor, sin orquestador**: Docker Compose sobre un VPS. Kubernetes en un
  proveedor cuyo argumento es el coste sería una contradicción.
- **`terraform validate` como gate declarado**, no `plan`. Se dice lo que se verifica.

## Riesgos identificados

- **Las capas gratuitas se mueven** — mitigación: puertos con 2+ adapters; cambiar de
  proveedor es escribir un adapter. Límites fechados en el README (2026-08-17).
- **Cardinalidad de etiquetas en Loki** — mitigación: labels fijas y documentadas; el
  contexto va en la línea JSON.
- **Deriva entre `iac/` del catálogo y el subárbol emitido** — mitigación: test de deriva.
- **La API de Infisical puede cambiar de versión** (`/api/v3/secrets/raw`) — mitigación:
  una única función `fetchSecret` concentra la superficie; el resto del loader no la ve.
- **Un VPS es un punto único de fallo**, sin réplica ni failover. Es el trato explícito de
  Raptor Cloud: 4 €/mes compra eso. Debe estar escrito en el README para que nadie lo venda
  como alta disponibilidad.
