# 17 — Bloque galería (tarjetas en vez de tabla)

**Estado:** activa · **Depende de:** 16-bloque-ficha

## 1. Problema

`CardsPage` existe en el app-schema desde la spec 12 pero **no lo consume nadie**:
el lienzo dibuja la galería y la marca «aún no generable». Es la pieza que más
se nota cuando el dato es visual (catálogos, tratamientos, productos): una tabla
de diez columnas no comunica lo que comunican diez tarjetas.

## 2. Alcance v1

Rejilla de tarjetas sobre el MISMO endpoint de listado (sin backend nuevo):

- buscador y paginación reutilizando el servicio del recurso
- tarjeta: título (campo nombre), subtítulo (segundo campo de texto), una
  métrica destacada (primer número, formateado) y hasta dos chips
- clic en la tarjeta → ficha, si el recurso la declara
- estados de carga, error y vacío, con las mismas cadenas del listado

Fuera: reordenar tarjetas, agrupar, imágenes (no hay campo de imagen todavía).

## 3. Decisiones

- **Emisión por declaración**: `gallery` en el modelo, igual que `detail`. Los
  modelos de oro no la declaran → gate intacto.
- **Ruta**: `<ruta>/galeria`, declarada ANTES de `<ruta>/:id` (si no, `:id`
  captura «galeria»). Entrada de menú propia con el título de la vista.
- **Sin endpoint nuevo**: la galería es otra lectura del listado. Si algún día
  pide agregación, eso es la spec de gráficas, no esta.

## 4. User stories (EARS)

- CUANDO el modelo declara `gallery`, EL generador DEBE emitir
  `<plural>-gallery.component.ts` y registrar `<ruta>/galeria`.
- CUANDO el recurso declara ficha, LA tarjeta DEBE navegar a ella.
- CUANDO el lienzo tiene un bloque `cards`, EL estudio DEBE marcar la entidad y
  dejar de etiquetarlo «aún no generable».

## 5. Gate

Golden diff vacío + app generada mostrando la galería en el navegador.
