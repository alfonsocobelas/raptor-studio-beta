# Diseño técnico: studio-chat

## Flujo

```
ChatPanel ──POST /api/v1/studio/chat {messages, schema}──> StudioChatController
                                                                 │
                                                          ChatPort.propose()
                                                          ├─ AnthropicChatAdapter
                                                          │    claude-opus-5 · SDK TS
                                                          │    output_config.format=json_schema
                                                          │    (reply + AppDefinition)
                                                          └─ FakeChatAdapter (sin clave)
                                                                 │
                                          gate servidor: defineApp + composeApp(MODELS)
                                                                 │ inválido → 422 con motivo
                                                                 ▼
ChatPanel <──{reply, schema}── lienzo: store.applyExternal(schema)  (gate otra vez, cliente)
```

## Backend (workspace studio, `libs/backend/src/contexts/studio/chat/`)

- `chat.types.ts` — `ChatMessage {role: 'user'|'assistant', text}`, `ChatProposal {reply, schema}`.
- `chat.port.ts` — `ChatPort { propose(messages, currentSchema): Promise<ChatProposal> }`.
- `anthropic-chat.adapter.ts` — SDK oficial (`@anthropic-ai/sdk`):
  - `client.messages.create({ model: 'claude-opus-5', max_tokens: 16000, system, messages, output_config: { format: { type: 'json_schema', schema: RESPONSE_SCHEMA } } })`
  - System prompt: rol + catálogo real (nombre/labels de `MODELS`) + vocabulario del app-schema
    + regla "solo recursos del catálogo".
  - `RESPONSE_SCHEMA`: `{reply: string, schema: <JSON Schema de AppDefinition>}`, todo con
    `additionalProperties: false` (requisito de structured outputs).
  - `stop_reason === 'refusal'` → error controlado. Sin sampling params (Opus 5 los rechaza).
- `fake-chat.adapter.ts` — determinista: entiende "añade/quita página|kpi <recurso>" contra el
  catálogo; si no entiende, devuelve el schema intacto con un reply explicativo.
- `studio-chat.module.ts` — provider de `ChatPort` por factoría: `process.env['ANTHROPIC_API_KEY']`
  presente → Anthropic; ausente → fake (y `mode: 'fake'` en la respuesta para la UI).
- Controller: valida la propuesta con `defineApp` + `composeApp(schema, MODELS)` antes de
  responder; si no valida → 422 {message}.

## Frontend (workspace studio, `domains/studio/chat/`)

- `studio-chat.service.ts` — HttpClient POST; signals de estado (pending, error, mode).
- `chat-panel.component.ts` — historial, input, indicador demo/fake; al recibir schema llama
  `store.applyExternal(schema)`.
- `AppStore.applyExternal(def)` — valida con `defineApp` + `composeApp(def, MODELS)` y sustituye
  la definición (mismo try/catch que `apply`).
- El panel se integra en `/studio` (columna del lienzo, bajo el header).

## Decisiones técnicas

- **Structured outputs en vez de parsear prosa**: la API garantiza JSON conforme al schema;
  el gate sigue siendo la última palabra (doble cinturón).
- **Schema completo, no mutaciones**: la IA devuelve el `AppDefinition` entero — más simple de
  validar y de aplicar (mismo camino que `applyExternal`), y evita un mini-lenguaje de parches.
- **La clave nunca sale del servidor**; el fake permite desarrollar y demostrar sin red.
- **Historial corto en cliente** (se reenvía entero): el estado conversacional no se persiste
  en el backend (stateless, como la Messages API).

## Riesgos identificados

- Deriva del catálogo en el prompt → el system prompt se construye desde `MODELS` en runtime,
  nunca a mano.
- Coste/latencia de Opus 5 → respuestas cortas (reply breve + JSON pequeño), `max_tokens` 16000.
- Sin clave en CI → todos los tests corren contra el fake; el adapter Anthropic se testea con
  el SDK mockeado.
