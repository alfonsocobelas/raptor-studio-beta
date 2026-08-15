# Spec: studio-viewer (Fase B del editor visual)

## Contexto de negocio

Segunda fase de `docs/vision-editor-visual-schema.md`: un **visor read-only** que renderiza un
app-schema con los componentes reales que emite el generador (WYSIWYG de verdad). Es la primera
pieza con UI del estudio. Sin edición, sin chat, sin drag&drop (fases C-D). El estudio se
scaffolda con el propio generador de app (dogfooding de `--app`, fase A) y las features del
visor se escriben a mano encima — exactamente el flujo que el acelerador propone a sus usuarios.

## User stories (formato EARS)

- WHEN abro el estudio THEN veo el lienzo de preview del app-schema activo (demo): menú lateral
  con sus páginas y el contenido de la página seleccionada.
- WHEN la página es un dashboard THEN se renderizan sus tarjetas KPI (componentes reales) con
  totales de muestra deterministas.
- WHEN la página es un recurso THEN se renderiza su tabla con las columnas declaradas en el
  resource-schema (`table.show`, labels, orden) y filas de muestra deterministas derivadas de
  los tipos de campo.
- IF el app-schema referencia un recurso sin columnas visibles THEN la tabla muestra un estado
  vacío razonable (sin crashear).
- WHILE el visor está abierto THEN no hay ninguna llamada de red: todo es cliente, datos de
  muestra en memoria.

## Criterios de aceptación

- [ ] `apps/studio` existe, scaffoldado con `@raptor/generators:app --app=demo` (baseline commiteada tal cual).
- [ ] Ruta `/studio` con el visor: nav de páginas + render por tipo de página.
- [ ] Los datos de muestra se derivan del schema de forma determinista (misma entrada → mismas filas).
- [ ] El visor importa el contrato desde `@raptor/schema` (dist local); nada de tipos duplicados.
- [ ] Tests del view-model (muestras + selección de página) verdes en el workspace del estudio.
- [ ] El monorepo raíz sigue verde (suite + golden-diff sin cambios).

## Referencias del proyecto de referencia

- Componentes emitidos: DataTable y KPI card del kernel frontend del generador
  (`libs/generators/src/generators/frontend-kernel/`, `app/files-dashboard/`).
- Demo comparable: `apps/boutique` (workspace generado y commiteado).
- Documento: `docs/vision-editor-visual-schema.md` §4 fase B.

## Reglas de negocio aplicables

- Lienzo schema-driven: el visor deriva TODO del schema; prohibido estado de diseño propio.
- Regla 7: el vocabulario visual es el del generador; nada de widgets que no se emitan.
- El estudio es una app generada + código a mano: no se regenera encima (se editaría a mano,
  como cualquier app de cliente).

## Fuera de scope (deliberado)

- Edición (borrar, drag&drop) — fase C.
- Chat IA — fase D.
- Selector de app / carga dinámica de schemas — el visor abre `demo` (hardcodeado en fase B).
- Refactor de registros a una lib compartida — deuda anotada; se hará cuando la fase C lo exija
  (regla de los dos).
