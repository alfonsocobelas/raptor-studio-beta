---
description: Identifica y propone la siguiente tarea atómica de la spec activa
author: Alfonso Cobelas <alfonso.cobelas@gmail.com>
allowed-tools: Read, Glob
---

# /task-next — Siguiente tarea

Identifica la siguiente tarea atómica pendiente.

## Pasos

1. **Localiza la spec activa**: el directorio en `.claude/specs/` con tareas sin completar y menor número correlativo.

2. **Lee los tres ficheros de esa spec** (`REQUIREMENTS.md`, `DESIGN.md`, `TASKS.md`).

3. **Identifica la primera tarea pendiente** (`- [ ] TASK-XX:`).

4. **Reporta**:

```
📋 Siguiente tarea — Spec: {nombre}

TASK-{XX}: {descripción}

Contexto de la spec:
- Pantalla/módulo: {extraído de REQUIREMENTS}
- Capa: {backend / frontend / shared / mixto}
- Componentes técnicos: {extraído de DESIGN}

Tareas previas completadas: TASK-01 a TASK-{XX-1}
Tareas restantes después de esta: {Y} tareas

⚠️ Recordatorio: TDD estricto. Test primero, código después. Commit atómico al terminar.

¿Empezamos con TASK-{XX}? (sí / explícame más / saltar a otra)
```

5. **NO empieces a implementar**. Espera la confirmación del usuario.

6. **Casos especiales**:
   - Todas las tareas completas: felicita al usuario y propón cerrar la spec.
   - No hay specs: propón `/spec-new`.
   - La tarea no está clara: revísala con el usuario antes de empezar.
