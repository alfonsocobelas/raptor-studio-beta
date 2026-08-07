# Tareas atómicas: attachments-component

- [x] TASK-01: schema — attachments en ResourceDefinition/DraftResource + store/draftToResource. TDD.
- [x] TASK-02: lienzo — dropzone mockup + toolbar 🗎 + inspector + chat v2.1. Screenshot → OK Alfonso.
- [x] TASK-03: generador backend — plantillas de adjuntos (canon referencia QBR). TDD + golden.
- [x] TASK-04: generador frontend — componente + servicio emitidos. Golden.
- [x] TASK-05: fixture de oro attachments + e2e diseño→app. Cierre docs.
      · la fixture de oro CON adjuntos la hizo la spec 25 (TASK-04/05: `attachments: true` en
        `project.model.ts` + re-baseline de las dos fixturas de app), incluida la subida real (25-T06)
      · e2e diseño→app (2026-08-07): estudio con bloque «Ficheros» → dropzone en el mockup
        (`e2e-14-ficheros-lienzo.png`) → schema exportado con `attachments: true` → el generador
        con ese app.json emite los VOs compartidos, la entidad+controller+service de adjuntos,
        el componente frontend y el test emitido (verificado con `--dry-run` sobre el JSON real)
