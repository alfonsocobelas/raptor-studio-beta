---
name: session-start
author: Alfonso Cobelas <alfonso.cobelas@gmail.com>
description: >
  Use at the beginning of every new session, when the user says "hola", "empezamos",
  "continuamos", "qué tarea toca", "next task", or when starting any new conversation
  about this project. Use also when the user asks "what's the status" or "qué tenemos pendiente".
---

# Protocolo de inicio de sesión

Esta skill se activa al inicio de cualquier sesión nueva o cuando el usuario indica que retomamos trabajo.

## Pasos obligatorios

1. **Confirma que has leído los ficheros base**:
   - `.claude/CLAUDE.md`
   - `.claude/steering/product.md`
   - `.claude/steering/tech.md`
   - `.claude/steering/structure.md`

2. **Identifica la spec activa** en `.claude/specs/`:
   - Lista los directorios en `.claude/specs/`
   - Para cada spec, lee su `TASKS.md` y comprueba si tiene tareas sin completar (`- [ ]`)
   - La spec activa es la primera (por orden numérico) que tenga tareas pendientes

3. **Identifica la siguiente tarea atómica**:
   - Localiza el primer `- [ ] TASK-XX:` en el `TASKS.md` de la spec activa
   - Lee también el `DESIGN.md` y `REQUIREMENTS.md` de esa spec para tener el contexto técnico

4. **Reporta al usuario en este formato exacto**:

   ```
   📋 Sesión iniciada — Acelerador

   Spec activa: {nombre-spec}
   Spec totalmente terminada hasta: TASK-{último completado}
   Siguiente tarea: TASK-{XX} — {descripción corta}

   ¿Confirmas que empiezo con TASK-{XX}?
   ```

5. **NO hagas nada más** hasta que el usuario confirme. No abras ficheros del código, no propongas implementación. Solo espera.

## Casos especiales

- **No hay specs en `.claude/specs/`**: indica al usuario que aún no hay specs y propón ejecutar `/spec-new` para crear la primera.
- **Todas las specs están terminadas**: consulta `.claude/specs/ROADMAP.md` y propón la siguiente spec del mapa.
- **El usuario salta esto y pide algo concreto**: respétalo. Esta skill no es una jaula — es solo el comportamiento por defecto.
