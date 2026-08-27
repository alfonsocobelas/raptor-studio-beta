# Spec 70: Bloque KPI configurable

## Contexto de negocio

Un panel de negocio se juzga por sus tarjetas de cabecera, y hoy el estudio solo sabe dibujar
una: `kpis` = fila de totales, un número por recurso («1.284 facturas»). Los kinds analíticos
que el generador SÍ emite (`kpi-count`, `count-by`, `series`, spec 32) son **inalcanzables desde
el lienzo**: solo existen si alguien los escribe a mano en un `*.app.ts` — y eso no lo hace un
cliente, lo hago yo. Resultado: todo dashboard salido del estudio dice cuántos registros hay y
nada más.

Esta spec sube al lienzo la tarjeta KPI de verdad: la que responde «cuántos pendientes», «cuántas
altas este mes», «qué porcentaje está cerrado», «vamos un 12% mejor que el mes pasado», «42 de
60». Todas esas preguntas se contestan **contando con filtros**, que es exactamente lo que el
listado ya sabe hacer (`page=1&pageSize=1&filters=[…]` → `total`). Por eso esta spec no toca el
backend: cero endpoints, cero migraciones, cero dominio. La medida real (sumar importes,
promediar) exige un endpoint de agregación y vive en la spec 71.

Un dato que ordena el schema: `kpi-count`, `kpi-ratio`, `kpi-delta` y `kpi-target` NO son cuatro
bloques, son **el mismo bloque con modificadores**. Se unifican en un kind `kpi` con `measure` y
sus modificadores (regla 7: el schema cubre el caso canónico, no un cajón por combinación).

## User stories (formato EARS)

- WHEN el usuario arrastra el bloque «KPI» a una vista y elige un recurso THEN el canvas pinta
  una tarjeta con su número de mockup y el panel del bloque ofrece: **Etiqueta**, **Condición**
  (campo + operador + valor), **Ventana**, **Comparar** y **Objetivo**.
- IF no se declara condición ni ventana THEN el KPI es el total del recurso (equivalente a una
  tarjeta de `kpis`, y sigue siendo un diseño válido).
- WHEN el usuario elige campo y operador en **Condición** THEN los operadores ofrecidos son solo
  los que el tipo del campo admite (`eq`/`neq` en enum y booleano; además `gt/gte/lt/lte` en
  numérico y fecha; además `contains/starts_with/ends_with` en texto) y el valor se pide con el
  control del tipo (select en enum, número, fecha, texto).
- IF el campo elegido no es filtrable en el listado THEN el panel no lo ofrece: contar por un
  campo que la API no filtra es un KPI que devolvería el total entero, silenciosamente mal.
- WHEN el usuario elige una **Ventana** (`siempre` | `hoy` | `esta semana` | `este mes` | `este
  trimestre` | `este año` | `últimos N días`) THEN el panel exige un campo fecha del recurso
  sobre el que aplicarla, y el conteo se acota a ese rango.
- IF la ventana no es `siempre` THEN se puede activar **Comparar con el periodo anterior**, y la
  tarjeta muestra la variación (▲/▼ y porcentaje) contra la ventana inmediatamente anterior de
  la misma longitud.
- IF el periodo anterior cuenta 0 THEN la tarjeta no muestra «+∞%»: muestra la variación
  absoluta («+7») y no divide por cero.
- WHEN se activa **Ratio** THEN la tarjeta muestra un porcentaje: el conteo condicionado sobre el
  conteo total del recurso bajo la misma ventana (numerador y denominador comparables por
  construcción, nunca dos condiciones sueltas que el usuario tenga que hacer casar).
- WHEN se fija un **Objetivo** numérico THEN la tarjeta muestra «{valor} de {objetivo}» con barra
  de progreso, saturada al 100% visualmente aunque el valor lo supere.
- IF se activan Ratio y Objetivo a la vez THEN el panel lo impide: son dos lecturas del mismo
  número y la tarjeta solo tiene un sitio para la barra.
- WHEN el usuario arrastra el bloque «Top N» a una vista y elige recurso, campo de orden y N
  THEN el canvas pinta una lista corta ordenada («Top 5 pedidos por importe») y la app emitida la
  resuelve con UNA petición al listado (`pageSize=N`, orden descendente por ese campo).
- IF el recurso no tiene ningún campo ordenable en el listado THEN «Top N» se marca «Diseño aún
  no generable» y no cruza al app-schema.
