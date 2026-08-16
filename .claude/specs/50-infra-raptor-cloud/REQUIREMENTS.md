# Spec: Proveedor `infra=raptor` — Raptor Cloud (C2)

## Contexto de negocio

El acelerador entrega el mismo dashboard a clientes muy distintos. Hoy la ranura `infra`
solo ofrece nubes de gama alta (`azure`, `aws`) o nada (`none`), y para un cliente pequeño
—una PYME, un piloto, una demo que debe vivir meses— el salto de "nada" a "Azure" es un
salto de coste y de burocracia que mata el proyecto antes de empezar.

**Raptor Cloud no es un proveedor: es una composición con nombre.** Un stack de servicios
con capa gratuita real (secretos, logs, errores, email) sobre un VPS de ~4 €/mes, elegido
para que una app generada corra en producción de verdad con un coste casi nulo y sin
atarse a ningún hiperescalador. El ROADMAP ya la tenía prevista como **C2 `infra-lowcost`**
con las alternativas "a estudiar" (Alfonso, 2026-08-04); esta spec cierra ese estudio y
fija la composición canónica.

Decisión de alcance tomada en el brainstorming (2026-08-17): la variante canónica es
**SaaS con capa gratuita** (Infisical Cloud, Grafana Cloud, Cloudflare R2, Brevo) sobre
**VPS Hetzner**. La variante todo-autohospedado (Infisical self-hosted, Prometheus+Grafana
en el VPS, MinIO) queda fuera de scope: los mismos puertos la admiten después sin
rediseño, porque solo cambia la URL base.

## User stories (formato EARS)

- WHEN se genera una app con `--infra=raptor` THEN el módulo de config resuelve los
  marcadores `vault.*` contra la API REST de Infisical (loader emitido en
  `config/loaders/infisical/infisical-config-loader.ts`, identidad de máquina por
  `INFISICAL_CLIENT_ID`/`INFISICAL_CLIENT_SECRET`, proyecto y entorno por variables de
  entorno).
- IF la configuración de un entorno no contiene ningún marcador `vault.*` THEN no se hace
  ninguna llamada a Infisical y la app arranca sin credenciales (misma propiedad que
  Azure y AWS: local y test nunca tocan la nube).
- WHEN se genera una app con `--infra=raptor` THEN los ficheros van a Cloudflare R2 si la
  sección `storage` de config está presente, y a disco local si no (mismo patrón
  por-sección que Blob en Azure y S3 en AWS).
- WHEN se genera una app con `--infra=raptor` y la sección `loki` de config está presente
  THEN los logs del backend se envían por lotes a Grafana Cloud Loki a través de la
  costura `EXTRA_LOG_TRANSPORTS`, sin dejar de escribirse en stdout.
- IF la sección `sentry` de config está presente THEN los errores y avisos del backend se
  reportan además a Sentry, reutilizando `@raptor/infra-observability-sentry`.
- WHEN se genera una app con `--infra=raptor --plugins=auth,email` THEN los emails salen
  por Brevo si su sección de config está presente (ya funciona hoy vía plugin `email`;
  esta spec solo verifica que la combinación compone).
- IF la app se genera sin `--infra` THEN no aparece ninguna clase, import ni dependencia de
  Infisical, Loki ni R2 en el emitido (candado `infra-free`, extendido a Raptor).
- WHEN se genera una app con `--infra=<proveedor>` THEN el proyecto emitido incluye su
  stack Terraform en `iac/`, listo para `terraform init -backend=false && terraform
  validate` sin credenciales.
- WHEN se despliega con `iac/hetzner` THEN existe un servidor con Docker Compose y Caddy
  (TLS automático), un firewall que solo abre 80/443/22 y un volumen persistente para
  Postgres y los datos de la app.

## Criterios de aceptación

- [ ] `INFRA_PROVIDERS` incluye `raptorInfra` con manifiesto (`files-infra-raptor`,
      dependencias declaradas, secciones de config) y `--infra=raptor` aparece en
      `schema.json` y `slots.json` (tests de paridad en verde).
- [ ] Nueva lib de catálogo `libs/infra/config-infisical` (resolución de `vault.*` contra
      la API REST, con lector estructural falso en los tests) con tests unitarios; el
      subárbol del generador emite el mismo código (canon = catálogo).
- [ ] Nueva lib de catálogo `libs/infra/observability-loki` (`winston.Transport` con lote
      por tamaño/intervalo y errores tragados a stderr, espejo de `CloudWatchLogsTransport`)
      con tests unitarios; el subárbol del generador emite el mismo código.
- [ ] Subárbol `files-infra-raptor` con: loader y resolver de Infisical,
      `s3-file-storage.ts` (mismo canon que AWS, configurado para R2),
      `logger/raptor-log-transports.ts` y el cableado opcional de Sentry.
- [ ] `apply()` del proveedor: cambia el config-loader, enlaza R2 en `StorageModule` por
      sección de config y enchufa los transportes en la costura del logger.
- [ ] `iac/hetzner/` nuevo, espejo de los otros stacks del catálogo: servidor, firewall,
      volumen, cloud-init con Docker Compose + Caddy, `README.md` y `terraform validate`
      en verde. Fila añadida a la tabla de `iac/README.md`.
- [ ] El generador **emite** el stack Terraform del proveedor elegido dentro de la app
      (`iac/` del proyecto emitido) para `azure`, `aws` y `raptor`; con `none` no se emite
      nada. Un test de deriva verifica que el subárbol emitido y el catálogo `iac/` no se
      separan.
- [ ] Candado `infra-free.spec.ts` extendido: una app sin infra no nombra Infisical, Loki
      ni R2, ni emite directorio `iac/`.
