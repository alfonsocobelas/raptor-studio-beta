# Spec 73: Fila de KPIs unificada — un bloque, celdas mixtas

## Contexto de negocio

La paleta del estudio ofrece hoy **cinco** herramientas de la familia analítica: KPIs (contadores),
KPI (con medida), Top N, Barras y Evolución. Cinco entradas para variantes de la misma idea —«un
número o un desglose sobre una entidad»— y ninguna forma de **combinarlas en una misma línea**: cada
bloque ocupa su fila (o media, con el truco de dos `half` seguidos). Quien diseña un panel quiere
poner un contador al lado de un Top 5 y de una gráfica, y hoy no puede.

Esta spec colapsa la familia en **un único bloque «KPIs»** que es una fila con huecos: al soltarlo
aparece un cuadrado con «+»; cada pulsación añade una celda del tipo elegido (contador, KPI con
medida, Top N, Barras, Evolución). La app generada emite esa misma fila — el lienzo no promete
nada que el código emitido no haga.

Decisiones del brainstorming (2026-08-28, aprobadas):

- **Contenedor real**, no azúcar de paleta: la fila vive en el JSON de diseño y en el app-schema.
- **Los 5 tipos** pueden convivir en la fila (las gráficas ocupan más ancho).
- **Una sola entrada en la paleta + migración**: los kinds sueltos desaparecen del modelo; los
  diseños guardados se convierten al cargar.
- **End-to-end desde el primer día**: el generador emite la fila combinada.

## User stories (formato EARS)

- WHEN arrastro «KPIs» al lienzo THEN aparece una fila vacía con un cuadrado «+».
- WHEN pulso el «+» THEN elijo entre Contador, KPI, Top N, Barras y Evolución, y la celda se añade
  a la fila con valores por defecto razonables (recurso de la vista si lo hay).
- WHEN una fila tiene celdas THEN el «+» sigue visible al final para añadir más.
- WHEN pulso una celda THEN se abre su panel de configuración (el mismo que hoy tiene el bloque
  suelto equivalente) y puedo quitarla.
- WHEN la fila mezcla tipos THEN el lienzo la pinta como una sola línea: contadores y Top N a una
  columna, Barras y Evolución a dos.
- WHEN genero la app THEN el dashboard emitido pinta esa misma fila con el mismo reparto de anchos.
- WHEN cargo un diseño guardado con bloques sueltos `kpi`, `top-n`, `count-by` o `series` THEN cada
  uno se convierte en una fila de una celda, sin pérdida de configuración.
- WHEN cargo un diseño con el `kpis` antiguo (`resources: [a, b]`) THEN se convierte en una fila
  con una celda contador por recurso.
- WHEN un app-schema escrito a mano trae los kinds sueltos de hoy (`metrics`, `kpi`, `top-n`,
  `count-by`, `series`) THEN se siguen leyendo y se normalizan a filas — mismo precedente que
  `kpi-count` en la spec 70.
- IF una celda está incompleta (Top N sin campo de orden, Barras sin eje…) THEN la fila se emite
  sin esa celda y el lienzo lo marca, igual que hoy hacen los bloques sueltos.
- IF una fila se queda sin celdas generables THEN la fila no se emite.

## Criterios de aceptación

- [ ] `BlockKind` pierde `kpi`, `top-n`, `count-by` y `series`; `kpis` pasa a llevar `items` (celdas).
- [ ] Migración al cargar: bloques sueltos → fila de una celda; `resources` → celdas contador. Con tests.
- [ ] Paleta con una sola entrada «KPIs»; el «+» de la fila añade celdas de los 5 tipos.
- [ ] Config por celda reutilizando los paneles existentes (kpi, top-n, gráficas); quitar celda.
- [ ] App-schema: kind `kpi-row` con `cells`; los kinds analíticos sueltos se normalizan a filas.
- [ ] El generador emite la fila como grid (1 columna las tarjetas, 2 las gráficas); golden re-baseline.
- [ ] Los smokes/tests del estudio que montaban los kinds viejos quedan migrados.
- [ ] Suites en verde, `npm run web:build` (gate AOT del estudio), golden limpio, typecheck del emitido.

## Reglas de negocio aplicables

- **Un solo camino**: los kinds sueltos desaparecen del modelo de diseño; nada de convivencia.
- **El lienzo no miente**: la fila del estudio y la del emitido comparten reparto de anchos.
- **Campos planos dentro de la celda** (doctrina spec 70): la celda anida la lista, pero cada celda
  mantiene los campos planos de hoy para que el autosave y la lectura del JSON sigan siendo triviales.
- «Generar, no interpretar»: anchos a medida por celda, filas anidadas, reordenar por drag dentro
  de la fila → a mano sobre lo emitido o en una spec posterior.

## Fuera de scope (deliberado)

- Reordenar celdas dentro de la fila (drag): la fila respeta el orden de inserción.
- Anchos configurables por celda: reparto fijo por tipo (tarjeta=1, gráfica=2).
- Tocar el endpoint `aggregate` o los datos: esto es composición y layout, las peticiones no cambian.
- El bloque `table` y el resto de la paleta: solo se unifica la familia analítica.
