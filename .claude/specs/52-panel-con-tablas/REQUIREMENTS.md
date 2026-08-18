# Spec: El panel admite tablas

> Decisión de Alfonso (2026-08-19), revisando la demo `taller`: «si, un panel puede tener tablas»,
> y «tendrás que corregir el generador, las demos me dan igual, son para revisar».

---

## Contexto de negocio

El diseñador dibuja un **Panel** como lo que un panel es en cualquier herramienta de negocio:
métricas arriba y el listado de lo que importa debajo. Hoy el generador no lo emite: el bloque
`kpis` produce la página `dashboard` (solo widgets) y la tabla de la MISMA vista acaba como una
página de listado independiente que, además, se queda sin etiqueta y le roba el título a la
siguiente vista que repita ese recurso (ROADMAP 25, medido en la demo taller: el panel salió sin
tabla y la vista «Órdenes» desapareció del menú).

El lienzo, mientras tanto, dibuja la tabla dentro del panel con su chrome de búsqueda y exportación
y la da por emitible (`generableHere` solo mira el tipo de bloque y si la vista es de detalle). O
sea: el lienzo promete una pantalla que el resultado no cumple. Esta spec cierra la divergencia por
el lado correcto — el generador aprende a emitirla — en vez de recortar el diseño.

## User stories (formato EARS)

### Contrato y frontera

- WHEN una vista del lienzo combina `kpis` y uno o más bloques `table` THEN la página `dashboard`
  emitida declara esos listados, en el orden dibujado, y NO se emiten páginas de listado sueltas
  por su culpa
- WHEN una vista declara solo `table` (sin `kpis`) THEN sigue emitiendo su página de listado, con
  su título, exactamente como hoy
- IF el mismo recurso aparece en el panel y además en su propia vista THEN se emiten las dos cosas:
  la tabla embebida en el panel y la pantalla de listado con su título y su entrada de menú (es lo
  que el diseñador dibuja, y hoy la segunda desaparecía en silencio)
- IF un bloque `table` del panel referencia un recurso que no viaja en la app THEN la frontera lo
  rechaza con error accionable, como cualquier otro bloque

### Emitido

- WHEN la página `dashboard` declara listados THEN el componente del panel los renderiza debajo de
  los widgets y por encima del hueco `@ai dashboard-extra`
- WHEN un listado se renderiza dentro del panel THEN NO repite la cabecera de pantalla (el `h1`, la
  entradilla y el enlace a la papelera): el panel ya tiene su título, y dos `h1` en una pantalla es
  un defecto de maquetación
- WHILE el listado vive en el panel THEN conserva lo que el lienzo dibuja y lo que el usuario espera
  de una tabla: búsqueda, filtros, orden, paginación, exportación y las acciones a las que su rol
  tenga derecho (spec 46/49)
- WHEN se emite el panel con listados THEN la app emitida compila (`npm run web:build`) y su suite
  sigue verde

### Estudio

- WHEN el diseñador suelta una tabla en una vista con KPIs THEN el lienzo ya no miente: eso es
  exactamente lo que se va a emitir
- IF dos bloques `table` del MISMO recurso conviven en la MISMA vista THEN el lienzo lo marca como
  duplicado (uno de los dos no aporta nada)

## Fuera de alcance

- Tablas de resumen «top N» distintas del listado real: el bloque `table` es el listado, no una
  variante nueva. Si algún día se quiere un resumen recortado, es otro bloque y otra spec.
- Que el arquetipo `dashboard` acepte fichas, galerías o formularios. Solo tablas.

## Dependencias

- Spec 32 (widgets analíticos): el panel ya compone widgets; esta spec añade listados a su lado.
- ADR-009 (una vista es una secuencia de bloques) y ROADMAP 23/25.
