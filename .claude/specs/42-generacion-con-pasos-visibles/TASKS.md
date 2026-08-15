# Tareas atómicas: Generación con pasos visibles

> Cada tarea = un commit. Implementar UNA, hacer commit, esperar revisión.
> Orden TDD obligatorio: borde → dominio → estado → vista.
> No toca plantillas EJS ni `generator.ts`: **sin gate de `/golden-diff`**.
> Gate real antes de cada commit que toque plantilla Angular: **`npm run web:build`** (AOT),
> porque la suite compila JIT y deja pasar errores de plantilla (lección de la spec 41).

## Bloque A — que el borde diga lo que hace

- [x] **TASK-01**: Tests + `describeProgress` devuelve además una **clave de fase** estable
      (`prepare | write | configure | install | error`) y el **número de paquetes** de la línea
      `added N packages`. El controlador reemite `phase` y `packages` en el NDJSON. Aditivo:
      `step` sigue viajando igual.

- [x] **TASK-02**: Tests + cancelación en `studio-generate.controller.ts`: al cerrarse la
      respuesta sin haber terminado se mata el **grupo** de procesos, y se borra el directorio
      destino **solo si no existía** antes de arrancar (comprobado antes de lanzar nada, y
      nunca fuera del workspace).

## Bloque B — el dominio de la pantalla

- [x] **TASK-03**: Tests + `generate-phases.ts`: lista declarada y reductor de eventos a
      estados con duración. Casos: transición cierra la anterior con su tiempo; `install`
      omitida cuando se pidió no instalar; error marca en fallo la que estaba en curso; un
      evento repetido no reinicia el cronómetro; fases nunca alcanzadas quedan pendientes.

- [x] **TASK-04**: Tests + `written-items.ts`: qué se está escribiendo, cruzando rutas de
      `CREATE` con el diseño y las ranuras. Casos: entidad y vista del diseño se marcan al
      aparecer su ruta; el módulo de auth solo se lista si hay autenticación; una ruta que no
      casa con nada no marca nada (nunca inventa); el orden es el del diseño.

## Bloque C — el estado

- [x] **TASK-05**: Tests + `GenerateRunner` suma `phases`, `written`, `packages`, `outcome` y
      `cancel()` (aborta el `fetch`). Casos con `fetch` falso: cancelar deja `outcome` en
      `cancelled` y no en error; una generación nueva limpia el desenlace anterior.

## Bloque D — la pantalla

- [x] **TASK-06**: Tests + el nombre y lo avanzado se mudan al raíl del paso 2; el botón pasa
      a «Generar aplicación» y arranca la generación al pulsarlo. El paso 3 deja de pedir
      nombre.

- [x] **TASK-07**: Tests + `generate-work.component.ts`: cabecera de obra con el reloj y las
      dos salidas, barra por fases cumplidas, lista de fases con estado y tiempo, registro
      técnico plegable (abierto solo si falla) y raíl «Mientras tanto».

- [x] **TASK-08**: Tests + el desenlace en la misma pantalla: ruta, ficheros y tiempo; cómo
      arrancarla; el comando determinista con copiar y la descarga del diseño; cancelada y
      fallida con su cara y su vuelta a las decisiones.

- [x] **TASK-09**: Tests + segundo plano en `studio-canvas.component.ts`: el botón dice
      «Generando…» con su segundero, reabre la pantalla en vez de arrancar otra, y al terminar
      avisa por `CanvasNoticeService` con la ruta y una salida al resultado.

## Validación

- [x] **TASK-10**: Suite del estudio y del backend en verde, `npm run web:build`, y
      comprobación en el navegador: generar de verdad viendo las fases; **cancelar a mitad y
      comprobar que no queda ningún proceso vivo** (`pgrep -f nx`) ni el directorio; cerrar en
      segundo plano y volver. Capturas a `docs/style/`.
