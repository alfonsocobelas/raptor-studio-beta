# Diseño técnico: plugin `metrics`

## Mapa

```
   petición HTTP
        │
        ▼
  ┌───────────────────────┐   incrementCounter / observeHistogram
  │ MetricsInterceptor    │──────────────────┐
  │ (hermano del logger)  │                  ▼
  └───────────────────────┘        ┌──────────────────┐
                                   │ MetricsPort      │  (puerto del catálogo, ya existía)
  ┌───────────────────────┐        │   ▲              │
  │ MetricsController     │─render()│   └ PrometheusMetricsprom-client)
  │ GET /metrics (token)  │        └──────────────────┘
  └───────────────────────┘
        ▲
        │ raspa con Bearer
  ┌─────┴──────────────┐   remote_write   ┌──────────────┐
  │ Grafana Alloy      │─────────────────>│ Grafana Cloud│
  │ (contenedor del VPS)│                  └──────────────┘
  └────────────────────┘
```

Todo el código nuevo es cableado del emitido: el adapter y el puerto existen y están probados.

## El plugin

`libs/generators/src/generators/app/plugins/metrics.plugin.ts`, calcado del de email:

```ts
export const metricsPlugin = definePlugin({
  name: 'metrics',
  description: 'Métricas HTTP en formato Prometheus tras MetricsPort',
  assets: 'assets-metrics',
  dependencies: { 'prom-client': '15.1.3' },   // misma versión que el canon del catálogo

  apply(tree, context) {
    addMetricsConfigSection(tree, context)   // token, prefix, defaultMetrics
    registerMetricsModule(tree, context)     // en el root module, junto a LoggerModule
    instrumentRequests(tree, context)        // el interceptor hermano del logger
  }
})
```

## Sección de config y fallo cerrado

```jsonc
"metrics": {
  "token": "vault.metrics.token",   // obligatorio si la sección existe
  "prefix": "app_",                 // opcional
  "defaultMetrics": true            // event loop, heap, GC de Node
}
```

Sin la sección, `MetricsModule` no registra el controlador: la ruta **no existe** (404), no es
que exista sin protección. Es la diferencia entre fallar cerrado y fallar abierto, y aquí
importa porque la exposición de Prometheus enseña rutas, volúmenes y nombres internos.

## Por qué token y no sesión

El descubrimiento que ordena el diseño: **el raspador no puede iniciar sesión**. Alloy (o
cualquier Prometheus) hace una petición HTTP sin cookie de sesión, así que el `SessionGuard`
global que instala el plugin `auth` lo rechazaría siempre. Y hay apps generadas *sin* `auth`,
donde no existe ningún guard global y el endpoint quedaría abierto de par en par.

De ahí un guard propio y diminuto, que compara el `Authorization: Bearer <token>` con el de
la config en tiempo constante:

```ts
@Injectable()
export class MetricsTokenGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const expected = this.config.get<string>('metrics.token')
    const provided = header(context).replace(/^Bearer /, '')
    // timingSafeEqual sobre buffers del mismo tamaño: comparar con === filtra
    // la longitud y los primeros bytes coincidentes por el tiempo de respuesta
    return sameLength(provided, expected) && timingSafeEqual(buf(provided), buf(expected))
  }
}
```

El controlador **nunca** lleva `@Public()`: con `auth` activo suma el guard de sesión al de
token, y sin `auth` el de token es el único, que es justo lo que se necesita.

## Las cuatro métricas

| Métrica                          | Tipo      | Etiquetas                    |
| -------------------------------- | --------- | ---------------------------- |
| `http_requests_total`            | contador  | `method`, `route`, `status`   |
| `http_request_duration_seconds`  | histograma| `method`, `route`             |
| `http_requests_in_flight`        | contador¹ | `method`, `route`             |
| `http_request_errors_total`      | contador  | `method`, `route`, `status`   |

¹ El puerto solo expone contadores e histogramas; "en curso" se lleva con dos contadores
(entradas y salidas) y se resta en la consulta. Añadir un gauge al puerto por esto sería
abrir abstracción para un caso — si aparece un segundo consumidor de gauges, se abre entonces
(regla de los dos).

## La trampa de la cardinalidad

`prom-client` fija las etiquetas de una métrica en su **primera** llamada, y Prometheus crea
una serie por combinación de valores. Etiquetar con la URL cruda significa una serie por cada
identificador que pase por la API:

```
   MAL   route="/api/v1/contracts/9f3e7a12-…"   → una serie nueva por contrato
   BIEN  route="/api/v1/contracts/:id"          → una serie por endpoint
```

En Express (el adaptador de Nest por defecto) la plantilla está en `request.route?.path`. El
instrumentador la usa y cae a `'unknown'` si no hay ruta resuelta (un 404, por ejemplo), que
es precisamente el caso en que la URL cruda sería veneno: un escáner de puertos generaría
miles de series. Va con test.

## Interceptor propio, no el del logger

Aunque `LoggerInterceptor` ya mide la duración, el instrumentador va en un
`MetricsInterceptor` hermano, registrado también como `APP_INTERCEPTOR`:

- El plugin es opcional: meter métricas dentro del interceptor del logger obligaría a
  parchear un fichero del kernel con condicionales, y ese fichero está congelado en la
  fixture de oro (tocarlo movería el golden de toda app, con o sin el plugin).
- Responsabilidades separadas: uno registra, otro mide. Que ambos midan el tiempo es una
  duplicación de tres líneas, mucho más barata que acoplarlos.

## Alloy en el VPS (solo Raptor)

Un servicio más en el compose, con su configuración:

```
  prometheus.scrape "app" {
    targets    = [{ __address__ = "backend:3000", __metrics_path__ = "/metrics" }]
    forward_to = [prometheus.remote_write.grafana.receiver]
    bearer_token = env("METRICS_TOKEN")
  }
```

Grafana Cloud no puede alcanzar el VPS detrás del firewall —ni conviene abrirlo—, así que el
sentido del flujo es de dentro hacia fuera: Alloy raspa en la red interna del compose y
empuja. Se documenta en `iac/hetzner/README.md` junto al resto de altas manuales; el compose
del emitido no se toca en esta spec más que para añadir el servicio.

## Decisiones técnicas

- **Plugin aditivo** (`--plugins=metrics`), no ranura ni kernel: nadie carga `prom-client`
  sin pedirlo.
- **Fallo cerrado**: sin sección de config no hay ruta.
- **Comparación del token en tiempo constante**: un `===` filtra información por el tiempo de
  respuesta. Coste: tres líneas.
- **Etiqueta de ruta con plantilla**, con test que lo fija.
- **Sin gauge en el puerto** hasta que haya un segundo caso.

## Riesgos identificados

- **Cardinalidad** — mitigación: plantilla de ruta, `'unknown'` como red de seguridad, test.
- **El endpoint expuesto por error** — mitigación: fallo cerrado y nunca `@Public()`.
- **Duplicar la medición del tiempo con el logger** — aceptado a cambio de no acoplar el
  plugin al kernel ni mover la fixture de oro.
- **`request.route` es específico de Express**: si algún día el emitido pasa a Fastify, esa
  línea cambia. Está concentrada en una función del interceptor.
