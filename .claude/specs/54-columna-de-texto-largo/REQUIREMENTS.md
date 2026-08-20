# Spec: La columna de texto largo no ensancha la tabla

> Petición de Alfonso (2026-08-20), mirando el lienzo de `taller` → Vistas → Órdenes: «si te fijas
> en el "Avería que cuenta el cliente" es large text y en vez de ocultar a partir de un número de
> caracteres para que no se dimensione desproporcionadamente lo que hace es ensanchar toda la fila,
> como consecuencia el diseño se ensucia».

---

## Contexto de negocio

Un campo `text` del modelo es un campo de **2000 caracteres** (`draftToResource` le pone
`constraints[key] = { MAX: 2000 }`). Hoy ninguna de las dos tablas del acelerador tiene una política
de ancho para ese caso, y cada una lo rompe a su manera:

```
LIENZO (canvas-table.component.ts)                 EMITIDO (data-table.ts.template)
td: "px-4 py-3" a pelo, sin nowrap                 td: whitespace-nowrap + min-width:120
→ el texto parte en 5 líneas                       → la fila NO crece a lo alto…
→ la fila mide 140px y solo caben 4 registros      → …pero la columna crece a lo ancho SIN TECHO
→ arrastra a las vecinas: «OR-2026-0141»           → 600-800px de columna que empujan el resto
  se rompe en dos y la cabecera en tres              fuera de la pantalla
```

Los dos defectos tienen la misma raíz: **el ancho de una columna no es una decisión de nadie**.
`draftToResource` da `minWidth: 120` a todos los campos por igual sin distinguir que uno es de 2000
caracteres, y `ColumnDef` no tiene forma de expresar «esta columna se corta».

Que el lienzo se rompa de una manera y el emitido de otra es, además, una divergencia viva: hoy el
lienzo **miente** sobre cómo se verá la app (ROADMAP 23). No basta con maquillar el mock.

## Decisiones cerradas (2026-08-20)

1. **Alcance: lienzo + emitido**, no el lienzo solo. Arreglar únicamente el mock lo dejaría más
   limpio que la app generada, que es la mentira contraria.
2. **Tope en píxeles con elipsis de CSS (`truncate`), no corte por número de caracteres.** Razones:
   (a) el corte por caracteres hay que replicarlo idéntico en mock y emitido para que el lienzo no
   mienta, y cualquier deriva de una constante rompe la fidelidad; (b) 40 caracteres anchos no miden
   lo mismo que 40 estrechos, así que el corte por conteo sigue produciendo columnas descuadradas;
   (c) el truncado por CSS es **solo presentación**: el dato que viaja al CSV/Excel, al buscador y al
   formulario sigue entero, sin una sola rama nueva en el pipeline de datos.
3. **El texto completo se ve en el tooltip de spartan (`hlmTooltip`)**, no en un `title` nativo: es
   la piel del sistema de diseño y en el DataTable emitido ya está importado.
4. **El tope es política del generador, derivada del tipo**: una columna cuyo campo se edita en
   `textarea` se corta por defecto. No se pide campo a campo en cada modelo (se olvidaría), pero un
   modelo escrito a mano puede declarar el suyo y ganar (`table.maxWidth`). Mismo mecanismo que el
   defecto 17 (`boolean` → `type: 'boolean'` derivado en `build-substitutions`).
5. **Tope = 280px.** No es un número inventado: es el `minWidth` que el módulo de oro `worklog` ya
   eligió a mano para su columna «Resultado», que es exactamente este caso.
6. **Una celda ocupa UNA línea en el lienzo, como en el emitido.** El `nowrap` que le falta al mock
   entra en esta spec: es la otra mitad de por qué «el diseño se ensucia» (referencias y cabeceras
   partidas en dos y tres líneas).

## User stories (formato EARS)

### Contrato del schema

- WHEN un modelo declara `table.maxWidth` en un campo THEN la columna emitida lleva ese tope
- IF un campo se edita en `textarea` y su `table` no declara `maxWidth` THEN el generador emite el
  tope por defecto (280) — la política vive en `build-substitutions`, no en cada modelo
- IF un campo NO es de texto largo THEN su columna se emite exactamente igual que hoy (sin `maxWidth`)

### Tabla emitida

- WHEN una columna tiene `maxWidth` THEN su celda pinta el valor en UNA línea, cortado con elipsis al
  llegar al tope