- [ ] Los 6 gates de oro en verde **sin re-baseline** (la fixture de `app` sigue en
      `--infra=azure`).
- [ ] Verificación fuera del árbol: app generada con `--infra=raptor`, movida fuera del
      monorepo, `npm install` + `tsc` con 0 errores.

## Referencias del proyecto de referencia

- `.claude/specs/47-infra-aws/` — la spec espejo; misma secuencia de tareas y mismos gates.
- `libs/generators/src/generators/app/infra/providers.ts` — patrón `defineInfra` + `apply()`.
- `libs/generators/src/generators/app/files-infra-aws/` — forma exacta del subárbol a espejar.
- `libs/infra/config-aws/src/lib/aws-config-loader.ts` — la costura `resolvePlaceholders`
  que reutiliza el loader de Infisical.
- `libs/infra/observability-aws/` — forma del transporte winston por lotes.
- `libs/infra/storage-s3/src/lib/s3-file-storage.ts` — ya admite `endpoint` y
  `forcePathStyle`: R2 no necesita adapter nuevo.
- `libs/infra/observability-sentry/src/lib/sentry-logger.ts` — adapter ya escrito, con
  contrato estructural sobre el SDK.
- `iac/aws/README.md` e `iac/README.md` — espejo de estructura y convenciones comunes.

## Reglas de negocio aplicables

- **Regla de los dos**: los puertos (`vault.*`, `FileStoragePort`, `EXTRA_LOG_TRANSPORTS`,
  `EmailSender`, `AppLogger`) ya están validados con 2+ adapters. Aquí **no se abre
  ninguna abstracción nueva**; Raptor es el tercer adapter de cada uno.
- **Generar, no interpretar**: Raptor Cloud es UNA composición fija, no un configurador de
  proveedores. Quien quiera Backblaze en vez de R2 cambia el `endpoint` de su config; quien
  quiera otro gestor de secretos escribe su adapter. La ranura no crece en opciones.
- Plantillas tontas, lógica en `providers.ts`.
- El emitido debe compilar fuera del monorepo con sus dependencias declaradas.
- Nunca commitear credenciales ni tfvars con valores.

## Decisiones ya cerradas (no re-litigar sin motivo nuevo)

1. **Infisical para secretos**, no Bitwarden ni Doppler. Bitwarden Secrets Manager obliga a
   `@bitwarden/sdk-napi` (binario nativo: frágil en CI y en imágenes Docker slim); Doppler
   no se autohospeda y su capa gratuita es más estrecha. Infisical tiene API REST simple,
   capa gratuita amplia y camino de salida al autohospedaje sin cambiar el adapter.
2. **Sin SDK propietario**: el loader de Infisical y el transporte de Loki hablan HTTP con
   el `fetch` nativo de Node 24. Raptor Cloud no añade **ninguna** dependencia npm nueva
   salvo `@aws-sdk/client-s3` (reutilizado para R2, cliente de facto de S3-compatible) y,
   opcional, `@sentry/node`. Es coherente con el espíritu del proveedor: poco coste, poca
   superficie.
3. **Cloudflare R2 como almacenamiento canónico**: 10 GB gratis y sin coste de egress, y
   el adapter S3 ya lo soporta con `endpoint` + `forcePathStyle`. Backblaze B2 y MinIO
   valen con el mismo adapter y quedan documentados en el README, no en el código.
4. **Grafana Cloud Loki para logs** y **Sentry para errores**: capas gratuitas amplias
   (~50 GB/mes de logs; 5k eventos/mes) y ambos encajan en costuras que ya existen.
5. **Hetzner para el cómputo**: mejor precio/rendimiento con datacentros en la UE y
   proveedor Terraform oficial (`hcloud`). Un único servidor con Docker Compose; nada de
   Kubernetes.
6. **Emitir la IaC dentro de la app** (petición de Alfonso, 2026-08-17). El stack de AWS ya
   existía completo en `iac/aws/` desde la spec 47 —no había nada que "añadir" ahí—, así
   que el trabajo real de esa petición es que el proyecto entregado al cliente se lleve su
   Terraform en vez de dejarlo en el repo del acelerador. Se aplica a `azure`, `aws` y
   `raptor`.

## Riesgo aceptado explícitamente

Las capas gratuitas cambian sin avisar y algún proveedor puede recortarlas o desaparecer.
La cobertura es arquitectónica, no contractual: cada pieza vive detrás de un puerto que ya
tiene 2+ adapters, así que sustituir Infisical o Loki es escribir un adapter, no rehacer la
app. Se documenta en el README del proveedor con la fecha de la última comprobación de
límites (2026-08-17).

## Fuera de scope (deliberado)

- La variante **todo autohospedado** (Infisical self-hosted, Prometheus+Grafana en el VPS,
  MinIO). Los mismos puertos la admiten cambiando la URL base; sin cliente que la pida, no
  se construye.
- **Aprovisionar los SaaS con Terraform** (proyecto de Infisical, stack de Grafana Cloud,
  bucket de R2 vía el proveedor de Cloudflare). Se crean a mano una vez y se documenta el
  paso a paso: añadir dos proveedores Terraform más por 10 GB gratis es coste sin retorno.
- **Métricas** (`metrics-prometheus` ya existe en el catálogo y no está enchufado a ninguna
  ranura): es un hueco real, pero es el mismo hueco en Azure y AWS. Spec aparte.
- **CD / pipeline de despliegue** al VPS (build, push de imagen, `docker compose up`).
  Entra en el backlog de rescates, no aquí.
- `terraform plan`/`apply` reales contra Hetzner: no hay cuenta todavía. El gate de esta
  spec es `terraform validate`, igual que quedó AWS en la spec 47.
- Cambiar la fixture de oro de `app` a Raptor (se queda en Azure como "todo encendido").
