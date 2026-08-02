# 20 — Temas completos · TASKS

## Fase 1 — Color completo

- [x] TASK-01 — `deriveTheme` en `@acc/schema`: escala L + semillas → juego completo de tokens (neutral reproduce los valores actuales)
- [x] TASK-02 — el catálogo de temas sustituye a `PALETTES`; `theme.id` en el app-schema con `palette` como alias
- [x] TASK-03 — `styles.css` pasa a plantilla EJS alimentada por `deriveTheme`; muere `palette.ts`. Gate: golden diff vacío en neutral
- [ ] TASK-04 — el lienzo previsualiza con los mismos tokens derivados
- [ ] TASK-05 — e2e: app generada en un tema no neutro, con superficies y bordes teñidos

## Fase 2 — Forma

- [ ] TASK-06 — `--radius` por tema: schema, emisión y lienzo

## Fase 3 — Tipografía

- [ ] TASK-07 — `--font-sans` por tema, self-hosted en la app emitida
- [ ] TASK-08 — el lienzo carga la misma fuente que la app emitirá

## Fase 4 — Tema de cliente

- [ ] TASK-09 — `theme.seed`: tema completo derivado del color de marca del cliente
- [ ] TASK-10 — e2e: dos apps lado a lado, una de catálogo y otra con semilla
