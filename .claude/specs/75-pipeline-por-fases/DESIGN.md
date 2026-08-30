# Diseño técnico: pipeline de generación por fases

## Decisión de orquestación

**El runner del frontend encadena streams** (patrón ya existente: la spec 45 añadió un segundo
stream para el relleno). No se crea un orquestador servidor: cada fase es un endpoint NDJSON
independiente y `generate-runner.ts` los llama en secuencia. Ventajas: la cancelación sigue
siendo «cerrar la respuesta», cada traductor de consola queda pequeño, y la lista monotónica
de `generate-phases.ts` se respeta porque los streams llegan en orden.

```
generate/stream ──done ok──▶ fill-slots/stream ──▶ validate/stream ──rojo con sospechosos──▶ repair/stream ──▶ validate/stream (re-run)
      │                          (skip si no hay huecos                │
      └─ skipInstall ⇒ fill/validate/repair nacen skipped              └─ rojo canónico ⇒ repair skipped + informe
```

## Capa generador (`libs/generators/src/generators/fill-flow-slots/`)

### Reintento por hueco (presupuesto 2 propuestas)

- `fillPendingFlowSlots`: cuando el gate rechaza, se re-propone UNA vez con el motivo añadido
  al prompt (`buildFlowSlotPrompt(...) + sección «Intento anterior rechazado: <motivo>»`).
  Si la 2ª también falla el gate → rechazado definitivo (comportamiento actual).
- El informe `FlowFillReport` no cambia de forma; `rejected` guarda el último motivo.

### Modo reparación

- Opciones nuevas en el schema: `repair?: boolean`, `report?: string` (ruta a fichero con la
  salida del fallo de validación).
- En modo repair los candidatos NO son los huecos vacíos sino los **rellenos** (`flow-*` con
  cuerpo) cuyo fichero aparece citado en el contenido del report. Sin candidatos → no-op con
  informe (fallo canónico, se repara en el generador).
- Cada candidato se re-propone con el extracto del report en el prompt; gate por hueco igual
  que hoy; si el gate rechaza se **restaura el cuerpo anterior** (no se deja peor).
- La frontera `validateSlotOnlyEdit` se aplica siempre — la IA nunca toca fuera del hueco.

## Capa studio-api (`apps/studio/libs/backend/src/contexts/studio/generate/`)

### Validación: `POST /studio/validate/stream`

- Ficheros nuevos: `studio-validate.controller.ts`, `validate-progress.ts`,
  `implicated-slots.ts`.
- Body: `{ directory }` (misma guarda `insideWorkspace` que el fill).
- `validate-progress.ts` declara las comprobaciones (en orden, secuenciales):

  | name        | comando                | qué caza                      |
  | ----------- | ---------------------- | ----------------------------- |
  | `typecheck` | `npm run typecheck`    | TS2307, imports rotos         |
  | `unit`      | `npm test`             | jest unit backend             |
  | `front`     | `npm run test:front`   | vitest de componentes         |

- Eventos NDJSON: `{type:'check', name, status:'running'|'ok'|'failed'}` y
  `{type:'done', ok, failedCheck?, suspects?: string[], output}`.
- `implicated-slots.ts`: al fallar, escanea los `*.process.ts` de la app buscando huecos
  `flow-*` **con cuerpo** y devuelve los ids cuyo fichero (basename) aparece en la salida del
  fallo → `suspects`. Vacío = fallo canónico.
- `spawn(..., {detached:true})` + `killGroup` en `res.on('close')`. **Nunca** borra la app.

### Reparación: `POST /studio/repair/stream`

- En `studio-fill.controller.ts` (mismo contexto) o controlador hermano: body
  `{ directory, report }`. Escribe el report a un tmpfile y lanza
  `npx nx generate @raptor/generators:fill-flow-slots --directory=… --bridge=tmp/studio-bridge --repair --report=<tmp> --no-interactive`.
- Reusa `describeFillLine` (los mensajes de consola del generador son los mismos).

## Capa frontend (`apps/studio/libs/frontend/src/domains/studio/generate/`)

### `generate-phases.ts`

- `PhaseKey` += `'fill' | 'validate' | 'repair'`; `CATALOG` pasa de 3 a 6 filas:
  `fill` «Pasos de negocio (IA)», `validate` «Validando la app», `repair` «Reparando huecos».
- `statusAtStart`: las tres nacen `skipped` si `skipInstall`.
- Nueva función pura `applySkip(phases, key, atMs)`: marca `skipped` una fase aún `pending`
  (el nº de huecos solo se conoce al terminar la generación).
- `runningFraction`: ramas nuevas por tiempo (`EXPECTED_FILL_MS`, `EXPECTED_VALIDATE_MS`,
  `EXPECTED_REPAIR_MS`); la barra sigue siendo «N de M fases».
- Los eventos de fill/validate/repair no pasan por `describeProgress` (regex de Nx): el runner
  los traduce a `applyEvent(phases, {phase: key, step})` directamente.

### `generate-runner.ts`

- Tras `{type:'done', ok:true}` del stream de generación: si `skipInstall` → fin (fases ya
  skipped). Si no:
  1. `slots.length > 0` → ejecuta el stream de fill marcando la fase `fill` (la lógica del
     botón actual se extrae a un método reutilizable); si no hay huecos → `applySkip('fill')`.
  2. Stream de validate: cada `check` avanza el `step` de la fase; guarda
     `checks: {name, status}[]` para el desenlace.
  3. Verde → `applySkip('repair')`, outcome `ok`.
     Rojo con `suspects` → stream de repair y una única re-validación; el resultado final
     decide `ok`/`failed`.
     Rojo sin `suspects` → `applySkip('repair')`, fase validate `failed`, outcome `failed`
     con informe canónico.
- El botón manual «Rellenar con IA (puente)» de la spec 45 se conserva para re-ejecuciones.
- Cancelar durante fases nuevas → `outcome: 'cancelled'`, la app NO se borra (el borrado por
  cancelación solo aplica al stream de generación, que ya lo condiciona a `existedBefore`).

### `generate-work.component.ts` / desenlace

- `detail(phase)`: fill → «X rellenos, Y rechazados»; validate → «i/3 comprobaciones»;
  repair → «X reparados».
- Desenlace: sección «Informe de validación» — lista de comprobaciones con pip, huecos
  rellenos/rechazados/pendientes y, en rojo, `<details>` con la salida y la atribución
  (hueco IA vs. «defecto del generador — se arregla con test rojo + golden, no a mano»).

## Riesgos identificados

- **Duración**: validar ≈ 2 min extra tras cada generación. Mitigación: fases visibles con
  progreso por comprobación; cancelable en todo momento.
- **Atribución de sospechosos por basename**: puede dar falsos positivos (dos ficheros con el
  mismo nombre). Aceptado: el gate por hueco impide empeorar; un falso positivo solo gasta
  una propuesta.
- **El puente puede no tener a nadie al otro lado** (15 min de timeout). Igual que la spec 45:
  el hueco queda pendiente y se reporta; la validación corre igual.
- **Doble `npm install` de deps de test**: no aplica — la suite usa las deps ya instaladas.

## Decisiones técnicas

- Orquestación en el runner, no en el servidor: reusa cancelación y traductores existentes.
- Suite emitida (typecheck+unit+front) como gate, sin integración: cabe en la obra sin Docker.
- Presupuesto: 2 propuestas/hueco + 1 ciclo repair + 1 re-validación. Determinista y acotado.
- La reparación vive en `fill-flow-slots` (mismo executor, mismo gate), no en un generador
  nuevo: regla de los dos.
