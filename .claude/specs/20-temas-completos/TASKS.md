# 20 — Temas completos · TASKS

## Fase 1 — Color completo

- [x] TASK-01 — `deriveTheme` en `@raptor/schema`: escala L + semillas → juego completo de tokens (neutral reproduce los valores actuales)
- [x] TASK-02 — el catálogo de temas sustituye a `PALETTES`; `theme.id` en el app-schema con `palette` como alias
- [x] TASK-03 — `styles.css` pasa a plantilla EJS alimentada por `deriveTheme`; muere `palette.ts`. Gate: golden diff vacío en neutral
- [x] TASK-04 — el lienzo previsualiza con los mismos tokens derivados
- [x] TASK-05 — e2e: app generada en un tema no neutro, con superficies y bordes teñidos

## Fase 2 — Forma

- [x] TASK-06 — `--radius` por tema: schema, emisión y lienzo (mecanismo; el catálogo sigue en el radio del esqueleto hasta decidir forma por tema)

## Fase 3 — Tipografía

- [x] TASK-07 — `--font-sans` por tema, self-hosted en la app emitida
      · mismo patrón que el radio (TASK-06): MECANISMO listo, catálogo intacto hasta decidir la
        tipografía por tema (decisión de diseño de Alfonso). Un tema con `font` añade el `@import`
        de su paquete fontsource al styles.css, antepone la familia a la pila del esqueleto y mete
        el paquete en las dependencias emitidas (self-hosted, sin CDNs — como el Roboto de material)
      · sin fuente el css emitido es byte a byte el de siempre: golden intacto
- [x] TASK-08 — el lienzo carga la misma fuente que la app emitirá
      · `previewThemeVars` antepone `--font-sans: '<familia>', var(--font-sans)` sólo si el tema la
        declara. El día que el catálogo declare una, el estudio debe instalar su paquete fontsource
        para renderizarla de verdad (anotado en el código)

## Fase 4 — Tema de cliente

- [x] TASK-09 — `theme.seed`: tema completo derivado del color de marca del cliente
      · del hex sólo se toma el TONO; croma y luz los fija la receta medida del catálogo
        (primaria clara L .53, oscura L .72, ring L .62, superficies 0.016 con tarjeta blanca),
        con el croma recortado hasta caber en sRGB — un flúor corporativo a pelo no es un tema
      · `theme.seed` y `theme.id` son mutuamente excluyentes (gate en defineApp); la clase del
        body delata la semilla (`theme-seed-1a6dff`)
      · property-test con 5 colores de marca: ningún token derivado se sale de sRGB
      · verificación estática: app generada con `#1a6dff` → tokens teñidos al tono 261 y clase
        correcta en el index.html
- [x] TASK-10 — e2e: dos apps lado a lado, una de catálogo y otra con semilla
      · 2026-08-08, desbloqueada levantando Docker Desktop: dos apps generadas del MISMO diseño
        (tienda-ocean con theme.id y tienda-marca con theme.seed #1a6dff), cada una con su
        postgres (5461/5462), api (3461/3462) y web (4461/4462), datos reales sembrados
      · verificado en vivo (e2e-19/20.png): body `theme-ocean` vs `theme-seed-1a6dff`,
        --background oklch(0.965 0.016 236) vs oklch(0.965 0.016 261.165), primarias distintas
      · la demo detectó un bug real: el compose emitido no fijaba nombre de PROYECTO y el up de
        la segunda app sustituía el contenedor de la primera — arreglado en el generador
        (4869274) con re-baseline propio (ecbbc5c), nunca a mano en las apps generadas
