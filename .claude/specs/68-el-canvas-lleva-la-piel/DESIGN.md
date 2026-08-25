# Diseño técnico: El canvas del estudio lleva la piel de verdad

Sin backend nuevo y sin endpoint nuevo. Tres movimientos: **mover la verdad** a donde ya viven
los temas, **aplicarla acotada** al lienzo, y **nombrar los hooks** en los bloques del canvas.

## A. Los presets se mudan a `libs/schema` (y el precedente lo respalda)

El canvas ya resuelve así el TEMA y hay una nota en el repo explicando por qué:

```
libs/schema/src/lib/themes.ts + derive-theme.ts   ← LA VERDAD
        │                                    │
        ├── generador: styles.css emitido    └── estudio: previewThemeVars() en el lienzo
```

> «Salen de la MISMA `deriveTheme` que alimenta el styles.css emitido. Antes el lienzo llevaba su
> propio juego escrito a mano, y ya había derivado: pintaba el primario en 0.25 cuando el
> generador emitía 0.205… Una sola fuente evita volver a eso.»
> — `preview-theme.ts`

Los presets son el caso que quedó sin migrar: viven en el generador y el estudio se hizo una
copia (`presetChrome()`), que ya ha derivado — lleva colores de shell y ni un radio. Así que
`design/presets.ts` y `design/hooks.ts` **se mueven a `libs/schema`** y se exportan por su
barrel, exactamente como `themes.ts`:

```
libs/schema/src/lib/design-presets.ts   DESIGN_PRESETS, DEFAULT_DESIGN, selectDesign, DesignPreset
libs/schema/src/lib/design-hooks.ts     DESIGN_HOOKS
```

- Consumidores en el generador (`app.ts`, `plugins/slots.ts`, los dos spec) sólo cambian el
  import; `files-design/<id>/` (las plantillas de shell) se quedan donde están: son emisión, no
  datos.
- El estudio importa `@raptor/schema`, igual que ya hace para `THEMES`. Cero endpoint, cero
  `slots.json` que mantener, cero copia que envejecer.
- Alternativa descartada: servir el CSS por el manifiesto de ranuras (`tools/slots.json`). Es un
  canal que ya existe, pero añade un fichero que puede quedarse atrás — el problema que estamos
  matando — y obliga a un test de sincronía que la mudanza hace innecesario.

## B. Aplicar el CSS del preset acotado al lienzo

El CSS de un preset está escrito para la app emitida: `:root` (los tokens), `.dark` (el modo) y
`.app-shell-main` (el contenedor). En el estudio, el lienzo es «la app» y el resto es chrome del
estudio, que **no debe teñirse**. Una función pura hace la traducción:

```
scopePresetCss(css, '.app-piel')

  :root { --radius: 0 }        →  .app-piel { --radius: 0 }
  .dark { --shell-bg: … }      →  .app-piel.dark { --shell-bg: … }
  .app-shell-main table td {…} →  .app-piel table td {…}
  .app-panel {…}               →  .app-piel .app-panel {…}
  .dark [appbadge] {…}         →  .app-piel.dark [appbadge] {…}
```

Reglas, en este orden: `:root`/`.app-shell-main` se sustituyen por el ámbito; un selector que
empieza por `.dark` pasa a `<ámbito>.dark`; cualquier otro se prefija con `<ámbito> `. Los
comentarios y las líneas `@…` viajan intactos.

Se inyecta como un `<style>` que el lienzo mantiene al día con la piel elegida, y el nodo raíz
del lienzo suma la clase de ámbito. El modo oscuro de la app dibujada ya se pinta ahí
(`[class.dark]`), así que `.app-piel.dark` cae solo.

**Por qué los tokens hacen la mitad del trabajo gratis**: los bloques del canvas usan utilidades
Tailwind (`rounded-lg` → `var(--radius-lg)`). Con los `--radius*` del preset declarados en el
ámbito, TODO lo que hay dentro hereda las esquinas correctas sin una regla por componente. Es la
misma mecánica que la spec 67 arregló en el emitido, aquí a favor.

