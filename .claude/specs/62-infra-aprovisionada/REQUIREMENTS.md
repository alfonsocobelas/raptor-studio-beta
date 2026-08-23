# Spec: Infra aprovisionada por el cliente (omitir Terraform)

## Contexto de negocio

Hay clientes que **no quieren que aprovisionemos su infraestructura**: la nube ya existe (la
gestiona su equipo de plataforma) y solo necesitan el código de la app con sus adapters (Key
Vault, Blob, Secrets Manager…). Hoy elegir `infra=azure|aws|raptor` arrastra siempre el
subárbol `iac/` con los ficheros de Terraform, que en ese escenario son ruido e incluso un
riesgo (alguien podría aplicarlos contra una suscripción que no controla).

Se añade a la vista de infraestructura del estudio (pantalla «Antes de generar», grupo
«¿Dónde quieres alojarla?») un **checkbox** «La infraestructura ya está aprovisionada por el
cliente (no generar Terraform)». Marcado, el generador emite los adapters de la nube elegida
pero **omite el subárbol `iac/`**.

## User stories (formato EARS)

- WHEN el usuario elige un proveedor de infra distinto de `none` THEN la vista muestra el
  checkbox «infra aprovisionada» (por defecto desmarcado).
- IF el proveedor elegido es `none` THEN el checkbox no se muestra (no hay IaC que omitir).
- WHEN el checkbox está marcado y se genera THEN la app emitida contiene los adapters del
  proveedor (`libs/backend/.../infrastructure/...`) pero **ningún fichero bajo `iac/`**.
- WHEN el checkbox está desmarcado THEN el emitido es **byte a byte idéntico al actual**
  (gate de oro sin diff).
- WHEN se genera por CLI THEN existe un flag equivalente (`--provisionedInfra`, boolean,
  default `false`) con la misma semántica: el estudio no tiene poderes que la CLI no tenga.
- IF `provisionedInfra=true` con `infra=none` THEN el flag se ignora sin error (no-op).

## Criterios de aceptación

- [ ] Checkbox visible en el grupo de infra del estudio solo cuando el proveedor ≠ `none`.
- [ ] La elección viaja en el comando de generación que construye el wizard.
- [ ] Con el flag activo: cero ficheros `iac/**` en el emitido; adapters, dependencias y
      `apply()` del proveedor intactos (salvo el naming del proyecto Terraform, que ya no aplica).
- [ ] Con el flag inactivo: `/golden-diff` vacío (sin regresión).
- [ ] `schema.json` documenta el flag y el smoke del estudio cubre el caso marcado.

## Referencias del proyecto de referencia

- `libs/generators/src/generators/app/infra/providers.ts` — manifiestos con `files:` mixto
  (adapters + `iac/`).
- `libs/generators/src/generators/app/app.ts:312-314` — `copyVerbatim` del subárbol del
  proveedor: el punto natural de filtrado.
- `apps/studio/libs/frontend/src/domains/studio/generate/generate-catalog.ts` — grupo `infra`
  de la pantalla «Antes de generar».

## Reglas de negocio aplicables

- «Generar, no interpretar»: es un boolean plano de la ranura infra, no una ranura nueva ni
  un proveedor nuevo.
- «Plantillas tontas»: el filtrado de `iac/` vive en `app.ts`/`copyVerbatim`, no en plantillas.
- Los smokes del estudio detectan; nada se parchea a mano en el emitido.

## Fuera de scope (deliberado)

- Selección granular de qué ficheros de Terraform emitir (todo o nada).
- Cambios en los adapters o en la config emitida: el código de la app es el mismo.
- Documentar en el brief cómo debe aprovisionar el cliente (posible mejora posterior).
