# Spec: «Antes de generar» — la pantalla de infraestructura

## Contexto de negocio

Todo el estudio se ha ido vistiendo (specs 36-37, lavado de cara del 2026-08-10) menos el
último paso, que es justo el que decide si la aplicación se genera o no. Hoy «Generar
aplicación» abre un **modal de 32 rem** con radios y checkboxes nativos, un `<details>`
llamado «Avanzado», el comando en un `<code>` y cuatro botones apretados en una fila. Es la
única superficie del producto que sigue pareciendo un formulario de administración.

La maqueta (`docs/style/Captura de pantalla 2026-08-13 a las 11.04.09.png`, turno 9A) propone
otra cosa: una **pantalla completa a dos columnas** con las decisiones en tarjetas grandes y
un raíl a la derecha que resume lo que vas a obtener. Decidido con Alfonso (2026-08-13):

- Se adopta la maqueta **sin el modelo de coste** (79 €/mes, sliders de tamaño, comparativa
  entre nubes). No hay tabla de precios en el repo y no se va a inventar una; ese raíl lo
  ocupa el resumen del diseño.
- Las opciones que la maqueta enseña y el generador **no tiene** se pintan igualmente, pero
  **deshabilitadas y marcadas «Próximamente»**. La pantalla enseña la ambición del producto
  sin mentir sobre lo que hoy genera.
- «Alta disponibilidad» sale del catálogo: no se pinta ni como próximamente.
- El paso 3 (nombre, avanzado, comando, progreso) es una **pantalla propia**, no un pie del
  paso 2.

## User stories (formato EARS)

### Bloque A — la pantalla

- WHEN el usuario pulsa «Generar aplicación» en la barra del estudio THEN se abre una capa a
  pantalla completa titulada «Antes de generar», con la marca, el nombre del diseño, un
  indicador de tres pasos y un enlace «Volver al lienzo».
- WHEN el usuario pulsa «Volver al lienzo» o `Escape` THEN la capa se cierra y el lienzo
  queda exactamente como estaba (selección, zoom y modo intactos).
- WHEN se abre la capa THEN el paso «Vistas» aparece ya cumplido (✓) porque el diseño vive en
  el lienzo, y pulsarlo cierra la capa para volver a él.
- IF el diseño no tiene ninguna vista con bloques THEN el botón de la barra sigue apagado
  como hoy y la capa no se abre.

### Bloque B — las decisiones (paso 2)

- WHEN se pinta el paso de infraestructura THEN cada ranura elegible del manifiesto se
  muestra como una fila de tarjetas —alojamiento arriba a lo ancho, base de datos y
  autenticación a media columna—, con la elegida marcada.
- WHEN una tarjeta del catálogo no tiene proveedor en el manifiesto THEN se pinta apagada,
  no seleccionable, con la pastilla «Próximamente».
- IF el manifiesto publica un proveedor que el catálogo no conoce THEN se pinta igualmente,
  habilitado, con la etiqueta y la descripción que trae el manifiesto (el manifiesto manda;
  el catálogo solo pone las palabras y lo que falta).
- WHEN el usuario elige un proveedor que invalida otra ranura THEN esa otra ranura vuelve a
  su valor por defecto, como hoy, y el proveedor incompatible queda apagado explicando qué
  requiere.
- WHEN se pintan los complementos THEN cada plugin del manifiesto es una tarjeta con casilla,
  y los cuatro que aún no existen —Redis para sesiones, Observabilidad, Almacenamiento de
  objetos, Dominio propio— salen apagados con «Próximamente».
- WHEN el usuario cambia cualquier decisión THEN el raíl de la derecha lo refleja al momento.
- IF el manifiesto no se puede cargar THEN la pantalla lo dice donde iban las tarjetas y el
  botón de continuar queda apagado (hoy ya pasa, con el mismo mensaje).

### Bloque C — el raíl

- WHEN se abre la capa THEN el raíl derecho resume el diseño: número de vistas, de bloques y
  de recursos, y el preset visual elegido en el lienzo.
- WHEN hay decisiones tomadas THEN el raíl lista la pila resultante (alojamiento, base de
  datos, autenticación, complementos activos) en filas etiqueta→valor.
- WHEN el usuario está en el paso 2 THEN el botón del raíl dice «Continuar» y lleva al paso 3.
- WHEN el usuario está en el paso 3 THEN el botón del raíl dice «Generar aplicación» y lanza
  la generación; queda apagado si el nombre no es kebab-case.

### Bloque D — generar (paso 3)

- WHEN se entra al paso 3 THEN el nombre viene precargado con el del diseño (`appName`), no
  en blanco.
- IF el nombre no es kebab-case THEN se dice en la propia fila y no se puede generar,
  descargar ni copiar.
- WHEN el usuario despliega «Avanzado» THEN puede desmarcar la instalación de dependencias y
  fijar un directorio destino, como hoy.
- WHEN hay nombre válido THEN se ve el comando determinista (`npx nx g @raptor/generators:app …`)
  con su botón de copiar, y el de descargar el app-schema.
- WHILE el generador trabaja THEN el centro de la pantalla muestra el paso actual, los
  ficheros escritos, el segundero y el último fichero, leídos del NDJSON como hoy.
- WHEN termina THEN se ve el resultado (ruta generada o error) sin perder las decisiones
  tomadas.

## Criterios de aceptación

- [ ] El modal ha desaparecido; «Generar aplicación» abre la pantalla completa.
- [ ] La pantalla se parece a la maqueta 9A menos el bloque de coste, que es el resumen.
- [ ] Ninguna opción habilitada carece de respaldo en `tools/slots.json`.
- [ ] Añadir un proveedor al manifiesto enciende su tarjeta sin tocar el componente.
- [ ] Los tres pasos navegan y «Volver al lienzo» no pierde el diseño.
- [ ] Se puede generar de verdad desde la pantalla nueva (progreso y resultado).
- [ ] Los `data-testid` que usan los smoke tools siguen existiendo.
- [ ] Suite del estudio en verde.

## Referencias

- `docs/style/Captura de pantalla 2026-08-13 a las 11.04.09.png` — la maqueta (9A).
- `apps/studio/libs/frontend/src/domains/studio/generate/generate-wizard.component.ts` — lo que se retira.
- `apps/studio/libs/frontend/src/domains/studio/generate/wizard-command.ts` — la lógica pura que se conserva.
- `tools/slots.json` — el manifiesto real; la única fuente de qué existe.
- `apps/studio/apps/frontend-app/src/styles.css` — `.studio-ui`, `.studio-nav`, `.studio-eyebrow`, `.studio-cta`, `.studio-box`.

## Reglas de negocio aplicables

- **El manifiesto manda** (spec 23): el estudio no se inventa opciones. El catálogo nuevo
  solo añade redacción y marca lo que falta; nunca decide qué está disponible.
- **Regla 3 (no inventar)**: sin precio no hay precio. El coste queda fuera hasta que exista
  un modelo real.
- El preset visual (`design`) no se pregunta aquí: lo manda el lienzo, y el raíl lo enseña.

## Fuera de scope (deliberado)

- El coste estimado, los sliders de tamaño y la comparativa entre proveedores.
- Añadir adapters nuevos al generador (AWS, GCP, Redis, observabilidad, storage, dominio).
  Las tarjetas quedan apagadas hasta que existan.
- Alta disponibilidad, en ninguna forma.
- Autenticación multi-tenant (se pinta apagada; el trabajo es del generador).
