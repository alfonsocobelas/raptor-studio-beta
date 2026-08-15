# Spec: studio-generate-wizard (Fase E del editor visual)

## Contexto de negocio

Quinta fase de `docs/vision-editor-visual-schema.md`: al terminar el diseño, el usuario elige
los **plugins e infraestructura** (motor de BD, librería de componentes, auth/email/observability)
y obtiene la aplicación. Hoy el generador de app solo consume app-schemas registrados en `APPS`;
el estudio produce schemas nuevos — falta el puente: una opción `--appFile` que lea el
app-schema desde un JSON (mismo gate). El wizard del estudio recoge las opciones (las que el
generador YA expone, regla 7), descarga el `<name>.app.json` diseñado y muestra el comando
exacto de generación. La invocación directa del generador desde el estudio queda para la fase F.

## User stories (formato EARS)

- WHEN ejecuto `nx g @raptor/generators:app x --appFile=ruta.json` THEN el generador carga el
  app-schema del fichero, lo valida (defineApp + catálogo) y genera exactamente igual que con
  `--app` (equivalencia byte a byte con un fichero equivalente a `boutique`).
- IF el fichero no existe o el JSON no valida THEN el generador falla antes de emitir nada.
- IF se combinan `--appFile` con `--app`/`models`/`dashboard` THEN error (fuentes en conflicto).
- WHEN pulso «Generar aplicación» en el estudio THEN un asistente me pide nombre, librería de
  componentes (spartan/material), motor (postgres/mongo) y plugins (auth, email, observability).
- WHEN confirmo THEN se descarga `<name>.app.json` (el schema vivo del lienzo con el nombre
  elegido) y veo el comando completo con botón de copiar.

## Criterios de aceptación

- [ ] `appFile` en `schema.json` + `app.ts` del generador, con gate y conflictos. TDD + golden.
- [ ] Test de equivalencia: `--appFile` con el contenido de `boutique` ≡ `--app=boutique`.
- [ ] Wizard en `/studio` (diálogo): opciones = las del generador, sin inventos.
- [ ] Descarga del JSON + comando con todas las opciones elegidas; smoke Playwright.

## Referencias del proyecto de referencia

- Opciones reales: `libs/generators/src/generators/app/schema.json` (ui, database, plugins).
- `docs/vision-editor-visual-schema.md` §4 fase E.

## Reglas de negocio aplicables

- Regla 7: el wizard solo ofrece lo que el generador expone; las opciones se declaran una vez.
- El JSON descargado pasa el mismo gate que cualquier app-schema (defineApp al cargar).

## Fuera de scope (deliberado)

- Invocar el generador desde el estudio (backend local que ejecute nx) — fase F.
- Persistir el diseño en el workspace del acelerador automáticamente.
