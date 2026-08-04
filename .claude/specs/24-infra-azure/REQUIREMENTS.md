# Spec: Proveedor `infra=azure` (primer proveedor real de la ranura de infraestructura)

---

## Contexto de negocio

La ranura `infra` existe desde la spec 23 pero sólo ofrece `none`: el catálogo de adapters de infra
(ADR-004) sigue sin materializarse. Esta spec mete el primer proveedor real, Azure, extrayéndolo de
`docs/referencia/` — que es de donde salen los adapters por diseño.

El punto de partida no es "no hay Azure": es que **Azure está dentro de todas las apps emitidas,
la pidas o no**, y sin declarar sus dependencias. Medido el 2026-08-04 sobre la fixture de oro:

```
  storage/azure-blob-file-storage.ts        import '@azure/storage-blob'      ← NO en package.json
  config/loaders/azure/azure-secret-…ts     import '@azure/keyvault-secrets'  ← NO en package.json
                                            import '@azure/identity'          ← NO en package.json
  logger/azure/azure-logger.service.ts      lo referencia logger.module.ts    ← cableado, no muerto
```

Compila en este monorepo porque el acelerador SÍ tiene esos paquetes (`package.json` líneas 21-24) y
la resolución de módulos sube al `node_modules` de la raíz. **En la máquina de un cliente, fuera de
este árbol, `npm install` + `tsc` falla.** Es el mismo patrón que ya se anotó en el ROADMAP (obs. 1)
pero con más alcance del que decía: no es un adapter muerto, es el logger y la config de toda app.

Hallazgo que simplifica el trabajo: el mal llamado `AzureLoggerService` es **winston** con un
transporte OpenTelemetry que sólo se activa en dev/prod. El 90% ya es agnóstico; de Azure sólo es
el transporte.

Decisiones cerradas en brainstorming (2026-08-04):

- **Base sin infra**: el kernel emite lo mínimo honesto — config desde los JSON por entorno más
  variables de entorno, y logger winston a stdout. Azure se enchufa encima.
- **Alcance C1**: config+Key Vault, logger/telemetría (absorbe el plugin `observability`) y storage
  Blob. **Fuera**: email ACS y Terraform → C1b (el plugin `email` arrastra SES y Brevo, y el árbol
  Terraform no se puede verificar aquí sin suscripción ni CLI).
- **Selección de storage por sección de config presente**, igual que ya hace el plugin de email:
  con `storage.azure` se enlaza Blob, sin ella disco local. `make local-setup` sigue funcionando
  sin cuenta de Azure.
- **Sin puertos nuevos todavía**: `ConfigSourcePort`/`LoggerPort`/`SecretsPort` se abstraen con el
  segundo proveedor real (regla de los dos, ADR-004), no ahora.
- **Fixtures**: la de app pasa a ser la de "todo encendido" (postgres, auth+email, `infra=azure`) y
  `app-mongo` cubre `infra=none`. Sin tercera fixture.

## User stories (formato EARS)

- **WHEN** genero una app sin `--infra` **THEN** el árbol emitido no importa ni un `@azure/*` y no
  declara ninguna dependencia de Azure
- **WHEN** genero una app sin `--infra` **THEN** la config sale de los JSON por entorno más las
  variables de entorno, y el logger escribe en stdout (JSON en dev/prod, legible en local/test)
- **WHEN** genero con `--infra=azure` **THEN** se emiten el resolver de `vault.*` con Key Vault, el
  transporte OTel del logger, la telemetría (`instrument.ts` como primer import de `main.ts`) y el
  adapter de Azure Blob, con las cuatro dependencias `@azure/*` declaradas en el `package.json`
- **IF** un recurso declara adjuntos **Y** la config trae sección `storage.azure` **THEN** el
  `StorageModule` enlaza `AzureBlobFileStorage`; sin esa sección, disco local
- **WHEN** uso `--plugins=observability` (forma antigua) **THEN** funciona con aviso de deprecación
  y equivale a `--infra=azure`
- **WHEN** el registro gana el proveedor azure **THEN** la ranura `infra` aparece sola en el
  formulario del CLI y en el wizard del estudio, sin tocar el estudio
- **IF** alguien vuelve a meter un import de `@azure/*` en el kernel base **THEN** un test falla

## Criterios de aceptación

- [ ] `grep -rl "@azure/" ` sobre una app emitida sin infra no devuelve nada
- [ ] Una app emitida sin infra **compila fuera del árbol del acelerador** (typecheck en un
      directorio ajeno al monorepo, con su propio `npm install`)
- [ ] Una app `--infra=azure` declara `@azure/identity`, `@azure/keyvault-secrets`,
      `@azure/storage-blob` y `@azure/monitor-opentelemetry`, y compila
- [ ] `instrument.ts` es el primer import de `main.ts` en la app azure (OTel debe parchear los
      módulos antes de que nadie los cargue)
- [ ] `observability` sale de `PLUGINS`; `--plugins=observability` mapea a `--infra=azure` con aviso
- [ ] Test que falla si el kernel base importa `@azure/*`
- [ ] `slots.json` regenerado con el proveedor nuevo + su test de paridad verde
- [ ] Los 6 gates de oro en verde tras el re-baseline deliberado de la fixture de app
- [ ] Suite del plugin verde

## Referencias (proyecto de referencia y diseño)

- `docs/referencia/libs/backend/src/contexts/shared/infrastructure/config/loaders/azure/`
- `docs/referencia/libs/backend/src/contexts/shared/infrastructure/logger/azure/`
- `docs/referencia/libs/backend/src/contexts/shared/infrastructure/storage/azure-blob-file-storage.ts`
- `docs/referencia/libs/backend/src/contexts/shared/infrastructure/telemetry/`
- Mecanismo de ranuras y manifiestos: spec 23 (`plugins/slots.ts`, `persistence/provider.ts`)
- ⚠️ NUNCA copiar ni citar `docs/referencia/iac/terraform/terraform.auto.tfvars.json` ni
  `docs/referencia/probe.env`: llevan credenciales reales

## Reglas de negocio aplicables

- ADR-004 y regla de los dos: un puerto se abstrae en el 2º-3º adapter real, no en el primero
- Plantillas tontas, lógica en `generator.ts` (regla 8)
- Gate de oro antes de commit; el re-baseline va en commit propio (`chore(golden): …`)
- Seguridad: los secretos nunca en los JSON de config — sólo marcadores `vault.*` que resuelve
  Key Vault en tiempo de arranque

## Fuera de scope (deliberado)

- **Email ACS** y la absorción del plugin `email` (arrastra SES y Brevo) → C1b
- **Terraform** (17 ficheros .tf de la referencia) → C1b; su único gate posible aquí sería el golden,
  sin poder validarlo de verdad
- Proveedores `lowcost`, `aws` y `gcp` → C2/C3/C4
- Puertos abstractos de config/logger/secretos → cuando exista el segundo proveedor
- Despliegue real contra una suscripción de Azure

---

> Aprobado en brainstorming 2026-08-04.
