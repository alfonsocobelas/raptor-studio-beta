# Spec: El relleno llama a la puerta de la obra

> Decisión «opción b» (2026-08-15, cierre del debate de la spec 43): los huecos `@ai` que
> queden tras generar se rellenan como FASE VISIBLE de la pantalla de obra, no con un
> comando aparte que hay que conocer. La fontanería existe entera (fill-flow-slots +
> puente + gate, spec 39); esta spec es la puerta.

## Contexto de negocio

Hoy «Generar aplicación» entrega una app con los pasos de negocio no convergidos como
huecos `@ai` vacíos, y rellenarlos exige saber que existe `fill-flow-slots` y correrlo a
mano. Fontanería expuesta. Tras la spec 44 los huecos son MENOS (los pasos con transición
ya salen con cuerpo real): los que quedan son exactamente los que necesitan IA, y la obra
debe contarlos y ofrecer rellenarlos — bajo el mismo puente y el mismo gate de siempre.

## User stories (formato EARS)

- WHEN la generación termina bien THEN el `done` cuenta los huecos `flow-*` pendientes y el
  desenlace los enseña («N pasos de negocio por rellenar», con sus nombres)
- WHEN el usuario pulsa «Rellenar con IA» THEN el backend corre el relleno sobre la app
  emitida vía puente (`tmp/studio-bridge`) y la pantalla va contando cada hueco:
  proponiendo → aceptado / rechazado (con su motivo)
- IF no hay sesión respondiendo al puente THEN el hueco caduca con su motivo y la app
  queda EXACTAMENTE como estaba (el generador ya lo garantiza: nunca código rojo)
- IF la app estaba roja ANTES de rellenar THEN se reporta la línea base y no se intenta
  nada (comportamiento existente del generador, asomado a la pantalla)
- WHILE se rellena THEN el botón queda deshabilitado y el desenlace no se pierde
- IF la generación no dejó huecos THEN la sección ni aparece

## Criterios de aceptación

- [ ] El `done` de generar viaja con los huecos pendientes y el desenlace los lista
- [ ] El endpoint de relleno emite NDJSON por hueco y termina con el informe
- [ ] La pantalla pinta el estado por hueco y el motivo de los rechazos
- [ ] Suite completa + `web:build`; en vivo si hay sesión puente disponible

## Referencias

- `libs/generators/src/generators/fill-flow-slots/` (spec 39 TASK-12/13): generador, puente
  y gate — NO se tocan; esta spec solo los invoca
- Memoria «puente-del-chat-del-estudio»: el adapter de IA es una sesión de Claude Code

## Fuera de scope (deliberado)

- Rellenar huecos que no sean `flow-*` (p. ej. `domain-extra`): mismo mecanismo el día
  que se pida (regla de los dos)
- Editar/aprobar el cuerpo propuesto desde el estudio: el gate determinista decide
- Ejecutores que no sean el puente (SDK embebido prohibido por ADR)
