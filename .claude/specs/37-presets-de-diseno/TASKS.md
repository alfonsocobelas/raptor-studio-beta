# Tareas atómicas: Presets de diseño

- [x] **TASK-01**: Registro `design/presets.ts` + ranura `design` en slots.ts + flag en
      schema.json + `npm run slots`. Test rojo primero (`design-preset.spec.ts`): el default
      emite lo mismo byte a byte, cada preset su shell, y un id desconocido falla sin emitir.
      Commit `f1e600e`.
- [x] **TASK-02**: Shells de `cabina` (lateral a contraste, dos temas) y `suite` (banda +
      pestañas de módulo + miga desde la ruta), en `files-design/<preset>/`.
- [x] **TASK-03**: Verificación en navegador con backend real (Postgres docker + seed).
      Evidencia: `apps/studio/e2e-28-cabina-claro.png`, `e2e-29-cabina-oscuro.png`,
      `e2e-30-suite.png`.
      · **La verificación visual cazó un defecto que ningún gate veía** (`2323885`): dentro de
        `@layer components` las reglas de densidad del preset PERDÍAN contra las utilidades de
        Tailwind (`@layer utilities`), que es de donde sale el padding del DataTable. Las
        cabeceras en versalitas sí aplicaban (nadie compite por `text-transform`) y el relleno
        de fila no — o sea, el preset parecía funcionar y no lo hacía. CSS sin capa gana a
        todas las capas.
- [x] **TASK-04**: Gates — suite 521 verde, 6 golden vacíos (el default no mueve un byte),
      `typecheck:emitted` a 0 errores con `--design=cabina` y con `--design=suite`.

## Pendiente

- [x] **TASK-05**: El estudio. Había DOS superficies y la ranura solo llegaba a una:
      · el **wizard** ya la mostraba (lee `tools/slots.json` en cada petición), pero vive tras el
        diálogo de generar, así que no se ve al abrir el estudio;
      · el **lienzo** seguía con el toggle spartan/material — la aproximación de 12 líneas de CSS
        que no dice nada de la app emitida. Sustituido por un **desplegable de preset visual**
        que tiñe el cromo del lienzo y **siembra el wizard** con lo elegido (lo dibujado = lo
        generado). Etiqueta «Preset visual» y no «Diseño»: en el estudio un diseño es el schema.
      · verificado en el estudio en marcha (puerto 4316): selector con los tres presets, wizard
        con el grupo «Preset visual», 0 errores de consola. Evidencia `e2e-31-estudio-preset.png`.
      · gates: generators 521 ✅ · estudio front 216 ✅ · estudio back 265 ✅ · 6 golden vacíos ✅
- [ ] **TASK-06**: Densidad de `cabina` más agresiva si Alfonso la quiere: hoy la fila baja de
      ~49px a ~42px porque los chips de badge llevan su propio padding. Bajar más exige tocar
      el badge, que es componente compartido — decisión suya.