- WHEN una celda cortada recibe el ratón THEN un tooltip de spartan muestra el valor completo
- IF el valor de una celda con tope está vacío THEN no hay tooltip que mostrar
- WHILE se exporta a CSV/Excel o se busca/filtra THEN el valor viaja **entero**: el tope es CSS, no
  toca el dato
- WHEN una columna sin `maxWidth` se pinta THEN sale byte a byte como hoy — criterio de aceptación
  del gate de oro

### Lienzo

- WHEN el lienzo pinta una celda THEN la pinta en UNA línea (`nowrap`), como el emitido, y la fila
  mide una línea de alto
- WHEN el lienzo pinta una columna de un campo `text` THEN aplica el MISMO tope y el MISMO corte con
  elipsis que la app emitida, con el tooltip de spartan sobre el texto completo
- WHILE el lienzo replica el tope THEN el valor 280 queda anotado en los dos sitios con referencia
  cruzada a esta spec (el estudio no puede importar de `libs/generators`, igual que ya pasa con
  `BADGE_CLASSES` de la spec 22)
- IF una cabecera es más larga que el tope de su columna THEN manda la cabecera: una etiqueta es
  corta por naturaleza y cortarla dejaría la columna sin nombre

## Criterios de aceptación

- [ ] En el lienzo de `taller` → Órdenes, las 5 filas de la tabla caben en pantalla: cada fila mide
      una línea, ninguna referencia ni cabecera se parte, y «Avería que cuenta el cliente» se corta
      con elipsis (verificado con captura, no «parece que sí»)
- [ ] El tooltip de una avería cortada muestra el texto completo, en el lienzo y en la app emitida
- [ ] `apps/taller` regenerado: la columna `averia` sale con `maxWidth: 280` y la tabla ya no empuja
      las columnas de importe y garantía fuera de la pantalla
- [ ] Gate de oro: diff **vacío** salvo el `data-table.ts` del kernel (y su `.spec.ts`) en las dos
      fixtures de app, declarado y revisado. Ningún modelo del gate (contract/customer/license/
      project) tiene columna de texto largo, así que el tope no mueve un solo byte de sus listados;
      quien lo estrena es `worklog` (app-schema `solaris`, fuera del gate) y eso se prueba con un
      test de `renderFrontendColumns`, no con el diff
- [ ] `web:build` (AOT) de una app emitida + suite del estudio + suite de generadores en verde

## Referencias del proyecto

- `libs/generators/src/generators/frontend-kernel/files-ui/spartan/shared/components/data-table.ts.template`
  (`ColumnDef`, `cellTpl`, `stickyLeftOffsets`)
- `libs/generators/src/generators/resource/build-substitutions.ts` → `renderFrontendColumn`
- `libs/schema/src/lib/resource-types.ts` → `FieldTable`
- `libs/generators/src/generators/resource/models/worklog.model.ts` (el caso de oro que ya existe)
- `apps/studio/libs/frontend/src/domains/studio/design/canvas-table.component.ts` (el mock)
- `apps/studio/libs/shared/domain/src/studio/draft-resource.ts` → `draftToResource`
- ROADMAP 23 (el lienzo no puede mentir), spec 22 (criterio replicado con referencia cruzada)

## Reglas de negocio aplicables

- Regla 7 (generar, no interpretar): el tope es un defecto por tipo con escape explícito en el
  modelo; no se inventa un lenguaje de anchos por caso raro
- Regla 8 (plantillas tontas): la plantilla solo interpola `maxWidth`; quién lo decide es
  `build-substitutions`
- ADR del lienzo: el mock replica el emitido; si divergen, se arregla el generador y el mock detrás

## Fuera de scope (deliberado)

- **Anchos ajustables por el usuario** (arrastrar el borde de la columna en la app emitida): capacidad
  nueva, spec propia si se pide.
- **Ocultar la columna de texto largo del listado.** Es la alternativa de producto —un campo de 2000
  caracteres podría vivir solo en la ficha— y Alfonso la descartó explícitamente al pedir el corte.
- **Arreglar la aritmética de `stickyLeftOffsets`**, que asume que toda columna mide su `minWidth`.
  Es un defecto anterior y el tope lo mejora (acota el desbordamiento) en vez de empeorarlo; se anota
  en el ROADMAP.
- **Regenerar `apps/studio`** para que su propia copia del DataTable estrene el tope: el estudio se
  regenera cuando toque, no en esta spec.
- Tocar el límite de 2000 caracteres del VO, la ficha, el formulario o el buscador.
