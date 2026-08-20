# Diseño técnico: La columna de texto largo no ensancha la tabla

## El mecanismo, en tres capas

```
   CONTRATO                    POLÍTICA                        PINTADO
libs/schema                build-substitutions             data-table.ts.template
FieldTable.maxWidth   →    control 'textarea' && !maxWidth  →  td nowrap + span
(escape explícito          ? { maxWidth: 280 }                 [style.max-width.px]
 del modelo)               (regla 8: decide el generador,      class="truncate"
                            la plantilla solo interpola)       [hlmTooltip]="texto"

                     ─── y en paralelo, el mock que no puede mentir ───

                          canvas-table.component.ts
                          field.type === 'text' → mismo tope, mismo corte, mismo tooltip
                          (280 replicado con referencia cruzada: el estudio no puede
                           importar de libs/generators — igual que BADGE_CLASSES, spec 22)
```

Por qué el tope y no el ancho fijo: `min-width` ya existe y es un **suelo**; lo que falta es un
**techo**. Con los dos, una columna de texto largo mide lo que su contenido pida entre 120 y 280px, y
la fila nunca crece a lo alto porque el `nowrap` ya estaba (en el emitido) o se añade (en el mock).

## Capa 1 — Contrato (`libs/schema/src/lib/resource-types.ts`)

```ts
export interface FieldTable {
  show: boolean
  order?: number
  label?: string
  minWidth?: number
  /** Techo de ancho: la celda corta con elipsis y da el texto completo en el tooltip (spec 54) */
  maxWidth?: number
  ...
}
```

Un campo del contrato, nada más. `ColumnDef` del emitido gana el gemelo (`maxWidth?: number`).

## Capa 2 — Política (`build-substitutions.ts`)

Dos cambios, ambos en el fichero que ya decide las columnas:

```ts
/** Un campo que se edita en textarea es de 2000 caracteres: su columna se corta (spec 54). */
const LONG_TEXT_MAX_WIDTH = 280

// en renderFrontendColumns, junto al defecto 17:
.map(([name, table, field]) =>
  renderFrontendColumn(name, {
    ...(field?.type === 'boolean' && !table.type ? { type: 'boolean' as const } : {}),
    // el tope por defecto; un modelo que declare el suyo gana (…table va después)
    ...(field?.form?.control === 'textarea' ? { maxWidth: LONG_TEXT_MAX_WIDTH } : {}),
    ...table
  })
)

// en renderFrontendColumn, detrás de minWidth para que el orden de claves sea estable:
if (table.maxWidth !== undefined) parts.push(`maxWidth: ${table.maxWidth}`)
```

Las `virtualColumns` no traen `field`, así que nunca reciben el defecto: una columna calculada dice
su tope o no lo tiene. Correcto — nadie sabe mejor que su autor si eso es texto largo.

Efecto medido en el repo: **una sola** columna del catálogo lo estrena hoy — «Resultado» de
`worklog` (app-schema `solaris`), que ya había elegido a mano `minWidth: 280` para este mismo caso.
Ningún modelo del gate de oro tiene columna de texto largo, así que sus listados no se mueven.

## Capa 3 — Pintado emitido (`data-table.ts.template`)

`cellTpl` gana una rama **antes** del `@else` final, la del texto plano con techo:

```html
} @else if (col.maxWidth) {
  @let text = getDisplayValue(row, col);
  <span
    class="block truncate"
    [style.max-width.px]="col.maxWidth"
    [hlmTooltip]="text"
    [tooltipDisabled]="text === '—'"
  >
    {{ text }}
  </span>
} @else {
  {{ getDisplayValue(row, col) }}
}
```

Decisiones del pintado:

- **El techo va en el `span`, no en el `<td>`**: en una tabla con `min-width: max-content` el
  `max-width` de una celda es consejo, no ley; el que manda es el bloque de dentro. Por eso
  `class="block truncate"` (el `truncate` de Tailwind necesita un bloque con ancho acotado).
- **`@let` para no llamar tres veces a `getDisplayValue`** en cada celda de cada fila. Angular 21 lo
  soporta; si el gate AOT protestara, la salida es llamar dos veces y perder el `tooltipDisabled`.
- **`tooltipDisabled` cuando el valor es `—`**: un tooltip que repite un guion es ruido.
- **Las ramas `badge`/`date`/`boolean`/`badges` no se tocan**: una fecha, un booleano o una etiqueta
  no son texto largo, y meterlas en la rama del techo solo abriría casos que nadie pidió (regla 7).
