# Tareas atómicas: proveedor `infra=raptor` (Raptor Cloud, C2)

> Cada tarea = un commit atómico en develop. Implementar UNA, commitear, informar, siguiente.
> Gate permanente: los 6 golden en verde (SIN re-baseline en esta spec) antes de cada commit.
> TDD: test fallido primero en cada tarea con lógica.

---

## Catálogo (las piezas nuevas primero, como en la spec 47)

- [ ] **TASK-01**: Tests + `libs/infra/config-infisical`: `resolveInfisicalConfig` sobre la
      costura `containsVaultReferences`/`resolvePlaceholders`, con `InfisicalReader`
      estructural. Cubre: config sin marcadores no llama a nadie, traducción
      `vault.typeorm.password` → `TYPEORM_PASSWORD`, login universal-auth cacheado entre
      lecturas, secreto ausente, y error de red envuelto en `InfisicalSecretsError` sin
      filtrar el token. Barrel + project.json como las libs hermanas.
- [ ] **TASK-02**: Tests + `libs/infra/observability-loki`: `LokiTransport`
      (`winston.Transport` sobre `fetch`). Cubre: lote por tamaño, descarga por intervalo,
      formato del payload (`streams`/`values` con timestamp en nanosegundos), etiquetas
      fijas de baja cardinalidad, y error de envío tragado a stderr sin propagar.

## Proveedor en el generador

- [ ] **TASK-03**: Tests + manifiesto `raptorInfra` en `app/infra/providers.ts` (value,
      label, `files: 'files-infra-raptor'`, dependencias) registrado en `INFRA_PROVIDERS`.
      `--infra=raptor` aparece en `schema.json` y `slots.json` (tests de paridad en verde).
      Subárbol con el primer fichero: `infisical-config-loader.ts` +
      `infisical-secret-resolver.ts` (copiados del canon de TASK-01) y `apply()` con
      `useInfisicalConfigLoader`.
- [ ] **TASK-04**: Tests + storage: el subárbol emite `s3-file-storage.ts` (mismo canon que
      AWS) y `apply()` enlaza R2 en `StorageModule` por sección de config (`storage`
      presente → R2; ausente → disco local). Sección `storage` con `endpoint`/
      `forcePathStyle` en config-types y config-validation del emitido, y ejemplo de R2 en
      el JSON de producción.
- [ ] **TASK-05**: Tests + logs: el subárbol emite `logger/loki-transport.ts` y
      `logger/raptor-log-transports.ts` (decididos por sección `loki`), y `apply()` los
      registra en la costura `EXTRA_LOG_TRANSPORTS`, espejo de `addAwsLogTransport`.
- [ ] **TASK-06**: Tests + errores: sección `sentry` opcional cableada sobre
      `@raptor/infra-observability-sentry` con import perezoso del SDK (patrón del plugin
      email); sin sección, `@sentry/node` no se carga ni se importa.
- [ ] **TASK-07**: Candado extendido en `infra-free.spec.ts`: una app sin infra no nombra
      Infisical, Loki ni R2, ni en ficheros ni en `package.json`. Test de composición:
      `--infra=raptor --plugins=auth,email` compone y los emails salen por Brevo.

## Terraform

- [ ] **TASK-08**: `iac/hetzner/` nuevo: `server.tf`, `firewall.tf`, `volume.tf`,
      `variables.tf`, `outputs.tf`, `providers.tf`, `versions.tf`, `backend.tf` y
      `cloud-init.yaml` (Docker + Compose + Caddy). `terraform init -backend=false &&
      terraform validate` en verde.
- [ ] **TASK-09**: `iac/hetzner/README.md` espejo del de AWS: qué crea cada fichero,
      variables, alta manual de los SaaS paso a paso, mapa secreto de Infisical ↔ marcador
      `vault.*`, límites de las capas gratuitas **con fecha** y la advertencia de punto
      único de fallo. Fila Hetzner/Raptor añadida a la tabla de `iac/README.md`.

## Emisión de la IaC en la app generada

- [ ] **TASK-10**: Tests + `iac/` dentro de `files-infra-raptor` (copia del stack de
      TASK-08 con sufijo `.template`) y `nameTerraformProject()` en `apply()`, que fija el
      default de la variable `project` al nombre de la app. Test: la app emitida contiene
      `iac/server.tf` con su nombre dentro; una app `--infra=none` no emite `iac/`.
- [ ] **TASK-11**: Lo mismo para `azure` y `aws`: `iac/` dentro de `files-infra-azure` y
      `files-infra-aws`, más el **test de deriva** que compara byte a byte cada `.tf` del
      subárbol con su gemelo del catálogo `iac/<proveedor>` y falla si se separan.

## Verificación

- [ ] **TASK-12**: Verificación fuera del árbol con
      `tools/typecheck-emitted.sh --models=customer,contract,license,project --plugins=auth,email --infra=raptor --dashboard`:
      `npm install` + `tsc` (backend, shared y frontend) a **0 errores** fuera del
      monorepo. Suite del plugin en verde + las libs nuevas + 6 golden vacíos **sin
      re-baseline**. `terraform validate` sobre el `iac/` de la app emitida.
- [ ] **TASK-13**: ROADMAP: marcar C2 `infra-lowcost` como hecha (nombre definitivo Raptor
      Cloud) con la composición cerrada, y anotar en observaciones que la IaC ya viaja
      dentro de la app generada.

---

## Regla del juego

Implementar **UNA** tarea, commit, esperar aprobación antes de seguir.
Si una tarea parece > 1h o > ~150 líneas, partirla en subtareas antes de empezar.

## Bloque separable

TASK-10 y TASK-11 (emisión de la IaC dentro de la app) son independientes del resto: se
pueden posponer o retirar sin tocar ninguna otra tarea. Están aquí porque salieron de la
petición de Alfonso del 2026-08-17 de "añadir también la IaC, y aprovechar para la de AWS";
el stack de AWS ya existía completo desde la spec 47, así que el trabajo real de esa
petición es este.
