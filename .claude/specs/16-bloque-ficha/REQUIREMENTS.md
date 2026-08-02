# 16 — Bloque ficha (detalle de un registro)

**Estado:** activa
**Depende de:** 13-studio-canvas, 14-attachments-component

## 1. Problema

El listado emitido YA ofrece la acción «ver» y navega a `/<ruta>/:id`
(`__plural__-list.component.ts.template`, `features.view`, por defecto `true`),
pero **esa ruta no existe**: no hay componente de detalle ni entrada en
`app.routes.ts`. El botón está muerto en toda app generada.

En el lienzo, el bloque «Datos» (`fields`) dibuja una ficha pero está marcado
«aún no generable». Cerrar el hueco es la pieza de más valor: convierte el
listado en una navegación real y da sitio natural a los adjuntos por registro.

## 2. Alcance de la v1 (y por qué NO es el canon)

El canon congelado (`tools/golden-fixtures/customers/frontend/customer-detail.component.ts`,
303 líneas + 344 de HTML) muestra pestañas de contratos y proyectos, sub-entidad
de contactos y KPIs de hijos: **todo eso depende de RELACIONES**, que el
resource-schema no sabe declarar todavía (spec 15). Clonarlo es imposible sin
inventar.

La v1 emite lo que sí se deriva del schema de una entidad:

- cabecera: título (campo nombre), badge de estado si hay un enum, y acciones
  Editar / Eliminar reutilizando el diálogo y la confirmación del listado
- tarjeta de datos: todos los campos con su label y su formato (fecha, dinero,
  booleano) — el mismo formateo que ya usa la tabla
- bloque de adjuntos del registro si la entidad los tiene (spec 14)
- estados de carga y de error, y 404 si el id no existe

Fuera de la v1 (van a v2, tras spec 15): pestañas de entidades hijas, KPIs
derivados de relaciones, acciones de dominio a medida.

## 3. Decisión de emisión (protege el gate de oro)

La ficha se emite **solo si el modelo declara `detail: true`** (misma mecánica
que `attachments`). Los 4 modelos de oro NO lo declaran, así que el diff sigue
vacío y el canon de 647 líneas no se abandona por la puerta de atrás: cuando la
v2 se acerque a él, se re-baseliniza deliberadamente y con OK de Alfonso.

## 4. User stories (EARS)

- CUANDO el modelo declara `detail: true`, EL generador DEBE emitir
  `<fileName>-detail.component.ts` y su test.
- CUANDO una app incluye un recurso con `detail: true`, EL generador DEBE
  registrar la ruta `<ruta>/:id` en `app.routes.ts` sin añadir entrada de menú
  (la ficha es drill-down, no navegación de primer nivel).
- CUANDO el usuario pulsa «ver» en el listado, LA app DEBE mostrar la ficha.
- CUANDO la entidad tiene adjuntos, LA ficha DEBE mostrar su bloque de ficheros
  acotado a ese registro.
- CUANDO el lienzo tiene un bloque `fields`, EL estudio DEBE marcar la entidad
  con `detail: true` y dejar de etiquetarlo «aún no generable».

## 5. Gate

`npm run golden:diff` vacío en las 4 entidades + app, y la app de demo
(clínica dental) navegando de la tabla a la ficha en el navegador.
