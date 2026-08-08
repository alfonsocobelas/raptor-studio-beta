# 21 — Historial de diseños · TASKS

> Cada tarea = un commit atómico en develop. TDD: test rojo primero.
> No se toca `libs/generators/` → sin gate de oro.

- [ ] TASK-01 — `design-files.ts`: slug saneado, lista con metadatos, lectura con
      error limpio (corrupto no se borra), escritura atómica y borrado (TDD
      sobre un directorio temporal)
- [ ] TASK-02 — `studio-designs.controller.ts` + module + registro en el
      studio-api: GET lista / GET uno / PUT con `validateDesign` / DELETE;
      400 en slug inválido o diseño que no pasa el gate (TDD)
- [ ] TASK-03 — `design-history.service.ts`: autosave con reposo (una escritura
      por ráfaga), restauración al arrancar vía `applyExternal`, cambio de
      diseño con guardado previo, activo en localStorage (TDD)
- [ ] TASK-04 — selector de diseños en la cabecera del lienzo: listar, crear,
      renombrar (PUT+DELETE), borrar, indicador de guardado que se apaga solo
- [ ] TASK-05 — e2e en navegador: dibujar → recargar → restaurado idéntico
      (captura); cierre docs y desbloqueo de la verificación 22-T07
