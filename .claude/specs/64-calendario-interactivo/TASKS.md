# Tareas atómicas: Calendario interactivo

> Cada tarea = un commit en `develop`. TDD estricto (test del generador en rojo antes de
> tocar plantilla); gate de oro antes de cada commit que toque plantillas.

- [x] **TASK-01**: Test + input opcional `initialValue` en la plantilla del diálogo
      (`__fileName__-dialog.component.ts.template`): patch del alta cuando no hay entidad.
- [ ] **TASK-02**: Test + gesto de alta en la plantilla del calendario: botón «+» por celda
      (mes/semana) y botón en vista día, diálogo con la fecha precargada, `onSave` con
      create/update + toasts. Condicionado a `features.edit` y `entry.canCreateExpr`.
- [ ] **TASK-03**: Test + edición desde la tira sin `detail`: clic abre el diálogo de
      edición (guardia `entry.canEditExpr`); con `detail` se conserva la navegación.
- [ ] **TASK-04**: Re-baseline del oro (commit propio) tras revisar que el diff es SOLO
      calendario + diálogo.
- [ ] **TASK-05**: Regenerar la demo veterinaria y verificar: typecheck verde + alta de
      cita desde el calendario + apertura de tira (humo con navegador si el entorno lo da).
