# Spec: studio-canvas — rehacer la experiencia del estudio (corrección de rumbo 2026-07-31)

## Contexto

Feedback de Alfonso sobre las fases B-F: la esencia era un **lienzo en blanco** tipo
Figma/Excalidraw con **chat a la derecha** (Claude Design) y una **barra de componentes
genéricos** (tabla, KPI, página) — donde soltar una tabla CREA una entidad nueva (con sus
columnas), no compone entidades de demo. Lo construido era un editor de composición sobre la
app boutique con la paleta contaminada por los modelos de demo. Decisiones confirmadas:
arranque en blanco total · edición de campos por chat + inspector básico · componentes de la
barra = tabla/KPI/página (solo lo que el generador emite).

## User stories (EARS)

- WHEN abro el estudio THEN veo un lienzo vacío (sin páginas, sin entidades, sin NINGÚN
  contenido de demos) con la barra de componentes arriba y el chat a la derecha.
- WHEN añado una «Tabla» THEN nombro la entidad y aparece su tabla con columnas por defecto
  y datos de ejemplo; queda creada como recurso NUEVO del diseño (draft resource-schema).
- WHEN selecciono una tabla THEN un inspector básico permite añadir/quitar/renombrar
  columnas y cambiar su tipo (string/number/integer/boolean/date/text).
- WHEN añado un «KPI» THEN elijo entidad y aparece la tarjeta en el dashboard (se crea si falta).
- WHEN escribo en el chat «una app de flotas con vehículos (matrícula, marca, fecha alta) y
  conductores» THEN la IA crea las entidades con sus campos y las páginas, y el lienzo se pinta.
- WHEN genero THEN el JSON incluye app-schema + resource-schemas nuevos y el generador
  (`--appFile`) los consume y emite la app real.
- WHILE diseño THEN hover→cruz para borrar sigue funcionando sobre tablas, KPIs y páginas.

## Criterios de aceptación

- [ ] DraftResource (entidad + campos tipados) + derivación a ResourceDefinition válida.
- [ ] Store: recursos draft + app draft; arranque vacío; catálogo de demos FUERA del estudio.
- [ ] UI: barra de componentes, pestañas de página, lienzo con preview real, inspector, chat.
- [ ] Estudio a pantalla completa sin shell/nav de la demo boutique.
- [ ] Chat (fake + Anthropic) crea/edita recursos y composición; gate ampliado.
- [ ] `--appFile` acepta `resources[]` embebidos; e2e: entidad nueva → app generada.

## Fuera de scope

- Posicionamiento libre x/y de componentes (el layout emitido es el del generador).
- Relaciones entre entidades, validaciones avanzadas, VOs a medida (inspector básico v1).
- Botón/tarjeta/gráfico como componentes (cuando el generador los emita).
