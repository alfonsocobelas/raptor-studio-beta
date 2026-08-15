# Tareas atómicas: El relleno llama a la puerta de la obra

> Cada tarea = un commit atómico en develop (mandos delegados 2026-08-15).

- [x] **TASK-01**: Tests + el `done` de `POST /studio/generate/stream` cuenta los huecos
      `flow-*` pendientes de la app emitida (`slots: ['flow-x', …]`). Aditivo.

- [ ] **TASK-02**: Tests + `POST /studio/fill-slots/stream` (NDJSON): por hueco
      `{type:'slot', id, status: proposing|filled|rejected, reason?}` y cierre
      `{type:'done', filled, rejected, pending, baseline?}`. Ejecutor puente + gate reales;
      en tests, ejecutor/gate falsos inyectados.

- [ ] **TASK-03**: Tests + la obra: el desenlace lista los huecos, botón «Rellenar con IA»
      que consume el stream y pinta el estado por hueco; deshabilitado mientras corre;
      sin huecos no hay sección. `npm run web:build`.

- [ ] **TASK-04**: Suite completa + `web:build` + prueba en vivo con el puente (una sesión
      respondiendo `tmp/studio-bridge`) o constancia explícita de que quedó pendiente.
