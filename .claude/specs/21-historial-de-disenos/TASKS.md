# 21 — Historial de diseños · TASKS

> Cada tarea = un commit atómico en develop. TDD: test rojo primero.
> No se toca `libs/generators/` → sin gate de oro.

- [x] TASK-01 — `design-files.ts`: slug saneado, lista con metadatos, lectura con
      error limpio (corrupto no se borra), escritura atómica y borrado (TDD
      sobre un directorio temporal)
- [x] TASK-02 — `studio-designs.controller.ts` + module + registro en el
      studio-api: GET lista / GET uno / PUT con `validateDesign` / DELETE;
      400 en slug inválido o diseño que no pasa el gate (TDD)
- [x] TASK-03 — `design-history.service.ts`: autosave con reposo (una escritura
      por ráfaga), restauración al arrancar vía `applyExternal`, cambio de
      diseño con guardado previo, activo en localStorage (TDD)
- [x] TASK-04 — selector de diseños en la cabecera del lienzo: listar, crear,
      renombrar (PUT+DELETE), borrar, indicador de guardado que se apaga solo
- [x] TASK-05 — e2e en navegador: dibujar → recargar → restaurado idéntico
      (captura); cierre docs y desbloqueo de la verificación 22-T07
      · e2e real (e2e-17-guardado.png, e2e-18-restaurado.png): dos vistas + flujo,
        el punto pasa a «saved» solo, y tras recargar vuelven vistas, entidades,
        flujo y el selector lista el diseño con su activo marcado
      · el fichero vive en `.studio/designs/<slug>.json` (versionable por git,
        como fija REQUIREMENTS); el artefacto del e2e se limpió tras verificar