**Riesgo a vigilar**: el `<style>` inyectado es global; si un selector se quedara sin prefijo,
teñiría el estudio entero. Por eso `scopePresetCss` es una función pura con tests propios y un
caso explícito por forma de selector, y el smoke comprueba que el chrome del estudio (un botón
de la barra de herramientas) NO cambia de radio al elegir cabina.

## C. Los hooks, en los bloques del canvas

Doce componentes del canvas pintan cromo (`rounded-*`, `shadow-*`, `bg-card`, `bg-muted`):

| componente | hooks que le tocan |
| --- | --- |
| `canvas-page` (tira de KPIs) | la tarjeta KPI ya los trae: es `app-kpi-card`, copia del emitido |
| `canvas-table` | `app-panel` (envoltura), `app-toolbar` (buscador + paginación), `app-chip` (badges) |
| `canvas-calendar` | `app-panel`, `app-panel-head`, `app-cell`, `app-chip`, `app-toolbar` |
| `canvas-kanban` | `app-panel`, `app-panel-head`, `app-chip`, `app-toolbar` |
| `canvas-cards` | `app-panel`, `app-chip` |
| `canvas-detail` | `app-panel`, `app-panel-head`, `app-chip` |
| `canvas-form` / `canvas-form-fields` / `canvas-form-dialog` | `app-panel-head` (sección), `app-toolbar` (botonera); el `<form>` NO es superficie (lección de la 67) |
| `canvas-controls`, `canvas-header`, `canvas-session-footer`, `canvas-admin-nav-group` | son SHELL del mock, no bloques: quedan fuera y se declaran en la lista blanca del guard |

Mismo criterio que en las plantillas: el hook se **añade** delante de las clases Tailwind, nunca
las sustituye. Con la piel `actual` el canvas se ve idéntico a hoy.

## D. El guard, espejo del del generador

`design-hooks-canvas.spec.ts` en el estudio, con la misma pareja de aserciones que
`design-drift.spec.ts`: ningún componente de bloque del canvas con cromo se queda sin hook, y
ningún hook del vocabulario deja de usarse. La lista blanca (los cuatro componentes de shell)
lleva su motivo escrito al lado.

Esto **no** une las dos implementaciones de los bloques — sigue habiendo dos —, pero pone un
detector en cada lado. Unificarlas es la spec que queda pendiente y la que mata la clase entera.

## Decisiones técnicas

- **Mudar los presets a `libs/schema`** en vez de servirlos por HTTP o por JSON: es donde ya
  viven los temas, por el mismo motivo, y elimina la copia en vez de sincronizarla.
- **`scopePresetCss` como función pura**: la reescritura de selectores es la única pieza con
  riesgo real (teñir el estudio), y así se prueba sin navegador, caso por caso.
- **Tokens antes que reglas**: declarar los `--radius*` del preset en el ámbito arregla las
  esquinas de todo el canvas sin tocar componente alguno; los hooks son para lo que el token no
  alcanza (fondo, borde, tipografía, densidad).
- **`presetChrome()` se borra**, no se deja envuelta: su razón de existir era no tener el CSS real.
- **El shell del mock queda fuera**: el canvas ya dibuja su aproximación de barra/banda y no es
  lo que se está juzgando (fuera de scope de la spec).

## Riesgos identificados

- **Fuga de estilos al estudio**: mitigado por la función pura con tests y por una comprobación
  explícita en el smoke sobre el chrome del estudio.
- **La mudanza a `libs/schema` toca imports del generador**: mecánico, y el gate de oro más la
  suite del generador lo cubren (el CSS emitido no cambia ni un byte).
- **Doble mantenimiento de hooks** (canvas y plantillas): asumido y vigilado por los dos guards;
  la unificación queda anotada como spec futura.
- **El canvas puede quedar MÁS fiel que el shell que dibuja**: los bloques llevarán la piel real
  y la barra/banda seguirán siendo aproximación. Es aceptable — y si canta, la siguiente vuelta
  es servir también el shell.
