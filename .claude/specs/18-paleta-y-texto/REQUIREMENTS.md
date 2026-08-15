# 18 — Paleta de la app y bloque de texto

**Estado:** activa · **Depende de:** 17-bloque-galeria

## 1. Paleta (observación 9 del roadmap)

Elegir «Océano» en el lienzo hoy NO cambia la app generada: la previsualización
y el artefacto no se hablan. La paleta debe viajar en el app-schema y el
generador debe emitir sus tokens.

- `theme: { palette }` en `AppDefinition`, con un catálogo CERRADO de paletas
  compartido entre estudio y generador (vive en `@raptor/schema`, que es el
  contrato común). Sin colores libres: el lienzo no es un editor de temas.
- El generador reescribe `--primary`, `--primary-foreground` y `--ring` en
  `styles.css` (bloque claro y bloque oscuro). El resto de tokens no se tocan:
  una paleta tiñe la acción, no rehace el tema.
- Por defecto `neutral`, que es exactamente lo que se emite hoy → sin paleta
  declarada, diff de oro intacto.

## 2. Bloque de texto

Realidad que conviene decir clara: el generador emite **un componente por
pantalla**, no compone bloques. Un bloque de texto no puede insertarse «entre»
la tabla y los KPIs sin construir antes una capa de composición de página, que
es un cambio grande y no es esta spec.

Lo que sí cabe hoy, y es honesto: **el texto de una vista se emite como su
entradilla** — el párrafo bajo el título de la pantalla, que ya existe
(`ui.subtitle`). Si la vista tiene tabla o galería, su texto la encabeza.

- Una vista SOLO de texto sigue sin ser una pantalla: no se genera y el lienzo
  la marca «aún no generable». Sin trampas.

## 3. User stories (EARS)

- CUANDO el app-schema declara `theme.palette`, EL generador DEBE emitir sus
  tokens en styles.css, en claro y en oscuro.
- CUANDO el usuario elige una paleta en el lienzo, EL estudio DEBE enviarla al
  generar (lo que ves es lo que se genera).
- CUANDO una vista con tabla o galería tiene un bloque de texto, LA pantalla
  emitida DEBE usar ese texto como entradilla.

## 4. Gate

Golden diff vacío sin paleta declarada + app generada en Océano con la
entradilla visible.
