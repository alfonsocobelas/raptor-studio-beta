# Spec 75: Pipeline de generación por fases (rellenar IA → validar → reparar)

> Idea 37 del ROADMAP (2026-08-29, pedida por Alfonso). Extiende la spec 42 (obra con pasos
> visibles) y la spec 45 (relleno en la obra). Concreta la idea 16 (validación post-generación).

## Contexto de negocio

Hoy la pantalla de obra termina en «Instalando dependencias». Si el diseño tiene flujos con
pasos de negocio, el relleno IA es un **botón manual** en el desenlace; y nadie ejecuta la
suite de la app emitida: el usuario descubre los problemas al arrancarla. La obra debe
continuar sola después de instalar: rellenar los huecos `@ai:*` de flujo por el puente,
validar la app con su propia suite, y si algo generado por IA falló, intentar repararlo
dentro de un presupuesto acotado — **sin tocar jamás el código canónico emitido** (doctrina
«las demos detectan, no se parchean»).

## User stories (formato EARS)

- WHEN la generación termina con éxito e install se ejecutó AND hay huecos `flow-*` pendientes,
  THEN la obra encadena automáticamente la fase «Pasos de negocio (IA)» sin intervención manual.
- WHEN el relleno termina (o no había huecos), THEN la obra ejecuta la fase «Validando la app»:
  typecheck + suite unitaria backend + suite frontend de la app emitida, con progreso visible
  por comprobación.
- IF la validación falla AND el fallo implica ficheros con huecos `@ai:*` rellenos por IA,
  THEN la fase «Reparando» re-propone SOLO esos huecos con el informe del fallo en el prompt,
  con presupuesto acotado, y re-valida una única vez.
- IF la validación falla en código canónico (sin hueco IA implicado), THEN NO hay reparación:
  la obra lo reporta como defecto del generador (accionable, con la salida del fallo).
- WHEN el gate por hueco rechaza una propuesta, THEN se re-propone una vez incluyendo el motivo
  del rechazo en el prompt antes de darlo por rechazado.
- IF el usuario generó con `skipInstall`, THEN las tres fases nuevas nacen `skipped` (sin
  node_modules no hay gate ni suite).
- IF el diseño no tiene huecos de flujo, THEN «Pasos de negocio (IA)» y «Reparando» nacen
  `skipped` y la validación corre igualmente.
- WHILE cualquiera de las fases nuevas corre, THEN cancelar la obra mata el proceso hijo y
  NO borra la app generada (ya existía código bueno al llegar aquí).
- WHEN todo termina, THEN el desenlace muestra un informe accionable: huecos rellenos /
  rechazados / pendientes, comprobaciones pasadas/falladas y, si quedó rojo, la salida del
  fallo y a quién pertenece (hueco IA vs. canon).

## Criterios de aceptación

- [ ] La obra muestra 6 filas de fase: preparar, escribir, instalar, pasos de negocio (IA),
      validar, reparar — las nuevas con estados pending/running/done/skipped/failed.
- [ ] El relleno corre integrado tras install (mismo comportamiento que el botón de la spec 45,
      que se conserva para re-ejecuciones manuales).
- [ ] La validación ejecuta `npm run typecheck`, `npm test` y `npm run test:front` de la app
      emitida y emite progreso por comprobación (NDJSON).
- [ ] La reparación solo escribe dentro de huecos `@ai:*` (frontera `validateSlotOnlyEdit`
      intacta) y respeta el presupuesto: 2 propuestas por hueco en el relleno + 1 ciclo de
      reparación global + 1 re-validación.
- [ ] Un fallo canónico produce informe, nunca parche.
- [ ] Cancelar durante las fases nuevas no borra la app.
- [ ] Suite del estudio verde + `npm run web:build` verde (gate anti-NG8002).

## Referencias del proyecto

- `.claude/specs/42-generacion-con-pasos-visibles/` — catálogo de fases y reductor.
- `.claude/specs/45-relleno-en-la-obra/` — streaming del relleno y traductor `fill-progress.ts`.
- `tools/typecheck-emitted.sh` — la referencia de qué valida una app emitida (~2 min).
- `libs/generators/src/generators/fill-flow-slots/` — executor puente + gate por hueco.

## Reglas de negocio aplicables

- La IA solo entra bajo gate determinista (ADR; `fill-flow-slots.ts` ya lanza sin gate).
- Un fallo del determinista se arregla en el generador (test rojo + golden), nunca a mano.
- La integración (`test:integration`) queda fuera del gate: exige base de datos.

## Decisiones que la idea 37 dejaba abiertas (resueltas aquí)

- **Presupuesto de reintentos**: 2 propuestas por hueco dentro del relleno (la 2ª con el motivo
  del rechazo) + 1 ciclo de reparación global tras la validación + 1 re-validación. Sin bucles.
- **Qué corre el gate de validación**: la suite de la propia app emitida (`typecheck`, jest
  unit, vitest), no la suite completa con integración. Es lo que cabe en la obra sin Docker.

## Fuera de scope (deliberado)

- Arranque real de la app como parte de la validación (la idea 16 lo menciona «si procede»;
  exige Docker/BD y puertos — queda para una spec de smoke).
- Reparar código canónico o huecos no-flow (`domain-extra`, `list-extra`…).
- Corpus de conocimiento para los prompts (idea 39).
- Paralelizar comprobaciones o huecos.
