# Spec: studio-chat (Fase D del editor visual)

## Contexto de negocio

Cuarta fase de `docs/vision-editor-visual-schema.md`: un **chat con IA** en el estudio donde el
usuario describe la aplicación ("añade una página de ventas", "quita el dashboard") y la IA
devuelve el **app-schema completo** propuesto — nunca código. Es la fase "① pre-generación"
de `docs/integracion-ia-generador.md` con interfaz: la salida de la IA es pequeña, estructurada
y revisable, y pasa por el gate determinista antes de tocar el lienzo. Se confía en el gate,
no en la IA.

## User stories (formato EARS)

- WHEN escribo una petición en el chat THEN la IA responde con un texto breve y un app-schema
  propuesto, y el lienzo se actualiza solo si el schema pasa el gate (`defineApp` +
  `composeApp` contra el catálogo).
- IF el schema propuesto no valida THEN el lienzo no cambia y el chat muestra el motivo.
- IF no hay `ANTHROPIC_API_KEY` en el backend THEN el chat funciona en modo demo con un
  adapter fake determinista (mismo contrato), y lo indica en la UI.
- WHILE la petición está en vuelo THEN el input queda deshabilitado y hay indicador de carga.
- IF la API rechaza la petición (refusal/errores) THEN se muestra un error claro; el lienzo
  no cambia.

## Criterios de aceptación

- [ ] Endpoint `POST /api/v1/studio/chat` en el backend del estudio: entrada {messages, schema
      actual}, salida {reply, schema}. La clave API vive solo en el servidor.
- [ ] `ChatPort` con dos adapters: `AnthropicChatAdapter` (SDK oficial TS, `claude-opus-5`,
      structured outputs con JSON Schema del app-schema, manejo de `stop_reason: refusal`) y
      `FakeChatAdapter` (determinista, sin red).
- [ ] Selección de adapter por entorno: clave presente → Anthropic; ausente → fake.
- [ ] Frontend: panel de chat en `/studio` (servicio + componente), aplica el schema vía el
      gate del AppStore (`applyExternal`).
- [ ] Tests: unit del fake y del mapeo del adapter (SDK mockeado), unit del gate applyExternal,
      smoke Playwright end-to-end en modo fake.

## Referencias del proyecto de referencia

- `docs/integracion-ia-generador.md` §1-2 (gate determinista, IA escribe el MODELO).
- Skill `claude-api` (cargada): structured outputs `output_config.format`, modelo
  `claude-opus-5`, sin sampling params, refusal en Opus 5.

## Reglas de negocio aplicables

- La IA propone; el gate decide. Nada entra al lienzo sin validar.
- El system prompt describe el catálogo REAL (modelos registrados + vocabulario de páginas);
  la IA no puede inventar recursos (el gate rechazaría, y el prompt lo previene).
- Sin secretos en el navegador ni en commits.

## Fuera de scope (deliberado)

- Diffs visuales de la propuesta (aplicar/descartar granular) — se aplica entera o nada.
- Streaming de la respuesta — respuesta corta, no lo necesita aún.
- Editar resource-schemas por chat (campos/columnas) — siguiente iteración del catálogo.
- `fallbacks` server-side de Opus 5 — sin entorno para verificar la beta end-to-end; el
  refusal se maneja como error visible. Anotado como mejora.