- WHEN se genera la app THEN cada bloque `kpi` es una tarjeta del panel emitido, con tantas
  peticiones como conceptos necesite (1 conteo simple, 2 con ratio, 2 con comparación, 3 con
  ratio + comparación) y ninguna más.
- WHILE el panel emitido carga THEN todas las tarjetas comparten el estado de carga y error que
  ya usa el dashboard: nada de tarjetas parpadeando por separado.

## Criterios de aceptación

- [ ] App-schema: kind `kpi` unificado (`resource`, `label`, `measure: 'count'`, `condition?`,
      `window?`, `ratio?`, `compare?`, `target?`, `width?`) con validación en `define-app`;
      `kpi-count` se sigue aceptando al leer y se normaliza a `kpi` (los `*.app.ts` de oro y los
      diseños ya guardados no se rompen).
- [ ] App-schema: kind `top-n` (`resource`, `field`, `n`, `label?`, `width?`) validado.
- [ ] Estudio: bloques «KPI» y «Top N» en la paleta con icono, preview fiel en el lienzo y
      `GENERABLE_BLOCKS` actualizado; generabilidad por datos (campo filtrable / ordenable).
- [ ] Estudio: panel `kpi-config` siguiendo el patrón de `calendar-config`/`kanban-config`, con
      los operadores y controles filtrados por tipo de campo.
- [ ] Frontera: `design-to-app` cruza ambos bloques con su config completa; descarte con motivo
      cuando no son generables.
- [ ] Generador: un solo helper de conteo parametrizado (operador + rango) sustituye a
      `_countWhere`; ratio, delta y objetivo se calculan en `generator.ts`, no en la plantilla
      (regla 8). Typecheck del emitido a 0 errores.
- [ ] Ninguna petición de más: el conteo de peticiones por tarjeta está cubierto por test del
      spec emitido (`toHaveBeenCalledTimes` + los params exactos).
- [ ] Golden: un modelo de oro estrena `kpi` con condición + ventana + comparación y otro
      estrena `top-n`; `/golden-diff` limpio en el resto.
- [ ] Suites del estudio y del plugin en verde; `npm run typecheck` limpio.

## Referencias del proyecto de referencia

- Receta BlockKind end-to-end: `.claude/specs/59-bloque-calendario/`, `.claude/specs/61-bloque-kanban/`.
- Widgets analíticos actuales (a los que esta spec sustituye): `.claude/specs/32-*`, y el código
  en `libs/generators/src/generators/app/app.ts` (`renderAnalyticServiceHelpers`, `renderAnalyticCard`).
- Operadores disponibles: `tools/golden-fixtures/app/libs/backend/src/contexts/shared/domain/query/filter-operator.ts`.
- Panel de configuración por bloque: `apps/studio/libs/frontend/src/domains/studio/design/calendar-config.component.ts`.

## Reglas de negocio aplicables

- **Cero backend nuevo.** Todo sale del listado que ya existe. Si un KPI no se puede contar con
  los operadores actuales, no entra en esta spec: entra en la 71.
- **Configuración en tiempo de diseño, no en runtime** (decisión 2026-08-27). El KPI lo define
  quien dibuja la app en el estudio y se emite como código. El usuario final no crea KPIs: eso
  exigiría almacén de definiciones y un constructor de consultas validado, y queda en backlog.
- «Generar, no interpretar»: la tarjeta cubre el caso canónico. Un KPI con dos condiciones
  cruzadas o una fórmula se edita a mano sobre el código emitido.

## Fuera de scope (deliberado)

- **Sparkline dentro de la tarjeta**: son 12 peticiones por tarjeta con el truco del listado.
  Entra en la spec 71 con `bucket`, en una sola petición.
- Medidas distintas de conteo (suma, media, máximo, mínimo, distintos) y sus gráficos
  (`sum-by`, `series-sum`): spec 71.
- Traer `count-by` y `series` al lienzo del estudio (siguen siendo solo de `*.app.ts`); su coste
  en peticiones lo arregla la 71 y es mejor subirlos al lienzo ya arreglados.
- Más de una condición por KPI, y condiciones sobre campos de otro recurso.
- KPIs de tiempo de ciclo («días medios en estado X»): la máquina de estados no persiste
  histórico de transiciones, no hay dato que medir. Backlog aparte.
- Umbrales de color (verde/ámbar/rojo) y alertas.
