# Diseño técnico: Las pieles alcanzan los bloques nuevos

Spec sin backend. Todo ocurre en tres sitios: `presets.ts` (lo que la piel dice), el
`styles.css.template` (dónde se inyecta), y las plantillas frontend de bloque (dónde se
engancha). Cero cambios en dominio, aplicación, persistencia o HTTP.

## A. El ámbito de los tokens: partir `css` en tokens + reglas

Hoy `DesignPreset` aporta un único bloque `css` que `app.ts` inyecta al FINAL del
`styles.css` (`designCss`). Dentro de ese bloque el preset intenta pisar `--radius*` y
`--font-sans` con `:root { … }`, y pierde:

```
selector                        especificidad   elemento
:root .theme-neutral            (0,2,0)         <body>     ← el tema. GANA
:root                           (0,1,0)         <html>     ← el preset. Ignorado
```

Y no se arregla con trucos de selector: `:root body` es (0,1,1) y `body[class*='theme-']`
(0,1,1) — ambos siguen por debajo de (0,2,0). Se arregla **inyectando los tokens del preset
DENTRO del bloque del tema**, después de los suyos: misma especificidad, orden de declaración
decide, y ni el preset conoce el id del tema ni hay aritmética de especificidad que mantener.

`DesignPreset` pasa de un campo a tres:

```ts
export interface DesignPreset {
  id: string
  label: string
  description: string
  files?: string
  /** Tokens que pisan a los del tema; se inyectan DENTRO de :root .theme-x, tras los suyos */
  tokens: string
  /** Idem en :root.dark .theme-x; '' si el preset no distingue modo oscuro */
  darkTokens: string
  /** Reglas del preset (selectores); se añaden al final del fichero, fuera de toda capa */
  css: string
}
```

`ThemeSubstitutions` gana `designTokens` y `designDarkTokens` (los rellena `app.ts` desde el
preset, igual que ya hace con `designCss`), y la plantilla los interpola:

```
:root .<%= themeClass %> {
  …tokens del tema…
<%_ if (designTokens) { _%>
  /* tokens del preset de diseño: mismo bloque, después → ganan sin trucos */
<%- designTokens %>
<%_ } _%>
}
```

Se mueven a `tokens` los `--radius*` de cabina y los `--radius*` + `--font-sans` de suite.
Se quedan en `css` los tokens **propios** del preset (`--shell-*`, `--banner-*`, `--grid-*`,
`--font-mono-cabina`): el tema no los declara, así que `:root` les basta y moverlos sería
churn sin motivo.

**El test existente miente y hay que apretarlo.** `design-preset.spec.ts:74` afirma
`/--radius:\s*0(px|rem)?\s*;[\s\S]*--radius-md:\s*0/` sobre el fichero entero: pasa en verde
con CSS muerto. Pasa a comprobar que el `--radius: 0` cae **dentro** del bloque
`:root .theme-x { … }`.

## B. El vocabulario de hooks: seis clases

> Nació con cinco. `app-metric` se añadió el 2026-08-25 con motivo escrito en `hooks.ts`: los
> KPIs se vestían por `.text-sm` y `p.text-2xl` (clases de Tailwind), lo que alcanzaba de paso
> al sufijo del valor y no alcanzaba nada en suite. La cifra es el único elemento cuyo trabajo
> entero es un número y las dos pieles lo quieren distinto.

Se **añaden** a las clases Tailwind existentes; no sustituyen nada. El neutro se ve igual que
hoy (única diferencia en el diff de oro: el literal de la clase).

| Hook | Semántica | Lo que el preset puede vestir |
| --- | --- | --- |
| `app-panel` | superficie contenedora de un bloque | fondo, borde, radio, sombra |
| `app-panel-head` | cabecera de esa superficie | fondo, borde inferior, tipografía del título |
| `app-toolbar` | tira de controles o pie de vista | densidad + `button`/`input` descendientes |
| `app-chip` | pastilla de dato | radio, fondo, tipografía, uppercase |
| `app-cell` | celda de rejilla que no es `<table>` | bordes de rejilla, padding, mínimos |
| `app-metric` | la cifra protagonista de un KPI | tamaño, letra de las cifras, peso |

### Colocación, plantilla a plantilla

| Plantilla | `app-panel` | `app-panel-head` | `app-toolbar` | `app-chip` | `app-cell` |
| --- | --- | --- | --- | --- | --- |
| `files-calendar/…-calendar.component` | tarjeta del mes (l.51) | barra ‹ mes › (l.52) | pie de vistas (l.147) + leyenda (l.166) | evento (l.89, l.125) | día (l.68) |
| `files-kanban/…-kanban.component` | columna (l.43) | cabecera de columna (l.49) | pie de conteo (l.74) | tarjeta (l.56) | — |
| `files-gantt/…-gantt.component` | contenedor scroll (l.49) | — | buscador (l.34) + paginación (l.95/103) | barra de tarea (l.67) | fila de tarea |
| `files-gallery/…-gallery.component` | tarjeta (l.44) | — | buscador (l.26) + paginación (l.80/88) | etiqueta (l.59) | — |
| `files-detail/…-detail.component` | `<dl>` de campos (l.106) + sección relacionada (l.132) | — | tira de acciones (l.70-95) | etiqueta (l.147) | — |
| `files-form/…-form-page.component` | ~~`<form>`~~ (retirado: no es superficie, el borde queda pegado a los campos) | título de sección (l.67) | botonera de guardar/cancelar | — | — |
| `files-attachments-front/…-attachments.component` | zona de arrastre (l.26) | — | — | fila de fichero (l.44) | — |
| `files-import/…-import.component` | panel de errores (l.90) | — | pie del diálogo (l.103-108) | — | — |

