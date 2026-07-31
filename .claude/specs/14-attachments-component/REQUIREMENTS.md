# Spec: attachments-component (componente de subida de ficheros)

## Contexto

Petición de Alfonso (2026-07-31): las vistas no pueden ser solo "una tabla" — ej.: un
componente drag&drop de subida de ficheros EN la misma vista. Regla del estudio: el lienzo
solo dibuja lo que el generador emite → el vocabulario crece primero en generador/schema y
el lienzo lo hereda. Media pieza existe: FileStoragePort + 3 adapters en libs/infra; la
referencia (QBR evidence upload) da el canon de la UI y el endpoint.

## User stories (EARS)

- WHEN marco «Ficheros» en una entidad (barra 🗎 arrastrada a su vista, inspector o chat
  «con ficheros adjuntos») THEN la vista del mockup muestra la dropzone drag&drop con
  adjuntos de ejemplo bajo la tabla.
- WHEN genero la app THEN esa entidad trae adjuntos reales: dropzone en su pantalla,
  endpoints upload/download/delete sobre FileStoragePort (adapter local por defecto,
  intercambiable por los del catálogo).
- IF la entidad no marca attachments THEN nada de esto se emite (opt-in por entidad).

## Criterios de aceptación

- [ ] `attachments?: true` en ResourceDefinition (+DraftResource) y validación.
- [ ] Lienzo: dropzone mockup + toolbar 🗎 (clic y drag&drop) + inspector + chat (fake y
      Anthropic) con el nuevo vocabulario. **Checkpoint visual con Alfonso.**
- [ ] Generador backend: módulo de adjuntos por recurso (upload/download/delete, port +
      adapter fs local) emitido solo con attachments.
- [ ] Generador frontend: componente de adjuntos en la pantalla del recurso + servicio.
- [ ] Fixture de oro con un modelo con attachments; gate limpio.
- [ ] E2E: diseño con ficheros → app generada con la pieza.

## Fuera de scope

- Selector de adapter de storage en el wizard (config del emitido: fs local; swap manual).
- Previsualización de imágenes, versionado, permisos por fichero.
