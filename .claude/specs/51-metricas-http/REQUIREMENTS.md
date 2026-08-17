# Spec: Métricas HTTP (plugin `metrics`)

## Contexto de negocio

El acelerador emite apps con logs (stdout + Loki/CloudWatch/App Insights según proveedor) y
con seguimiento de errores (Sentry en Raptor Cloud), pero **cero métricas**: comprobado, no
hay ni una referencia a métricas en todo el árbol generado. El catálogo tiene el puerto
`MetricsPort` y su adapter `metrics-prometheus` (con `prom-client` y tests) desde la fase 2,
sin ningún consumidor.

Logs y métricas responden preguntas distintas. Los logs dicen *qué pasó en esta petición*;
las métricas dicen *cómo va el sistema*: percentil 95 de latencia por endpoint, tasa de
5xx, peticiones en curso. Contar líneas de log en LogQL aproxima lo segundo, pero es caro y
lento — para eso existen las series temporales, y son la base de las alertas por tendencia.

Decisión de encuadre (brainstorming 2026-08-17, tras cerrar la spec 50): esto **no es un
apéndice de Raptor Cloud**. El agujero es idéntico en Azure y AWS, y el instrumentador no
puede vivir dentro de la ranura de un proveedor. Va como **plugin aditivo `metrics`**, igual
que `email`: transversal, opcional, y quien no lo activa no carga `prom-client`.

## User stories (formato EARS)

- WHEN se genera una app con `--plugins=metrics` THEN el backend emite el adapter de
  Prometheus tras `MetricsPort`, su módulo y el endpoint de exposición.
- WHILE la app atiende peticiones HTTP THEN cada una incrementa el contador de peticiones y
  observa su duración en el histograma, etiquetadas por método, **plantilla de ruta** y
  código de estado.
- IF la etiqueta de ruta llevara el identificador concreto (`/contracts/9f3e…`) THEN la
  cardinalidad crecería sin límite y tumbaría a Prometheus; por eso se etiqueta con la
  plantilla (`/contracts/:id`), nunca con la URL cruda.
- IF la sección `metrics` de config no está presente THEN el endpoint **no se registra** y la
  app no expone nada (fallo cerrado).
- IF la sección `metrics` está presente THEN el endpoint exige el token declarado en ella, y
  **nunca** lleva `@Public()`.
- WHEN se genera una app sin `--plugins=metrics` THEN no aparece `prom-client` ni ninguna
  clase de métricas en el emitido.
- WHEN se despliega una app raptor con métricas THEN un contenedor de Grafana Alloy en el
  compose raspa el endpoint en localhost y hace `remote_write` a Grafana Cloud.

## Criterios de aceptación

- [ ] Plugin `metrics` registrado (aparece en `schema.json`, `tools/slots.json` y el wizard),
      con `prom-client` declarado como dependencia del plugin, no del kernel.
- [ ] El emitido lleva el adapter de Prometheus (mismo código que el canon
      `libs/infra/metrics-prometheus`), `MetricsModule` y `MetricsController`.
- [ ] Sección `metrics` en config-types y config-validation del emitido: `token` (obligatorio
      si la sección existe), `prefix` y `defaultMetrics` opcionales.
- [ ] El endpoint responde el formato de exposición de Prometheus solo con el token correcto;
      sin sección de config no existe la ruta (404), y sin token válido responde 401.
- [ ] `LoggerInterceptor` (o un interceptor hermano) instrumenta las cuatro métricas HTTP:
      peticiones totales, duración, en curso y errores por ruta y estado.
- [ ] Test de cardinalidad: la etiqueta de ruta de una petición a `/contracts/<uuid>` es
      `/contracts/:id`, no la URL con el identificador.
- [ ] Candado: una app sin el plugin no nombra `prom-client`, `PrometheusMetrics` ni
      `MetricsModule`.
- [ ] `iac/hetzner`: servicio de Grafana Alloy documentado en el README con su configuración
      de raspado y `remote_write`.
