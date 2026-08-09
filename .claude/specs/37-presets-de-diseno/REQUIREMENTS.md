# Spec 37: Presets de diseño (ranura `design`)

> Decisión de Alfonso (2026-08-09/10) tras una ronda de maquetas: la variedad visual del
> acelerador NO va a venir de una segunda librería de componentes, sino de **presets de diseño
> sobre spartan**. Tres elegidos: `actual` (por defecto), `cabina` (con tema claro y oscuro)
> y `suite`.

## Contexto

Medido generando la misma app con las dos pieles: `ui=spartan` y `ui=material` producían apps
**casi indistinguibles** — 12 ficheros distintos de ~750, y el listado y el diálogo de cliente
**idénticos byte a byte**, porque las pantallas consumen los contratos neutrales del ADR-003.
La piel solo llegaba al widget; nunca al shell, la densidad ni el cromo, que es justo lo que se
percibe al abrir la app. De ahí la ranura nueva: se parametriza lo que sí se ve.

## Qué aporta un preset (y qué no)

- **Sí**: un `app.component.ts` propio (dónde vive la navegación) y un bloque CSS de cromo
  (tokens `--shell-*` / `--banner-*` y densidad de tabla).
- **No**: componentes nuevos. El DataTable, los diálogos y sus 65 tests son los mismos para todos
  los presets — un preset no puede romper una pantalla.

## Criterios de aceptación

- [x] `actual` (por defecto) emite **exactamente** lo de antes: golden con diff vacío
- [x] `cabina` emite su shell y define su cromo en los **dos** temas (no impone modo oscuro)
- [x] `suite` emite banda de marca + pestañas de módulo + miga derivada de la ruta
- [x] Un `--design` desconocido falla antes de escribir un solo fichero
- [x] Las tres compilan fuera del monorepo (`typecheck:emitted` a 0 errores)
- [x] Verificado en navegador con datos reales, no solo compilando

## Fuera de scope

- Retirar la piel material (spec 36, decidida y pendiente de ejecutar)
- Los arquetipos de pantalla explorados y descartados por ahora (expediente maestro-detalle,
  tablero kanban, bitácora de eventos, atlas espacial): no son pieles, son pantallas nuevas.