- **La cabecera no se corta**: el `th` conserva su `nowrap` y su `min-width`. Si una etiqueta fuese
  más ancha que 280, manda la etiqueta — una columna sin nombre es peor que una columna ancha.
- `HlmTooltipImports` ya está importado en la plantilla (lo usan los botones de acción): cero
  dependencias nuevas.

## Capa 4 — El mock del lienzo (`canvas-table.component.ts`)

```ts
/**
 * Mismo techo que la app emitida (spec 54): el lienzo no puede prometer una tabla más
 * limpia que la que se genera. El valor vive dos veces porque el estudio no puede
 * importar de libs/generators — ver LONG_TEXT_MAX_WIDTH en build-substitutions.ts.
 */
const LONG_TEXT_COL_MAX_PX = 280
```

- `<td>`: `whitespace-nowrap`, y para `field.type === 'text'` el mismo `span` con techo, `truncate` y
  `[hlmTooltip]`.
- La cabecera: el `nowrap` va en el **`span` de la etiqueta**, no en el `<th>`. Motivo concreto: el
  `<th>` contiene también el popover del editor de columna (`w-56`, con `<label>`s y párrafos de
  ayuda); un `nowrap` en el `<th>` lo dejaría en una línea infinita.
- `HlmTooltipImports` se añade a los `imports` del componente (el paquete existe en el estudio:
  `@spartan-ng/helm/tooltip`, ya consumido por su propia `data-table.ts`).
- El mock de Vistas **no tiene cámara** (`CanvasViewportService` solo sirve a `model`/`flows`/
  `access`), así que el overlay del tooltip no sufre transformaciones: no hay riesgo de tooltip
  descolocado.

## Tests (orden TDD)

| # | Test (rojo primero) | Dónde |
|---|---------------------|-------|
| 1 | una columna de campo `textarea` declara `maxWidth: 280`; un `table.maxWidth` explícito gana; una columna normal NO lleva `maxWidth`; la plantilla contiene la rama del techo con `hlmTooltip` | `libs/generators/src/generators/resource/long-text-column.spec.ts` (calco de `boolean-column.spec.ts`) |
| 2 | una celda de columna con `maxWidth` se pinta en un bloque con `truncate` y `max-width: 280px`; sin `maxWidth` se pinta igual que hoy | `data-table.spec.ts.template` (suite emitida) |
| 3 | en el lienzo, la celda de un campo `text` va acotada y truncada, la de un `string` no, y ninguna celda envuelve | `canvas-table.component.spec.ts` |

Lo que **no** cubre un test unitario y se verifica a ojo con captura: que el tooltip aparezca al
pasar el ratón. Se comprueba en el lienzo y en la app regenerada, y se dice si no se ha probado.

## Gates

1. `nx test generators` (suite del generador) y suite del estudio (`vitest` con cwd en `apps/studio`).
2. `/golden-diff`: diff esperado **solo** en `data-table.ts` y `data-table.spec.ts` de las fixtures
   `app` y `app-mongo`. Re-baseline con el diff revisado línea a línea, nada más.
3. `web:build` (AOT) de una app emitida: es el único gate que valida de verdad la plantilla Angular
   (`@let`, el binding de `tooltipDisabled`).
4. Demo: regenerar `taller` **reiniciando antes el `studio-api`** (trampa de la spec 52: corre con
   `ts-node` y no recarga) y capturar el lienzo y la app.

## Riesgos identificados

- **El 280 vive dos veces** (generador y lienzo). Mitigación: comentario cruzado en los dos sitios y
  el test 3 clavando el número en el estudio. Es la misma deuda aceptada de `BADGE_CLASSES` (spec 22)
  y la alternativa —publicar una librería compartida entre repo y app generada— es peor negocio.
- **`@let` no tiene precedente en las plantillas del repo.** Mitigación: el gate AOT lo dice en
  segundos; salida documentada arriba.
- **`stickyLeftOffsets` sigue asumiendo que toda columna mide su `minWidth`.** El techo *acota* el
  error (antes el desbordamiento era ilimitado), no lo crea. Fuera de alcance, al ROADMAP.
- **La copia propia del DataTable del estudio** (`apps/studio/libs/frontend/src/shared/components/`)
  no estrena el techo hasta que el estudio se regenere. Sus pantallas de demo (warehouse) no tienen
  texto largo, así que no se ve; queda anotado.
- **Un valor sin espacios más largo que el techo** (un JSON pegado en el campo) se corta igual: la
  elipsis no necesita espacios. Verificado por diseño de CSS, no hace falta caso especial.