Ocho plantillas, un solo commit por plantilla (TASKS lo parte así). `files-transition` no
entra: no emite frontend — sus botones viven en detail y list, ya cubiertos.

## C. Lo que los presets pasan a vestir

1. **Contratos neutros del ADR-003**, junto a los `hlm*` que siguen sirviendo a `data-table` y
   `kpi-card`: los selectores `[hlmbtn]`, `[hlminput]`, `[hlmbadge]` ganan hermanos
   `[appbtn]`, `[appinput]`, `[appbadge]`. Es una lista de selectores, no CSS nuevo:
   `[hlmbtn], [appbtn] { … }`.
2. **Los cinco hooks**, en cabina (claro y oscuro) y suite.
3. **Controles crudos dentro de un toolbar**: gantt, galería, importación y detalle escriben
   `<button>`/`<input>` con Tailwind a mano, sin pasar por `appBtn`/`appInput` — ni los
   selectores de contrato los alcanzan. Los cubre `.app-toolbar button`, `.app-toolbar input`.
   Que esas plantillas **deberían** usar los contratos es un defecto real, pero migrarlas
   cambia marcado y dispara un diff de oro grande: queda anotado como backlog, fuera de esta
   spec.

Cromo por preset, para que la diferencia se vea a un metro:

```
                     app-panel            app-chip           app-cell
actual (neutro)      lo de hoy            lo de hoy          lo de hoy
cabina               radio 0, sin sombra, borde --shell-      rejilla --shell-border,
                     fondo transparente   border, uppercase  padding mínimo
                                          monospace
suite                radio 2px, sin       radio 2px,         borde derecho --grid-line,
                     sombra, borde        rectangular,       cabecera --grid-head-bg
                     --grid-line          peso 500
```

## D. El test de anti-desfase (el entregable que impide reincidir)

`design-hooks.spec.ts`, junto a `design-preset.spec.ts`. Dos aserciones simétricas, ambas
sobre ficheros, sin generar app:

1. **Ninguna plantilla de bloque nace neutra**: para cada plantilla frontend bajo
   `generators/resource/files-*/frontend/` que contenga cromo (`rounded-`, `shadow-`,
   `bg-card`, `bg-muted`), su contenido cita al menos un hook. El mensaje de fallo nombra la
   plantilla y recuerda la tabla de colocación.
2. **Ningún preset cita hooks fantasma**: cada `app-*` del vocabulario que aparezca en el CSS
   de un preset existe en alguna plantilla. Evita el CSS muerto que causó esta spec.

Lista blanca explícita para las plantillas sin cromo skinneable (`files-labels`,
`files-transition`): vacía hoy, y si mañana hace falta una excepción se escribe con su motivo
al lado.

## Decisiones técnicas

- **Tokens dentro del bloque del tema, no trucos de selector**: la especificidad de `:root
  .theme-x` (0,2,0) no se bate con nada estable desde fuera. El orden de declaración sí es
  estable y se lee sin calcular nada.
- **Cinco hooks, no diez**: cubren las ocho plantillas actuales. `app-cell` se queda porque lo
  usan dos (calendario y gantt) — si al implementar sólo lo usa una, se retira y bajamos a
  cuatro (compromiso de la Fase 1).
- **Los hooks se añaden, nunca sustituyen**: el neutro no cambia de aspecto. Así el diff de oro
  de esta spec es legible — sólo clases nuevas; cualquier otra línea es un error.
- **El hook es un literal en la plantilla**: cero lógica de piel en EJS, cero conocimiento del
  preset activo. ADR-003 intacto.
- **`app-toolbar` estiliza descendientes** (`button`, `input`): es lo que permite cubrir los
  controles crudos sin reescribir cuatro plantillas en esta spec.

## Riesgos identificados

- **El preset pisa cromo que no quería** (el selector de hook alcanza más de lo previsto).
  Mitigación: los hooks se colocan en contenedores, y las reglas del preset se limitan a
  superficie/radio/borde/tipografía; nada de layout (`display`, `grid`, `flex`).
- **Regresión invisible en el neutro**: una clase añadida en el sitio equivocado altera el
  layout. Mitigación: el gate de oro con diff sólo-clases + el test de "sin diseño se emite
  exactamente lo mismo" que ya existe (`design-preset.spec.ts:30`).
- **El truco de `@layer`**: las reglas del preset viven FUERA de toda capa a propósito (lección
  del 2026-08-10, `2323885c`) para ganar a las utilidades de Tailwind. Las reglas de hook
  nuevas heredan esa condición — si alguien las mete en `@layer components`, pierden contra
  `rounded-lg` y el síntoma vuelve, idéntico.
- **Especificidad hook vs utilidad**: `.app-panel { border-radius: 0 }` (0,1,0) sin capa gana a
  `.rounded-lg` (0,1,0, en `@layer utilities`) porque lo no-capado gana a lo capado. Verificado
  como mecanismo el 2026-08-10 con la densidad de la tabla; se revalida en navegador.
- **Re-baseline amplio**: ocho plantillas tocadas mueven las fixtures de oro. Mitigación: commit
  de re-baseline propio y separado, como manda la skill.
