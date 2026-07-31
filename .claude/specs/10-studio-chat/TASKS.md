# Tareas atómicas: studio-chat

> Cada tarea = un commit. TDD en fake adapter, gate y applyExternal; SDK mockeado para Anthropic.

- [x] TASK-01: backend — `ChatPort` + `FakeChatAdapter` + gate de validación del controller
      (`defineApp`+`composeApp`) + módulo montado en la API. TDD (jest unit del studio).
- [x] TASK-02: backend — `AnthropicChatAdapter` (SDK TS, structured outputs, refusal) con SDK
      mockeado en tests; selección de adapter por entorno.
- [x] TASK-03: frontend — `applyExternal` en AppStore (TDD vitest) + servicio + panel de chat
      en `/studio`; build verde.
- [x] TASK-04: smoke Playwright en modo fake (añadir/quitar por chat → lienzo y schema JSON
      reflejan el cambio) + cierre de spec (ROADMAP, visión).
