# Diseño técnico: Infra aprovisionada por el cliente (omitir Terraform)

## Idea central

Un boolean `provisionedInfra` (default `false`) que atraviesa las 4 capas ya existentes sin
crear ninguna pieza nueva: checkbox del estudio → request de generación → argv validado →
opción del generador. En el generador, el filtrado vive en **un solo punto**: el
`copyVerbatim` del subárbol del proveedor omite todo lo que cuelgue de `iac/`.

```
[generate-cards]──checkbox──>[generate-runner POST]──>[studio-generate.controller]
      │                                                        │
      v                                                        v
[wizard-command buildCommand]                        [generator-args --provisionedInfra]
  (comando que se enseña)                                      │
                                                               v
                                            [app.ts: copyVerbatim sin iac/** + skip
                                             nameTerraformProject]
```

## Capa generador (`libs/generators`)

### `schema.json`

- Nueva propiedad `provisionedInfra`: `boolean`, default `false`, sin `x-prompt` (no es una
  ranura; en CLI se pasa explícita). Descripción: "Skip Terraform files (client provisions
  the infrastructure)".

### `app.ts`

- `AppGeneratorSchema` gana `provisionedInfra?: boolean`.
- En el punto de copia del proveedor (`app.ts:312-314`): si `provisionedInfra`, copiar el
  subárbol filtrando las rutas que empiecen por `iac/`. Opción elegida: parámetro opcional
  `omit?: (relativePath: string) => boolean` en `copyVerbatim` (o una variante local), no un
  borrado posterior del árbol — no escribir para luego borrar.
- `nameTerraformProject` (parte del `apply()` de cada proveedor) reescribe ficheros de
  `iac/` que ya no existen: debe ser no-op si el fichero no está. **Verificar** si ya tolera
  la ausencia (lee con `tree.read` y sale si es null, patrón habitual); si no, protegerlo.
  No se toca la firma de `InfraProvider`.
- Con `infra=none` el flag es no-op de forma natural (no hay `files`).

### Decisión: no es ranura

No entra en el registro de ranuras ni en el manifiesto `GET /studio/slots`: el manifiesto
modela elecciones *proveedor entre varios*; esto es un modificador booleano de la ranura
infra. Meterlo como ranura obligaría a un proveedor sintético (inner-platform).

## Capa studio-api (`apps/studio/libs/backend`)

### `generator-args.ts`

- `GenerateArgsInput` gana `provisionedInfra?: boolean`.
- Se emite `--provisionedInfra` solo cuando es `true` (mismo patrón que `skipInstall`).
  Al no ser ranura, `validateSelection` no cambia.

### `studio-generate.controller.ts` + DTO

- El body de generación acepta `provisionedInfra?: boolean` (class-validator `@IsBoolean()
  @IsOptional()` — con `forbidNonWhitelisted`, front y back cambian juntos).

## Capa estudio (frontend)

### `generate-catalog.ts`

- `CatalogGroup` gana un campo opcional `toggle?: { key: 'provisionedInfra'; label: string;
  hint: string }` que `mergeCatalog` añade solo al grupo `infra`. La redacción vive aquí,
  como el resto de copy.

### `generate-cards.component.ts`

- Pinta el checkbox del grupo cuando `toggle` existe **y** la selección de la ranura ≠
  `none`. Estado en el componente padre junto a `selection`/`plugins`.

### `wizard-command.ts`

- `WizardOptions` gana `provisionedInfra?: boolean`; `buildCommand` añade
  `--provisionedInfra` cuando es `true` (el comando enseñado = el ejecutado).

### `generate-runner.ts`

- `GenerateRequest` gana `provisionedInfra?: boolean` y viaja en el POST.

## Decisiones técnicas

- **Filtrar en la copia, no borrar después**: menos trabajo sobre el Tree y sin ventana en
  la que el emitido tenga los .tf a medias.
- **Flag positivo desde el dominio** (`provisionedInfra`, "la infra ya está aprovisionada")
  en vez de `skipIac`: nombra el hecho de negocio, no el efecto técnico.
- **Checkbox oculto con `none`** en vez de deshabilitado: con `none` no significa nada y
  una opción sin significado no se enseña (mismo criterio que las ranuras de un proveedor).

## Riesgos identificados

- `apply()` de los proveedores toca `iac/` (`nameTerraformProject`): si no tolera la
  ausencia, la generación con el flag revienta. Mitigación: test unitario por proveedor con
  `provisionedInfra=true`.
- Regresión silenciosa con el flag a `false`: mitigación, `/golden-diff` (las fixtures no
  cambian; el gate debe salir vacío).
- El smoke del estudio (`smoke-slots` / vista de generación) puede fijar el nº de controles
  del grupo infra: revisar y actualizar.
