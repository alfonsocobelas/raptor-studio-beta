# Tareas atómicas: «Antes de generar»

> Cada tarea = un commit. Implementar UNA, hacer commit, esperar revisión.
> Orden TDD obligatorio: dominio → estado → vista.
> No toca plantillas EJS ni `generator.ts`: **no hay gate de `/golden-diff`** en esta spec.

## Bloque A — el dominio

- [x] **TASK-01**: Tests + `generate-catalog.ts`: `mergeCatalog(manifest, selection)`. Casos:
      un grupo por ranura elegible menos `design`; la tarjeta del catálogo sin proveedor sale
      `available: false` con razón «Próximamente»; un proveedor del manifiesto ajeno al
      catálogo se pinta al final con su propia etiqueta; `requires` incumplido deshabilita
      con la razón traducida; los complementos mezclan plugins reales y los cuatro apagados.

- [x] **TASK-02**: Test + `designSummary(pages, resources)` en `wizard-command.ts`: cuenta
      vistas, bloques y recursos; un lienzo vacío da ceros.

- [x] **TASK-03**: Tests + `generate-runner.ts`: se extrae el stream NDJSON del componente a
      un servicio con las mismas señales, sin cambiar comportamiento. Casos con `fetch`
      falso: progreso acumulado, `done` correcto, respuesta no-ok, cuerpo cortado a mitad de
      línea, y el ticker parado al terminar.

## Bloque B — la pantalla

- [x] **TASK-04**: Tests + `generate-cards.component.ts`: las dos filas presentacionales
      (elección y complemento). Marcan la elegida, no dejan pulsar la apagada y enseñan la
      pastilla «Próximamente» con su razón.

- [x] **TASK-05**: Tests + `generate-page.component.ts` paso 2: capa a pantalla completa,
      cabecera con migas e indicador de pasos, columna de tarjetas, raíl con resumen y pila,
      «Volver al lienzo» y `Escape`. La corrección de ranuras incompatibles sigue viva.

- [x] **TASK-06**: Tests + paso 3 en la misma pantalla: nombre precargado de `appName` y
      validado, avanzado (instalar/directorio), comando con copiar, descargar schema,
      progreso y resultado. El botón del raíl cambia de texto y de acción.

- [x] **TASK-07**: Enchufar en `studio-canvas.component.ts`: el botón abre la capa nueva;
      se borra `generate-wizard.component.ts` y su import. Todos los `data-testid` de la
      lista del DESIGN siguen presentes.

## Validación

- [x] **TASK-08**: Suite del estudio en verde + comprobación en el navegador
      (`tools/smoke-slots.ts`): abrir la pantalla, elegir Azure + Postgres + single-tenant +
      correo, continuar, generar de verdad y ver el resultado. Captura a `docs/style/`.

> **TASK-08 (2026-08-14)**: verde la suite del estudio (577 en 49 ficheros), `typecheck` y
> —lo que de verdad manda— el **build AOT** (`npm run web:build`). El smoke de ranuras pasa
> contra la pantalla nueva; hubo que corregir en él una aserción caducada («el comando no
> lleva `--infra=`») escrita cuando `infra` tenía un solo proveedor: hoy tiene dos, así que
> el flag DEBE salir. Ahora comprueba lo que toca: que no viaja `--ui=` (un proveedor) y que
> sí viaja el `--design=` que manda el lienzo.
>
> Generada una app **de verdad** desde la pantalla (Azure + Postgres + single-tenant +
> correo, sin instalar, a `apps/_smoke41`): 545 ficheros en 10,1 s, con `config/loaders/azure`,
> el contexto IAM y los adapters de email. Borrada después; el workspace queda como estaba.
>
> Dos arreglos salidos de mirar la pantalla, no de los tests:
>
> - En oscuro el CTA del raíl salía casi blanco y **se leía como deshabilitado**. Toma el
>   naranja de la marca, como ya hacía el botón del lienzo.
> - El build AOT cazó dos cosas que la suite JIT y `tsc` dejaron pasar (un `CatalogGroup` sin
>   `label`, un `??` redundante). Anotado en el DESIGN: **el runner no es semáforo suficiente**.
>
> Captura: `docs/style/41-antes-de-generar-{infra,paso3,oscuro}.png`.
