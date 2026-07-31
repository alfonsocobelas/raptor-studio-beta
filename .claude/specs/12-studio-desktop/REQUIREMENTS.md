# Spec: studio-local-generate (Fase F del editor visual — decisión 2026-07-31)

## Contexto de negocio

Cierre de la visión (`docs/vision-editor-visual-schema.md`). **Decisión de Alfonso
(2026-07-31): opción 1 — generación in situ vía backend local, sin empaquetar app de
escritorio; Electron queda como comparativa opcional si da tiempo.** El navegador no puede
ejecutar el generador; el backend Nest local del estudio sí. Al pulsar «Generar aquí», el
backend ejecuta `nx g @acc/generators:app … --appFile=…` sobre el workspace del acelerador y
devuelve el log — el usuario diseña y genera sin tocar la terminal.

## User stories (formato EARS)

- WHEN pulso «Generar aquí» en el wizard THEN el backend local escribe el app-schema a un
  fichero temporal, ejecuta el generador con las opciones elegidas y veo el log y la ruta.
- IF el nombre no es kebab-case o las opciones no son las del generador THEN el backend
  rechaza la petición antes de ejecutar nada.
- IF el generador falla THEN veo su salida de error en el wizard.
- WHEN arranco `npm run studio:api` THEN tengo el backend del estudio (chat + generate) SIN
  necesitar Postgres — los CRUD de demo no son un requisito del estudio.
- WHILE la generación está en curso THEN el botón queda deshabilitado con indicador.

## Criterios de aceptación

- [ ] `buildGeneratorArgs` puro (validación kebab/enums + argv sin shell). TDD.
- [ ] `POST /api/v1/studio/generate` con gate (validateProposal) y ejecución `execFile`
      (sin shell) con `cwd = ACELERADOR_ROOT` (env, default `../..`).
- [ ] `apps/studio-api`: bootstrap ligero con StudioChatModule + StudioGenerateModule,
      sin TypeORM. Script `npm run studio:api`.
- [ ] Wizard: botón «Generar aquí» + área de log; convive con descarga + comando.
- [ ] Verificación end-to-end real: estudio servido + studio-api corriendo + generación
      (skipInstall, directorio temporal) con nav.ts emitido correcto.

## Reglas de negocio aplicables

- El generador sigue siendo la única puerta de emisión; el backend solo lo invoca.
- Entrada externa validada en el borde (nombre, enums, schema por el gate); `execFile` con
  argv separados, nunca shell interpolado.

## Fuera de scope (deliberado)

- Empaquetado Electron/Tauri — comparativa opcional al final si da tiempo (Electron ya está
  como devDependency del estudio para esa prueba).
- Cola/concurrencia de generaciones (una a la vez basta).
- Streaming del log (se devuelve completo al terminar).
