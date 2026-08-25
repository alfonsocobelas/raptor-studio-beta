# Spec: El canvas del estudio lleva la piel de verdad

## Contexto de negocio

El estudio ya deja elegir la piel (`PreviewSettings.preset`, con el mismo catálogo que la ranura
`design` del generador), y el canvas cambia… de color. Nada más. Lo que aplica es
`presetChrome()`: un puñado de tokens `--preview-shell-*` / `--preview-banner-*` **copiados a
mano** desde `design/presets.ts`, y el propio fichero lo declara sin disimulo —
«es una APROXIMACIÓN declarada… su trabajo es que se reconozca el preset, no clonarlo».

Consecuencia medida el 2026-08-25: Alfonso juzga las pieles en el canvas, ve los KPIs con las
esquinas redondeadas de spartan bajo cabina y suite, y concluye que la piel no se aplica. Tiene
razón en lo que ve: en el canvas NO se aplica. En la app generada sí — 0px en cabina y 2px en
suite en los doce elementos medidos (spec 67, `VERIFICACION.md`).

Es el defecto de la spec 67 un piso más arriba, y de la misma familia: **una segunda copia de la
verdad que se queda atrás**. La spec 67 lo arregló entre plantillas y presets con un vocabulario
de hooks; aquí hay que arreglarlo entre el generador y el estudio. Con un agravante: los bloques
del canvas (`canvas-table`, `canvas-calendar`, `canvas-kanban`, `canvas-detail`, `canvas-cards`,
`canvas-form-*`, la tira de KPIs) son una **segunda implementación** de los bloques emitidos, así
que no basta con servir el CSS: hay que nombrar los hooks también ahí.

Por qué importa más de lo que parece: el canvas es donde se decide la piel. Si miente, se elige a
ciegas y el descubrimiento llega al generar — que es exactamente lo que pasó.

## User stories (formato EARS)

- WHEN se elige `cabina` en el selector de piel THEN los bloques del canvas se dibujan con las
  esquinas, la densidad y el cromo de cabina, no sólo con sus colores de shell.
- WHEN el generador cambia el CSS de un preset THEN el canvas lo refleja sin tocar el estudio:
  la verdad sigue viviendo en `design/presets.ts`.
- IF un bloque del canvas pinta cromo sin hook del vocabulario THEN la suite del estudio falla,
  igual que ya falla la del generador para las plantillas.
- WHILE se previsualiza THEN la piel afecta SOLO a la app dibujada, nunca al cromo del estudio
  (que tiene su propio tema, ya separado).
- IF la piel elegida es `actual` THEN el canvas se ve exactamente como hoy.

## Criterios de aceptación

- [ ] El CSS de los presets llega al estudio **derivado del generador**, no copiado: una sola
      fuente de verdad (`design/presets.ts`), servida por el backend del estudio.
- [ ] El CSS del preset se aplica **acotado al canvas**: reescribiendo `:root` al ámbito de la
      previsualización, y `.dark` al tema de la app dibujada — el chrome del estudio no se toca.
- [ ] Los bloques del canvas nombran los hooks del vocabulario (`app-panel`, `app-panel-head`,
      `app-toolbar`, `app-chip`, `app-cell`, `app-metric`), como ya hacen las plantillas.
- [ ] Medido en navegador: con cabina, las esquinas de KPI, panel de calendario, columna de
      kanban y pastillas dan 0px en el canvas; con suite, 2px; con actual, lo de hoy.
- [ ] `presetChrome()` deja de duplicar tokens del generador (o desaparece).
- [ ] Guard de anti-desfase del estudio, espejo del `design-drift.spec.ts` del generador.

## Referencias del proyecto

- `libs/generators/src/generators/app/design/presets.ts` — la verdad (sin imports: portable)
- `libs/generators/src/generators/app/design/hooks.ts` — el vocabulario
- `apps/studio/libs/frontend/src/domains/studio/design/preview-settings.ts` — la aproximación
- `.claude/specs/67-pieles-alcanzan-los-bloques/` — la spec hermana y su verificación

## Reglas de negocio aplicables

- **Generar, no interpretar**: el canvas previsualiza; la verdad la emite el generador. Si algo
  no se puede previsualizar fielmente, se etiqueta, no se falsea ([[etiqueta-diseno-aun-no-generable]]).
- **Plantillas tontas / estudio tonto**: el estudio no decide cromo, lo consume.
- **El estudio no se disfraza**: la piel viste la app dibujada, no el chrome del estudio.

## Fuera de scope (deliberado)

- Unificar las dos implementaciones de los bloques (canvas del estudio vs plantillas emitidas).
  Es el problema de fondo y merece su propia spec; aquí se paga el peaje de nombrar los hooks
  dos veces y se deja el guard que avisa cuando una de las dos se queda atrás.
- Previsualizar el SHELL completo de cada piel (banda de suite, barra de cabina): el canvas ya
  dibuja su aproximación de shell y no es lo que Alfonso está juzgando.
- Presets nuevos y cambios de paleta.
