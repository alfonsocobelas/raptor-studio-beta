# Spec 32: Widgets analíticos del dashboard (fase 5 · C1v)

---

## Contexto de negocio

El dashboard emitido solo sabe contar («12 contratos»). Los clientes preguntan cosas con
forma: cuántos por estado, cuántos cumplen X, cómo evoluciona el alta por mes. Esta spec
añade tres widgets declarables en el app-schema, todos derivados del modelo.

## Decisión de diseño clave (autónoma — vetable)

**Sin backend nuevo.** Los tres widgets se COMPONEN de conteos sobre el endpoint de listado
existente (`page=1&pageSize=1&filters=[…]` → `total`), que ya soporta `eq/gte/lte` gateado
por ALLOWED_FILTERS:

- `count-by`: N conteos, uno por valor del enum (N ≤ ~6 valores). Barras horizontales.
- `kpi-count`: un conteo con una condición `eq`. Tarjeta KPI con etiqueta propia.
- `series`: 12 conteos por rango de mes sobre un campo fecha. Mini barras verticales.

Alternativa descartada: endpoint `stats` con group-by por motor (puerto nuevo + adapters +
migraciones de tests). Se hará si algún cliente tiene volúmenes donde 6-12 conteos duelan;
para dashboards de negocio de este tamaño, componer conteos es correcto y cuesta un décimo.
Sumas/medias quedan FUERA (no se derivan de conteos): irán con ese endpoint futuro.

## User stories (formato EARS)

- WHEN el app-schema declara `{ kind: 'count-by', resource, field }` sobre un enum filterable
  THEN el dashboard pinta una barra por valor con su conteo y etiqueta legible
- WHEN declara `{ kind: 'kpi-count', resource, field, equals, label }` THEN pinta una tarjeta
  KPI con el total que cumple la condición
- WHEN declara `{ kind: 'series', resource, field }` sobre una fecha filterable THEN pinta
  la evolución mensual de los últimos 12 meses
- IF el campo no existe, no es del tipo esperado o no es `filterable` THEN `defineApp` lo
  rechaza con un error que nombra el widget y el motivo

## Criterios de aceptación

- [ ] Los tres widgets se validan en `defineApp` contra el registro de modelos
- [ ] El dashboard emitido los pinta sin librerías de gráficos, con tokens del tema
- [ ] La app de oro (`golden`) declara los tres y el gate los congela
- [ ] Un app-schema sin widgets nuevos emite exactamente lo mismo que antes
- [ ] Gates: golden 6/6 · typecheck 0 · e2e con captura del dashboard

## Fuera de scope

- Sumas/medias/percentiles (exigen endpoint de agregación; anotado como C2v futuro).
- Donut/tarta (las barras dicen lo mismo y se leen mejor; sin librerías).
- Widgets en el estudio/lienzo (tramo de diseño visual, spec del estudio).
- Rango temporal configurable (v1: últimos 12 meses fijos).
