# Diseño técnico: auth por defecto

## La forma

La ranura `auth` no desaparece: pierde la elección. `single-tenant` pasa a default y `none` se
convierte en **proveedor interno** — existe en la maquinaria (mongo lo necesita) pero no en
ninguna superficie de usuario.

```
                 usuario                          maquinaria
        ┌─────────────────────────┐    ┌────────────────────────────────┐
        │ wizard: sin grupo auth  │    │ SLOTS.auth:                     │
        │ CLI: sin flag --auth    │───▶│   default single-tenant         │
        │ --auth=none ⇒ ERROR     │    │   none con internal: true       │
        └─────────────────────────┘    │ database=mongo ⇒ downgrade a    │
                                       │   none con WARN (port pendiente)│
                                       └────────────────────────────────┘
```

- `SlotProvider` gana `internal?: boolean`. Un proveedor interno no cuenta para "¿se pregunta
  esta ranura?": no sale en `schema.json` (la paridad pasa a contar proveedores visibles), ni
  en `tools/slots.json` (el manifiesto publica solo los visibles → el wizard deja de pintar el
  grupo solo), ni en el formulario.
- `app.ts` resuelve ANTES de validar: si `options.auth === 'none'` → **error claro** («auth=none
  se retiró (spec 58): toda app lleva single-tenant; mongo lo pierde automáticamente hasta el
  port a Mongoose»). Si `database=mongo` y auth no viene explícito → downgrade interno a `none`
  con `console.warn` visible. `--auth=single-tenant` explícito sigue aceptándose (es el default).
- `normalizeLegacyPlugins` (`--plugins=auth`) sigue traduciendo a single-tenant: ahora es un
  no-op con aviso.

## Consecuencias asumidas

- **El grupo Autenticación desaparece del wizard entero**, incluida la tarjeta apagada
  multi-tenant ("Próximamente"): el teaser vuelve cuando multi-tenant sea real, no antes. La
  tarjeta de MongoDB gana el hint "Sin autenticación hasta el port a Mongoose".
- **Los tests del generador que usaban "app sin auth" con postgres** ya no describen ninguna
  realidad: los que prueban la ausencia (rate limit, sesiones, mi cuenta) pasan a generar con
  `database=mongo`; los que prueban auth quitan el flag (ahora es el default).
- **Gates de oro**: `app` ya se genera con auth (el comando del gate pasa de `--plugins=auth,email`
  a `--plugins=email`, misma emisión); `app-mongo` cae en el downgrade y emite lo mismo que hoy.
  Ningún re-baseline esperado: si el diff se mueve, algo está mal.
- El paso 2 del estudio (`generate-page`) siembra `defaultSelection` del manifiesto: al no
  publicar `auth`, ni lo pregunta ni lo manda; el comando emitido pierde `--auth=`.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Comandos guardados con `--auth=none` rompen | A propósito: error con mensaje que explica la retirada y la alternativa |
| El downgrade de mongo se vuelve invisible y se olvida el port | WARN en cada generación + hint en la tarjeta del wizard + spec futura ya nombrada |
| Alguna suite asuma el default antiguo | Barrido de specs en la TASK-01; la suite entera es el gate |
