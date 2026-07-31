# Diseño técnico: studio-generate-wizard

## Parte 1 — generador: opción `appFile`

```
--appFile=cliente.app.json ──readFileSync + JSON.parse──> defineApp() ──> composeApp(MODELS)
                                                              │ inválido → error, no se emite nada
                                                              ▼
                                              AppComposition (mismo camino que --app)
```

- `AppGeneratorSchema.appFile?: string` + entrada en `schema.json`.
- Conflictos: `appFile` × (`app` | `models` | `dashboard` explícito) → error.
- `loadAppFile(path)`: lee, parsea y valida con `defineApp` (errores agregados legibles).
- Equivalencia: un JSON con el contenido de `boutique` emite byte a byte lo mismo que `--app=boutique`.

## Parte 2 — estudio: wizard de generación

```
[Generar aplicación] → diálogo:
  nombre (kebab) · ui (spartan|material) · database (postgres|mongo)
  plugins (auth, email, observability — checkboxes) · dashboard implícito en el schema
       │ confirmar
       ▼
  descarga <name>.app.json  (definición viva del store, name ← nombre elegido)
  comando: npx nx g @acc/generators:app <name> --appFile=<name>.app.json \
           --ui=<ui> --database=<db> --plugins=<lista|none>   [copiar]
```

- `generate-wizard.component.ts` en `domains/studio/generate/` (formulario plano con signals,
  sin Spartan directo — HTML + clases, como el resto del estudio).
- `wizard-command.ts` puro: `buildCommand(options)` y `buildAppFile(definition, name)` — TDD.
- Descarga con `downloadBlob` del kernel emitido (`shared/utils/download-file`).
- Las opciones del wizard se declaran en un único const `GENERATOR_OPTIONS` alineado con
  `schema.json` del generador (comentario cruzado en ambos lados).

## Decisiones técnicas

- **Fichero + comando, no ejecución remota**: mantiene el estudio 100 % cliente en esta fase y
  el generador sigue siendo la única puerta de emisión (determinista, auditable). La ejecución
  in situ llega con la fase F (backend local).
- **El `name` del schema se reescribe al del wizard**: el lienzo trabaja sobre `boutique` como
  base; el artefacto descargado es la app del cliente.

## Riesgos identificados

- Deriva wizard ↔ opciones reales del generador → const único + smoke que compara con schema.json
  (test en generators que asegura que las opciones del wizard existen). Mitigación mínima:
  comentario cruzado; el gate real es que el comando falla si la opción no existe.
