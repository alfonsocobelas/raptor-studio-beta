# Spec 59: Bloque Calendario (componente 22E)

## Contexto de negocio

Cualquier tabla con un campo fecha se puede ver como calendario: cada registro es una **tira**
en el día que marca su campo fecha (mock 22E, `docs/style/Captura de pantalla 2026-08-23 a las 21.44.44.png`).
Estaba en el banco de ideas del ROADMAP («calendario») y la captura de Alfonso cierra la
experiencia visual: cabecera con título y navegación de mes (`‹ SEPT 2026 ›`), rejilla mensual
LUN→DOM con el día de hoy resaltado, tiras con la etiqueta del registro y color por estado,
pie con el origen (`PEDIDOS · CAMPO FECHA ENTREGA`) y conmutador `MES · SEMANA · DÍA`.

Es un BlockKind nuevo end-to-end (estudio → frontera → generador), siguiendo la receta de la
spec 48 (bloque `form`).

## User stories (formato EARS)

- WHEN el usuario arrastra el bloque «Calendario» a una vista y elige un recurso con al menos
  un campo fecha THEN el canvas pinta una previsualización de calendario y el panel de
  configuración ofrece: **Fecha** (campo fecha, obligatorio), **Etiqueta** (campo a mostrar en
  la tira), **Color de la tira** (campo enum opcional) y **Fin de semana** (mostrar/ocultar).
- IF el recurso elegido no tiene ningún campo fecha THEN el bloque se marca en el canvas como
  no generable ahí (patrón «Diseño aún no generable»), sin rechazarlo ni moverlo.
- WHEN se genera la app THEN existe una pantalla de calendario en su propia ruta que lista los
  registros del recurso vía el endpoint de listado existente (sin backend nuevo), con
  navegación mes anterior/siguiente y vistas Mes / Semana / Día.
- WHEN un registro tiene valor en el campo enum de color THEN su tira se pinta con el color
  asignado a ese valor y la leyenda del panel muestra un chip por valor del enum.
- IF «Fin de semana» está desactivado THEN la rejilla mensual/semanal omite SÁB y DOM.
- WHEN el usuario pulsa una tira THEN navega al mismo destino que la fila del listado
  (ficha si existe, si no nada — igual que la tabla).
- WHILE la vista es Mes THEN los días fuera del mes en curso se pintan atenuados y el día de
  hoy lleva realce (borde de acento, como el mock).

## Criterios de aceptación

- [ ] `BlockKind` incluye `calendar`; está en `GENERABLE_BLOCKS`.
- [ ] Paleta del estudio con icono `lucideCalendar` y descripción; preview en canvas.
- [ ] Panel de configuración: selector de campo fecha (default: primer campo fecha), selector
      de etiqueta (default: labelField del recurso), selector de enum para color (opcional),
      conmutador fin de semana (default: visible).
- [ ] La frontera cruza el bloque al app-schema; kind desconocido sigue descartándose igual.
- [ ] El generador emite componente + ruta (`/{ruta}/calendario`) reutilizando el endpoint de
      listado; vistas Mes/Semana/Día; typecheck del emitido a 0 errores.
- [ ] Fixture de oro con un calendario; `/golden-diff` limpio para los modelos existentes
      (que no usan calendario ⇒ diff vacío).
- [ ] Suite del estudio y del plugin en verde.

## Referencias del proyecto de referencia

- Mock: `docs/style/Captura de pantalla 2026-08-23 a las 21.44.44.png` (22E).
- Receta BlockKind nuevo: spec 48 (`.claude/specs/48-bloque-formulario/`).
- Patrón de bloque de vista completa: camino de `cards` (galería).

## Reglas de negocio aplicables

- Sin backend nuevo: el calendario es una proyección del listado (mismo criterio que los
  widgets C1v de la spec 32).
- «Generar, no interpretar»: el caso canónico es UNA fecha por registro; rangos, arrastrar
  tiras o multi-fecha se editan a mano sobre lo emitido.
- Plantillas tontas: cálculo de rejilla y colores resuelto en TS emitido, no en EJS.

## Fuera de scope (deliberado)

- Drag & drop de tiras para cambiar la fecha.
- Eventos con rango (fecha inicio/fin) o multi-día.
- Backend de agregación o endpoints nuevos.
- Crear registros desde el calendario.