- [ ] Los 6 gates de oro en verde **sin re-baseline** — y esta vez es cierto por construcción:
      la app de oro se genera con `--plugins=auth,email`, y esta spec no la cambia.
- [ ] Verificación fuera del árbol: app con `--plugins=auth,email,metrics` compila con 0
      errores fuera del monorepo.

## Referencias del proyecto

- `libs/infra/metrics-prometheus/src/lib/prometheus-metrics.ts` — adapter ya escrito (canon).
- `libs/infra/ports/src/lib/metrics.port.ts` — el puerto.
- `libs/generators/src/generators/app/plugins/email.plugin.ts` — patrón de plugin aditivo con
  dependencia declarada y carga por sección de config.
- `tools/golden-fixtures/app/libs/backend/src/contexts/shared/infrastructure/interceptors/logger.interceptor.ts`
  — ya envuelve cada petición y ya mide la duración: es el sitio del instrumentador.
- `tools/golden-fixtures/app/libs/backend/src/contexts/shared/infrastructure/health/health.controller.ts`
  — precedente de endpoint de infraestructura, y ejemplo de `@Public()` (que aquí NO se usa).
- `.claude/specs/50-infra-raptor-cloud/` — la spec hermana; de ahí sale la lección de las
  etiquetas de baja cardinalidad.

## Reglas de negocio aplicables

- Regla de los dos: `MetricsPort` ya existe con un adapter; esta spec **no abre abstracción
  nueva**, solo le da su primer consumidor.
- Plantillas tontas, lógica en el plugin.
- Seguridad proporcional: la exposición de Prometheus filtra rutas, volúmenes y nombres
  internos. No es información pública.
- El emitido debe compilar fuera del monorepo con sus dependencias declaradas.

## Decisiones ya cerradas

1. **Plugin aditivo, no ranura ni kernel.** Ranura implicaría elegir *un* proveedor de
   métricas (no hay dos aún); kernel forzaría `prom-client` en toda app generada. Plugin es
   lo que ya se hizo con `email` y encaja sin inventar nada.
2. **El endpoint se protege con token, no con sesión.** Descubrimiento que fuerza el diseño:
   el raspador (Alloy) no puede iniciar sesión, así que el guard de sesión del plugin `auth`
   no le sirve — y además hay apps generadas *sin* `auth`, donde no hay ningún guard global.
   Por eso el token de la sección de config es el mecanismo primario, y el endpoint nunca
   lleva `@Public()`. Sin sección, no hay ruta: fallo cerrado.
3. **Etiqueta de ruta = plantilla, no URL.** `prom-client` fija las etiquetas de una métrica
   en su primera llamada, y una URL con identificadores genera series infinitas. Es la misma
   lección que las etiquetas de Loki en la spec 50, y va con test.
4. **Solo métricas HTTP.** Cuatro, las que sirven para el 90% de los casos. Las de negocio se
   añaden a mano cuando un cliente pida una concreta: inventarlas por adelantado es
   especular sobre lo que nadie ha pedido.
5. **El envío a un SaaS solo se resuelve para Raptor** (Alloy → Grafana Cloud). Azure tiene
   Managed Prometheus y AWS tiene AMP: son bestias distintas y cada una merece su propia
   tarea cuando haga falta. Mientras tanto, el endpoint es raspable por cualquier Prometheus.

## Fuera de scope (deliberado)

- **Métricas de negocio** (contratos creados, exportaciones lanzadas…): a mano, sobre el
  código generado.
- **Trazas distribuidas**: siguen fuera, como en las specs 47 y 50 (una app, un backend).
- **Envío a Azure Managed Prometheus / AWS AMP**: tarea propia cuando se pida.
- **Dashboards de Grafana provisionados**: se montan en la UI; versionarlos es otra spec.
- **Alertas**: se definen en Grafana Cloud, no en el emitido.
- **Métricas del frontend** (web vitals): otro mundo, otra spec.
