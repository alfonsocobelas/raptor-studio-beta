# Spec: app-page-schema (Fase A del editor visual)

## Contexto de negocio

Primera fase de la visión del editor visual (`docs/vision-editor-visual-schema.md`): para que un
lienzo (o un chat IA) pueda editar "la aplicación" y no solo recursos sueltos, necesita un
**vocabulario declarativo de composición**: qué páginas tiene la app, en qué orden, con qué
widgets. Hoy esa composición vive en opciones planas del generador de app (`models`, `dashboard`)
y en reglas implícitas (nav = un item por recurso en orden de registro; dashboard = un KPI por
recurso). Esta spec la hace explícita como **app-schema** (`defineApp`) y hace que el generador
de app la consuma. Sin UI: es trabajo puro de schema + generador, útil por sí solo.

## User stories (formato EARS)

- WHEN se define un app-schema con `defineApp` THEN se valida estructuralmente (nombre kebab-case,
  ≥1 página, como máximo un dashboard, widgets no vacíos, sin páginas de recurso duplicadas) y los
  errores se agregan en `SchemaValidationError`, igual que `defineResource`.
- WHEN el generador de app recibe `--app=<nombre>` THEN deriva modelos incluidos, dashboard,
  orden de navegación, labels y ruta por defecto del app-schema registrado.
- IF una página o widget referencia un recurso que no está en el registro de modelos THEN el
  generador falla antes de emitir ficheros, listando los modelos disponibles.
- IF se pasan a la vez `--app` y opciones planas de composición (`models` o `dashboard`) THEN el
  generador falla (dos fuentes de verdad en conflicto).
- WHEN un app-schema es equivalente a las opciones planas actuales (dashboard + recursos en orden
  de registro) THEN el código emitido es idéntico byte a byte (gate de equivalencia).

## Criterios de aceptación

- [ ] `defineApp` existe en `libs/schema`, exportado, con validación agregada y objeto congelado.
- [ ] Registro estático de apps en el plugin (mismo patrón que `MODELS`) con `selectApp(name)`.
- [ ] `nx g @raptor/generators:app <n> --app=<app>` genera derivando todo del app-schema.
- [ ] Test de equivalencia: app-schema canónico ≡ opciones planas → mismo árbol emitido.
- [ ] El orden de páginas del app-schema gobierna nav y rutas (no el orden del registro).
- [ ] Suite verde + golden-diff limpio antes de cada commit que toque el generador.

## Referencias del proyecto de referencia

- Plantillas afectadas: `libs/generators/src/generators/app/files/apps/frontend-app/src/{nav,app.routes}.ts.template`
- Patrón de registro: `libs/generators/src/generators/resource/models/registry.ts`
- Documento de diseño: `docs/vision-editor-visual-schema.md` §3 (prerrequisito), §4 (fase A)

## Reglas de negocio aplicables

- Regla 7 (generar, no interpretar): el app-schema solo vocabulariza lo que el generador YA emite
  (páginas de recurso + dashboard de KPIs). Nada de layout libre ni widgets especulativos.
- Regla 8: plantillas tontas — la normalización de páginas se calcula en `generator.ts`.
- `libs/schema` sigue siendo TypeScript puro, sin dependencias de frameworks ni tooling.

## Fuera de scope (deliberado)

- Widgets nuevos (charts, tablas embebidas, tarjetas libres) — se añaden cuando el generador los emita.
- Layout (grid, columnas, secciones) — YAGNI hasta la fase B/C.
- UI del editor (lienzo, chat) — fases B–D de la visión.
- Cargar apps desde ficheros del workspace (el registro estático es el patrón vigente, bundle-safe).
- Retirar las opciones planas `models`/`dashboard` (siguen siendo el camino sin app-schema).
