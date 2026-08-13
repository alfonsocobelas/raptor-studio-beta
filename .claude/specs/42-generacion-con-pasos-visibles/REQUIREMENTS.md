# Spec: Generación con pasos visibles

## Contexto de negocio

La spec 41 dejó «Antes de generar» a pantalla completa, pero el minuto y medio que de verdad
tarda la generación sigue resolviéndose con **un spinner y dos líneas de texto**. Es el
momento en que el usuario ha apostado y no puede hacer nada: o le enseñas lo que ocurre, o
parece que se colgó.

La maqueta 7C (`docs/style/Captura de pantalla 2026-08-14 a las 0.15.31.png`) propone la obra
en marcha: fases con su estado y su tiempo, registro técnico plegable, y algo útil que mirar
mientras. Decidido con Alfonso (2026-08-14):

- **La pantalla de generación SUSTITUYE al paso 3.** «Antes de generar» pasa a ser dos pasos
  de decisión y uno de obra: el botón del raíl del paso 2 arranca la generación y la pantalla
  de obra ocupa el paso 3.
- **El nombre y lo avanzado se mudan al raíl del paso 2**, que ya era el recibo de lo que vas
  a generar. El comando determinista y la descarga del diseño se mudan al **final** de la
  obra, que es cuando sirven de algo.
- **El raíl «Mientras tanto» lleva lo que existe**: qué se está escribiendo mientras dura y
  cómo arrancar la aplicación cuando termine. **Nada de invitar al equipo, dominio propio ni
  aviso por correo**: no hay cuentas, ni publicación, ni hosting, ni email. Por el mismo
  motivo **desaparece la fase «Compilando y publicando»**, que en la maqueta es la última.
- **La barra avanza por fases cumplidas, no por un porcentaje inventado.** El generador no
  sabe cuántos ficheros va a escribir, así que un 62 % sería una mentira que además se
  desmiente sola. Los tiempos por fase sí son reales: se cronometran.
- **Cancelar y Seguir en segundo plano existen de verdad**, no como adorno.

## User stories (formato EARS)

### Bloque A — el paso 2 recoge lo que el 3 suelta

- WHEN el usuario está en el paso de infraestructura THEN el raíl enseña, encima del resumen,
  el nombre de la aplicación (precargado con el del diseño) y, plegado, lo avanzado (instalar
  dependencias y directorio destino).
- IF el nombre no es kebab-case THEN el botón del raíl queda apagado y la fila del nombre lo
  explica.
- WHEN el usuario pulsa el botón del raíl THEN arranca la generación y la pantalla pasa al
  paso de obra. El botón dice «Generar aplicación», no «Continuar».

### Bloque B — la obra

- WHEN arranca la generación THEN la pantalla enseña las fases que van a ocurrir, **todas
  desde el principio**, en gris las que no han empezado.
- WHEN una fase empieza THEN se marca en curso; WHEN termina THEN se marca cumplida con el
  tiempo real que tardó.
- WHEN se instala THEN la fase de dependencias enseña cuántos paquetes se instalaron, que el
  generador declara en su salida (`added N packages`).
- IF el usuario pidió no instalar dependencias THEN esa fase se pinta **omitida**, no
  pendiente para siempre.
- WHEN se está escribiendo el código THEN el raíl enumera lo que va saliendo —entidades,
  vistas y módulos reconocidos en las rutas—, marcando lo ya escrito.
- WHEN la generación avanza THEN la barra superior refleja **fases cumplidas sobre fases
  totales**, y la cabecera lleva el tiempo transcurrido. No hay porcentaje de ficheros ni
  estimación de lo que falta.
- WHEN el usuario despliega el registro técnico THEN ve la salida cruda del generador, con su
  hora, y puede volver a plegarlo. Arranca plegado.
- IF el generador falla THEN la fase en curso se marca en error y el registro técnico se abre
  solo, que es donde está el motivo.

### Bloque C — cancelar y segundo plano

- WHEN el usuario pulsa «Cancelar» THEN se para la generación: el proceso del generador se
  mata y el directorio destino se borra **solo si lo creó esta generación**.
- IF el directorio ya existía antes de generar THEN no se borra nada y la pantalla avisa de
  que quedó código a medias.
- WHEN se cancela THEN la pantalla lo dice como cancelación, no como error.
- WHEN el usuario pulsa «Seguir en segundo plano» THEN la capa se cierra, la generación sigue
  y el botón del lienzo pasa a «Generando…» con su segundero.
- WHEN el usuario vuelve a pulsar ese botón mientras genera THEN se reabre la pantalla de obra
  con el progreso al día, sin arrancar otra generación.
- WHEN termina en segundo plano THEN el lienzo lo avisa (el aviso que ya existe) con la ruta
  generada y una salida para ver el resultado.

### Bloque D — el final

- WHEN termina bien THEN la pantalla enseña la ruta generada, cuántos ficheros y cuánto tardó,
  **cómo arrancarla** (los comandos), el comando determinista equivalente con su botón de
  copiar y la descarga del app-schema.
- WHEN termina mal THEN enseña el error y el registro, y deja volver a las decisiones sin
  perderlas.

## Criterios de aceptación

- [ ] «Continuar» ya no existe: el raíl del paso 2 genera.
- [ ] Las fases se ven todas desde el principio y cada una acaba con su tiempo real.
- [ ] Ninguna cifra de la pantalla carece de origen en la salida del generador o en el reloj.
- [ ] No hay publicación, dominio, invitaciones ni correo en ninguna parte.
- [ ] Cancelar para de verdad el proceso y deja el workspace como estaba.
- [ ] Se puede cerrar la pantalla, seguir diseñando y enterarse de que terminó.
- [ ] Suite del estudio y del backend en verde + **build AOT** + generado de verdad.

## Referencias

- `docs/style/Captura de pantalla 2026-08-14 a las 0.15.31.png` — la maqueta (7C).
- `apps/studio/libs/backend/src/contexts/studio/generate/progress.ts` — lo único que hoy se
  reconoce de la salida del generador.
- `apps/studio/libs/backend/src/contexts/studio/generate/studio-generate.controller.ts` — el
  stream NDJSON; hoy no mata el hijo si el cliente se va.
- `apps/studio/libs/frontend/src/domains/studio/generate/generate-runner.ts` — el lector.
- `apps/studio/libs/frontend/src/domains/studio/design/canvas-notice.service.ts` — el aviso.
- Spec 41 (`.claude/specs/41-antes-de-generar/`) — de la que sale ésta.

## Reglas de negocio aplicables

- **Ninguna cifra sin dato detrás** (regla 3). Tiempo: reloj. Paquetes y ficheros: salida del
  generador. Fases: la lista que el generador siempre recorre. Lo que no se sabe, no se pinta.
- El estudio **no publica ni despliega**: escribe código en el workspace local. Cualquier
  promesa de hosting es de otro producto.
- El progreso se lee de la salida REAL, no se simula (ya escrito en `progress.ts`).

## Fuera de scope (deliberado)

- Publicar la aplicación, dominios, invitar al equipo, avisos por correo. No existen y no se
  insinúan.
- Porcentaje de avance por ficheros y estimación de tiempo restante.
- Reanudar una generación cancelada donde se quedó.
- Generar más de una aplicación a la vez.
