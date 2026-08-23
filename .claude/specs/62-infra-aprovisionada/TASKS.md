# Tareas atómicas: Infra aprovisionada por el cliente (omitir Terraform)

> Cada tarea = un commit en `develop`. Implementar UNA, commit, esperar revisión.
> Orden: generador (con su gate de oro) → studio-api → estudio.

## Generador

- [x] TASK-01: Test + opción `provisionedInfra` en `schema.json` y `AppGeneratorSchema`;
      filtrado de `iac/**` en la copia del subárbol del proveedor (`app.ts`). Test rojo
      primero: con `infra=azure --provisionedInfra` no existe `iac/`, sí los adapters.
- [x] TASK-02: Test por proveedor (azure/aws/raptor) con el flag activo: la generación
      completa no revienta y `nameTerraformProject` tolera la ausencia de `iac/`
      (protegerlo si hace falta).
- [x] TASK-03: Gate de oro `/golden-diff` con el flag inactivo (diff vacío; sin re-baseline).
      Vacío en las 6 fixtures (2026-08-24).

## Studio-api

- [ ] TASK-04: Test + `provisionedInfra` en `GenerateArgsInput`/`buildGeneratorArgs`
      (emite `--provisionedInfra` solo cuando true) y en el DTO del controller de generación.

## Estudio (frontend)

- [ ] TASK-05: Test + `toggle` del grupo infra en `generate-catalog.ts` y
      `provisionedInfra` en `WizardOptions`/`buildCommand`.
- [ ] TASK-06: Test + checkbox en `generate-cards.component.ts` (visible solo con
      proveedor ≠ `none`) y viaje en `generate-runner.ts` hasta el POST.

## Validación

- [ ] TASK-07: Smoke del estudio (marcar checkbox → comando y request llevan el flag) y
      suite completa verde.
