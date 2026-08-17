# Tareas atómicas: plugin `metrics`

> Cada tarea = un commit atómico en develop. Implementar UNA, commitear, informar, siguiente.
> Gate permanente: los 6 golden en verde antes de cada commit. Aquí NO debe haber
> re-baseline: la app de oro se genera con `--plugins=auth,email` y esta spec no la cambia —
> si el golden se mueve, es que algo del kernel se ha tocado sin querer. Es la señal, no un
> trámite.
> TDD: test fallido primero en cada tarea con lógica.

---

## El plugin y su adapter

- [x] **TASK-01** (`411f2424`): Tests + esqueleto del plugin `metrics` registrado en `PLUGINS`
      (`schema.json` y `tools/slots.json` al día, tests de paridad en verde), con
      `prom-client` declarado y el subárbol emitiendo `prometheus-metrics.ts` (copia del
      canon `libs/infra/metrics-prometheus`) y `MetricsModule` que provee `MetricsPort`.
      Sección `metrics` (`token`, `prefix`, `defaultMetrics`) en config-types y
      config-validation del emitido.

## Exponer sin regalar

- [x] **TASK-02** (`0b21df82`): Tests + `MetricsTokenGuard` (comparación en tiempo constante con
      `timingSafeEqual`, rechaza sin cabecera, con esquema equivocado y con token de otra
      longitud) y `MetricsController` con `GET /metrics` que devuelve `render()` en texto de
      Prometheus. Cubre el fallo cerrado: **sin sección `metrics` la ruta no se registra**.
      Corrección al implementar: el controller SÍ lleva `@Public()` — exime solo del guard
      de sesión (el raspador no puede iniciar sesión); la protección real es el guard de
      token, que va siempre delante. REQUIREMENTS corregido en el mismo commit.

## Medir

- [x] **TASK-03** (`fa758842`): Tests + `MetricsInterceptor` registrado como `APP_INTERCEPTOR`, con las
      cuatro métricas HTTP (total, duración, en curso vía dos contadores, errores). Incluye
      el **candado de cardinalidad**: una petición a `/contracts/<uuid>` etiqueta
      `route="/api/v1/contracts/:id"`, y una ruta no resuelta etiqueta `"unknown"` en vez de
      la URL cruda.
- [x] **TASK-04** (`f5a55eb8`): Candado del plugin: una app sin `--plugins=metrics` no nombra
      `prom-client`, `PrometheusMetrics`, `MetricsModule` ni `/metrics`, ni en ficheros ni en
      `package.json`. Test de composición: `auth,email,metrics` compone (el guard de sesión y
      el de token conviven sobre el mismo controlador).

## Envío a Grafana Cloud (solo Raptor)

- [x] **TASK-05** (`af51ce39`): Servicio de Grafana Alloy en el compose que emite el proveedor raptor, con
      su fichero de configuración (raspado de `backend:3000/metrics` con bearer token →
      `remote_write` a Grafana Cloud) y la sección correspondiente en
      `iac/hetzner/README.md`: alta del stack, dónde sale el token y por qué el flujo va de
      dentro hacia fuera.

## Verificación

- [x] **TASK-06** (`cadbe7f1` + cierre): Verificación fuera del árbol con
      `tools/typecheck-emitted.sh --models=customer,contract,license,project --plugins=auth,email,metrics --infra=raptor --dashboard`:
      `npm install` + `tsc` a **0 errores** fuera del monorepo. Suite del plugin en verde,
      libs del catálogo en verde y 6 golden vacíos SIN re-baseline. Comprobación manual del
      endpoint: arrancar la app emitida, `curl` sin token → 401, con token → texto de
      Prometheus con las cuatro métricas. HECHO y con premio doble. (1) La comprobación
      manual cazó un bug que los tests no veían: el root.module llega al plugin YA
      prettificado en CLI (imports en una línea) y el ancla indentada no casaba — módulo
      importado pero no registrado, /metrics 404; arreglado en `cadbe7f1` con test de la
      forma colapsada. (2) El emitido cuelga el endpoint bajo el prefijo global
      (`/api/metrics`) y config.alloy raspaba `/metrics`; corregido en el commit de cierre.
      Verificado en vivo: 401 sin token y con token malo, 200 + texto Prometheus con token,
      404 con token válido pero sin sección (fallo cerrado), y la etiqueta de ruta con
      tráfico real es la plantilla (`/api/v1/contracts/:id`), no el UUID.

---

## Regla del juego

Implementar **UNA** tarea, commit, esperar aprobación antes de seguir.
Si una tarea parece > 1h o > ~150 líneas, partirla en subtareas antes de empezar.
