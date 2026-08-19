# Spec: El panel es una secuencia de bloques

> Brainstorming del 2026-08-19 con Alfonso, a raíz de revisar la spec 52 en la demo `taller`:
> «el panel debe tener la capacidad de añadir tablas… la cuestión es preguntarse qué debe ir en un
> panel y sobre todo la flexibilidad de poder añadir componentes que tengan sentido, ya que este
> desarrollo condiciona cómo se verán las tablas en panel».

---

## Contexto de negocio

El ADR-009 dice que una vista es una **secuencia de bloques**. Todas lo cumplen menos el panel: en el
app-schema es `{ widgets[], tables[] }` y en el emitido su orden está clavado en la plantilla
(rejilla de KPIs → secciones analíticas → listados → hueco `@ai`). El lienzo, en cambio, ya lo trata
como secuencia — por eso se puede soltar una tabla ahí.

Esa asimetría es la causa, no la anécdota, de los dos defectos que la demo `taller` destapó: la tabla
dibujada en el panel se emitía en otra pantalla (y se llevaba el título de la vista siguiente), y el
ancho `half` que el lienzo pinta el panel lo ignora. Cada capacidad nueva del panel ha exigido su
propio cajón en el contrato — `widgets` primero, `tables` después (spec 52) — y la siguiente exigiría
otro. Esta spec cierra el modelo: **el panel deja de ser especial**.

Es un refactor de contrato **sin capacidades nuevas**, salvo una mentira que se arregla de paso (el
ancho). Las capacidades que lo motivan —pestañas maestro + tabla relacionada, lista con propósito—
son specs propias que ya no tendrán que tocar el modelo.

## Decisiones cerradas en el brainstorming (2026-08-19)

1. **Todos son bloques.** `widgets` se retira: los tres analíticos pasan a bloques y `kpi-total` se
   disuelve en un bloque `metrics` con varios recursos. `tables` (spec 52) se retira también.
2. **Primero solo el modelo**, sin pestañas ni listas top-N: mezclar refactor y capacidad dejaría un
   gate que no sabe decir cuál de los dos falló.
3. **La métrica es una fila, no un bloque por tarjeta**: `metrics.resources[]`, que es lo que el
   lienzo ya dibuja. Intercalar una métrica entre gráficos se verá cuando alguien lo pida.
4. **El panel respeta el ancho de sus bloques**: `half` consecutivos en dos columnas. Hoy el lienzo
   lo pinta y el emitido lo ignora, así que esto arregla una divergencia viva.
5. **Ruptura seca, sin alias deprecado**: los seis consumidores están en este repo y el gate de oro
   vacío prueba la equivalencia.

## User stories (formato EARS)

### Contrato

- WHEN una página `dashboard` declara `blocks` THEN `defineApp` valida forma: al menos un bloque,
  kebab-case en todo recurso, `metrics` con al menos uno, `field` en `count-by`/`series`, `field` +
  `equals` + `label` en `kpi-count`, `width` solo `'full'|'half'`, y sin duplicados exactos
  (`kind:recurso:campo`) en el panel
- IF una página `dashboard` declara `widgets` o `tables` THEN ya no compila: el contrato solo conoce
  `blocks` (ruptura deliberada, decisión 5)
- WHILE se valida el panel THEN la EXISTENCIA del recurso sigue siendo cosa de la frontera, nunca de
  `defineApp` — la capa no se mueve

### Composición y frontera

- WHEN se compone una app con panel THEN la composición produce UNA lista ordenada de bloques
  resueltos (`dashboardBlocks`), con su ancho resuelto a `'full'` por defecto, en vez de
  `kpiModels` + `analytics` + `dashboardTables`
- WHILE se resuelven los bloques analíticos THEN se conservan intactas las validaciones de la spec 32
  (campo real y `filterable`, tipo fecha para `series`, valores del enum para `count-by`)
- WHEN el lienzo traduce una vista con `kpis` y/o `table` THEN emite una página `dashboard` con esos
  bloques en el orden dibujado y con su ancho
- IF una tabla viaja dentro del panel THEN no emite además su pantalla; IF la misma tabla está en
  OTRA vista THEN esa vista sí emite su pantalla con su título (se conserva la spec 52)
- IF un bloque que el panel no admite (`fields`, `attachments`, `form`, `cards`, `text`) aparece en la
  vista del panel THEN no cruza la frontera, como hoy

### Emitido

- WHEN el panel se emite THEN recorre sus bloques EN ORDEN: `metrics` → rejilla de tarjetas
  (columnas `min(max(n,2),4)`), analíticos → su sección, `table` → el listado en modo embebido
- WHEN dos o más bloques `half` van seguidos THEN se emiten en una fila de dos columnas
- IF un grupo de `half` consecutivos tiene UN solo bloque —esté al final o entre dos `full`— THEN ese
  bloque se emite a lo ancho (nunca media pantalla vacía)
- WHILE se emite THEN el servicio del panel conserva su forma: un total por recurso con métrica
  (deduplicado, en orden de primera aparición) y los helpers de los kinds presentes
- WHEN se emite un panel de un diseño que NO usa `half` THEN el fichero sale **byte a byte idéntico**
  al de hoy — es el criterio de aceptación del refactor

## Fuera de alcance

- Pestañas maestro + tabla relacionada (el caso que motivó el debate) y lista con propósito (top N):
  specs propias encima de este modelo.
- Declarar bloques analíticos desde el lienzo: hoy solo llegan de app-schemas escritos a mano; será
  una spec de estudio y ya no tocará el contrato.
- Unificar TODAS las páginas en `{ kind: 'view', blocks }`: destino natural el día que las plantillas
  de los arquetipos converjan, hoy prometería combinaciones que nadie emite (regla 7).
- Fichas, galerías y formularios dentro del panel.

## Dependencias

- Spec 32 (widgets analíticos) y spec 52 (la tabla dentro del panel, cuyo cajón `tables` se retira
  aquí). ROADMAP 25.
