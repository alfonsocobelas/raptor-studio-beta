# 22 — Tipo enum en el diseño

**Estado:** activa · **Depende de:** 15 (relaciones, misma forma)

## 1. Problema

El diseño no sabe declarar un conjunto cerrado de valores. `DraftFieldType` es
`string|text|number|integer|boolean|date|ref`, así que «estado: disponible /
reservada / vendida» sale como **texto libre**: sin validación, sin colores en la
tabla y sin desplegable en el formulario.

El resource-schema SÍ lo soporta y los cuatro módulos de oro lo usan:
`vo.values` (union de tipos + VALUES), `table.type: 'badge'` con `badgeMap`, y
`form.control: 'select'` con `options`/`optionsType`. El canon de emisión está
probado por el gate — **falta el tramo del diseño**, exactamente como le faltaba
a las relaciones antes de la spec 15.

## 2. Alcance

- `DraftField` admite `type: 'enum'` con `values: { value, label }[]`.
- `draftToResource` expande al par canónico: VO con `values`, columna
  `type: 'badge'` con su `badgeMap`, y `form.control: 'select'` con las opciones.
- Colores de badge deterministas: se asignan por posición desde una paleta fija
  de variantes, no al azar ni por nombre.
- El chat los propone cuando el dominio lo pide («estado», «prioridad», «tipo»).
- El editor de columna del lienzo permite declarar valores.
- El mockup del lienzo pinta los badges con esos colores.

## 3. Decisiones

**Valores con etiqueta.** `{ value: 'disponible', label: 'Disponible' }`: el
valor viaja a la base y la etiqueta a la pantalla. Un solo string obligaría a
elegir entre una base fea o una UI fea.

**Sin i18n todavía.** La etiqueta es una sola cadena; traducir es otro problema.

**El primer valor es el de por defecto** en el formulario, salvo que se declare
otro. Es la convención que ya usan los modelos de oro.

## 4. Fuera

- Enums compartidos entre entidades (cada uno declara los suyos).
- Reordenar o renombrar valores sobre datos existentes (migración de datos).

## 5. Gate

Golden diff vacío + app generada donde el listado muestra badges de color, el
formulario un desplegable tipado y la base rechaza un valor fuera del conjunto.
