---
description: Muestra el estado de todas las specs y la tarea activa actual
author: Alfonso Cobelas <alfonso.cobelas@gmail.com>
allowed-tools: Read, Glob, Bash(ls:*)
---

# /spec-status — Estado del proyecto

Muestra un resumen del estado de todas las specs.

## Pasos

1. **Lista** todos los directorios en `.claude/specs/`.

2. **Para cada spec**:
   - Lee su `TASKS.md`.
   - Cuenta tareas totales, completadas (`- [x]`) y pendientes (`- [ ]`).
   - Identifica la primera tarea pendiente.

3. **Reporta** en este formato:

```
📊 Estado del proyecto — Acelerador

┌─────────────────────────────────────────────────────────────┐
│ Spec                  │ Progreso     │ Siguiente tarea       │
├─────────────────────────────────────────────────────────────┤
│ 01-customers          │ 8/15 (53%)   │ TASK-09: ...          │
│ 02-contracts          │ 0/12 (0%)    │ TASK-01: ...          │
│ 03-licenses           │ — esqueleto  │ Sin tareas todavía    │
└─────────────────────────────────────────────────────────────┘

▶ Spec activa: 01-customers
▶ Tarea actual: TASK-09 — {descripción}
```

4. **Si no hay specs**, indícalo y propón ejecutar `/spec-new` para crear la primera.

5. **No hagas nada más**. Esto es solo un informe de estado.
