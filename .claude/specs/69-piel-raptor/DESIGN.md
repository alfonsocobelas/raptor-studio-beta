# Diseño: La familia raptor — tres pieles y el tema de la casa

---

## 1. El tema: croma por escalón

`deriveTheme` aplica hoy **un croma único** a todos los escalones de la rampa. La paleta del
estudio no funciona así: el croma SUBE al bajar la luminancia, porque es lo que mantiene el
matiz cálido perceptible sin ensuciar el papel.

```
escalón      L       croma   tono   token
page       0.985     0.003    85    --background   #fbfaf8
wash       0.962     0.006    75    --muted        #f5f2ee
line       0.918     0.008    74    --border       #e7e3de
dim        0.560     0.013    63    --muted-fg     #7a736d
deep       0.215     0.005    68    --foreground   #1b1917
```

Con croma único: a 0.003 el borde y el gris medio salen neutros (se pierde la calidez donde se
ve); a 0.008 el papel se recorta contra el gamut sRGB y sale blanco. No hay valor bueno.

**Cambio**: `ThemeSurface` gana un campo opcional

```ts
chromaByStep?: Partial<Record<keyof Ramp, number>>
```

y `surfaceTokens` resuelve el croma de cada escalón como
`chromaByStep?.[step] ?? surface.chroma`. Cuatro líneas. El tono también varía por escalón
(85/75/74/63/68), así que el mismo tratamiento se le da a `hueByStep`.

**Seguro**: ningún tema actual declara los campos → `?? surface.chroma` devuelve lo de siempre y
los seis temas emiten byte a byte lo mismo. El test lo fija explícitamente.

## 2. El tema `raptor`

Séptima entrada de `THEMES`. Semillas:

```
surface:  chroma 0.005 · hue 70   (el resto, por escalón)
          ramp:     page 0.985 · wash 0.962 · line 0.918 · dim 0.56 · deep 0.215
                    night 0.19 · slate 0.245 · raised 0.30 · faint 0.72
          untinted: ['base']      (la tarjeta, blanca: es lo que le da relieve)
light:    primary #1b1917 (tinta)  ·  ring #f15539 (naranja de marca)
dark:     primary oklch(0.94 0.004 80) (invertido) · ring oklch(0.7 0.19 33)
```

El CTA dominante es **tinta**, no naranja — igual que en el estudio: el naranja se reserva a un
acento por pantalla, y ese acento lo pone la piel.

`PREVIEW_PALETTES` del estudio se deriva de `THEMES`, así que el tema aparece en el selector sin
tocar nada del estudio.

## 3. El descriptor de shell del lienzo

Hoy el espejo del lienzo es `@if (preview.preset() === 'suite') … @else if ('cabina') … @else`,
~130 líneas de plantilla duplicada. Con cinco pieles no se sostiene, y ya derivó dos veces.

**Cambio**: `shell-descriptor.ts` describe cada shell como datos:

```
ShellDescriptor = {
  layout:      'rail' | 'topbar'       // dónde vive la navegación
  rail?:       { width, surface, seam, eyebrow, activeMarker }
  topbar?:     { surface, fg, mark }   // banda de marca (suite, rotulo)
  statusbar?:  { kind: 'crumb' | 'path' }
  modules?:    boolean                 // pestañas de módulo bajo la banda (suite)
}
```

La plantilla del lienzo se escribe UNA vez contra el descriptor. `cabina` y `suite` se extraen
tal cual: el test de la tarea compara el DOM renderizado antes/después por `data-testid`
(`mock-sidebar`, `mock-banner`, `mock-modules`, `mock-breadcrumb`) — la extracción no puede
cambiar un nodo.

> El descriptor vive en el ESTUDIO, no en el schema: describe la maqueta del lienzo, no el
> emitido. El emitido sigue siendo un `app.component.ts.template` por piel — es Angular real,
> no datos.

## 4. Las tres pieles

Todas comparten dos reglas nuevas respecto a `cabina`/`suite`:

1. **Las superficies se derivan del tema**, no de hex fijos:
   `color-mix(in oklab, var(--muted) 55%, var(--card))` para el lino del raíl,
   `color-mix(in oklab, var(--border) 70%, var(--foreground) 8%)` para la costura. Así `taller`
   con el tema `ocean` sigue siendo coherente, en vez de arrastrar un lino cálido a una app azul.
   (`cabina` y `suite` fijan oklch a mano; no se toca, pero no se imita.)
2. **El acento es `--ring`**: el naranja aparece porque el tema `raptor` lo pone en `ring`. Con
   otro tema, el acento es el de ese tema. Ninguna piel escribe un naranja literal.

### 4.1 `taller` — el marco del estudio

| | |
|---|---|
| shell | raíl de 208px sobre lino, costura a un paso del borde, versalita «Panel de gestión», activo con papel + marcador de 2px en `--ring` |
| densidad | la del neutro (tabla `text-sm`, filas de 40px): es la piel «cómoda» |
| radios | los del tema (10px); recuadro de panel a 9px, nav a 7px |
| cromo | tarjeta KPI con borde y sombra mínima, cifra a 30px; pastillas redondas con fondo lavado |
| hooks | `app-panel` 14px + borde, `app-panel-head` versalita, `app-metric` 30px, `app-chip` píldora, `app-cell` 14px, `app-toolbar` controles a 36px |

### 4.2 `banco` — banco de trabajo

| | |
|---|---|
| shell | raíl de 184px sin sombra + **barra de ruta** arriba (`app / sección`) |
| densidad | 12,5px, filas de 30px, cabecera de tabla en banda de lino con versalitas |
| radios | 6px en todo (`tokens` pisa los cinco radios, como cabina) |
| cromo | KPIs **fundidos**: tira de cuatro celdas separadas por líneas, sin tarjeta; etiquetas de estado en CONTORNO |
| hooks | `app-panel` plano sin sombra, `app-panel-head` banda de lino, `app-metric` 22px, `app-chip` rectangular, `app-cell` 12,5px, `app-toolbar` controles a 30px |

Se diferencia de `cabina` (que también es densa) en que **no invierte el raíl a contraste** ni
va a monospace: es la misma casa que `taller`, apretada. Se documenta en la descripción del
preset para que la elección en el wizard no sea ambigua.

### 4.3 `rotulo` — la marca al frente

| | |
|---|---|
| shell | banda de tinta de 56px con el logotipo en `--ring`, navegación horizontal, raíl blanco de 200px con los filtros guardados |
| densidad | holgada: título de 30px, KPIs de 34px, filas de 44px |
| radios | los del tema (8/14px) |
| cromo | CTA en `--ring` (el único caso de la familia), versalita de sección en `--ring`, cabecera de tabla con regla de 2px en tinta |
| hooks | `app-panel` 14px con sombra, `app-panel-head` regla gruesa, `app-metric` 34px, `app-chip` píldora, `app-cell` 14px, `app-toolbar` controles a 34px |

## 5. Gates

| gate | cuándo |
|---|---|
| `/golden-diff` vacío | toda tarea que toque el generador o el schema (nadie declara los campos nuevos → emitido intacto) |
| `design-drift.spec.ts` | las tres pieles: sólo hooks del vocabulario, ninguno sin vestir |
| `npm run typecheck` | toda tarea que toque `apps/studio` (vitest no typechequea) |
| smoke en navegador | TASK-07: tres apps generadas y construidas, dist servido, API simulada con `page.route` (patrón de la spec 67; Playwright vive en `apps/studio`) |
