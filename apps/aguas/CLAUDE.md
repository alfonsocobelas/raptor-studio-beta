# aguas — contexto del negocio

> Destilado de la conversación de diseño en el estudio. Corrige aquí lo que cambie:
> este fichero es la memoria del negocio que acompaña al código generado.

## Negocio

Laboratorio de análisis de aguas en Valladolid: cuatro técnicos de laboratorio y un comercial. Los clientes son ayuntamientos, comunidades de regantes y empresas de alimentación. El trabajo se organiza por muestras: llega un bote de agua tomado en un punto de muestreo, un técnico lo analiza, se comparan los resultados con los límites legales, se valida y se emite el informe. Lo que más duele es una muestra que se pasa de la fecha límite del informe sin que nadie lo vea, y un bote que lleva más de 24 horas desde la recogida y ya no sirve.

## Reglas

- Una muestra no se puede validar si algún parámetro está fuera del límite legal: pasa a fuera de rango y se repite el análisis.
- Una muestra facturada no se reabre nunca.
- No se emite informe sin la cadena de custodia firmada adjunta en la muestra.
- Una muestra recibida con más de 24 horas desde la recogida se marca como caducada y no se analiza.

## Glosario

- **muestra**: El bote de agua y su análisis de principio a fin
- **punto de muestreo**: El sitio del cliente donde se recoge el agua, siempre el mismo
- **cadena de custodia**: El documento firmado que acredita quién tuvo la muestra desde la recogida
- **fuera de rango**: Algún parámetro supera el límite legal y hay que repetir el análisis

## Entidades

- **Muestra**: El bote de agua de principio a fin: entra, se analiza, se compara con los límites legales, se valida, se informa y se factura.
- **Punto de muestreo**: El sitio del cliente donde se recoge el agua: siempre el mismo, y algunos son control obligatorio por normativa.
- **Cliente**: Quien encarga los análisis: un ayuntamiento, una comunidad de regantes o una empresa de alimentación.
- **Parámetro**: El catálogo de analíticas con su método, su límite legal y su precio: se carga del CSV de tarifas del proveedor.

## Procesos de negocio

### De la recepción del bote al informe facturado

El recorrido de una muestra desde que entra el bote en recepción hasta que administración la factura.

1. (inicio) Llega el bote del punto de muestreo
2. Se registra la muestra en recepción · entidad: muestra
3. El técnico analiza la muestra · entidad: muestra
4. ¿Todos los parámetros dentro del límite legal?
   - sí → 6
   - no → 5
5. Se marca la desviación y se repite el análisis · entidad: muestra
   - → 4
6. El responsable valida los resultados · entidad: muestra
7. Se emite el informe al cliente · entidad: muestra
8. Administración factura la muestra · entidad: muestra
9. (fin) Muestra cerrada

### Prueba Jaime

1. (inicio) Inicio
2. (fin) Fin

### JOB · Permisos próximos a caducar

El job diario mira qué permisos caducan dentro del PLAZO_AVISO_PRORROGA y arranca la responsabilidad de la prórroga.

1. (inicio) El job diario recorre los permisos vigentes
2. ¿Caduca dentro del PLAZO_AVISO_PRORROGA (30 días)?
   - dentro de plazo → 3
   - fuera de plazo → 5
3. Se arranca la responsabilidad de solicitud de prórroga
4. (fin) → Flujo: Responsabilidad Solicitud de PRÓRROGA
5. (fin) Nada que avisar: el permiso se revisa en la siguiente pasada

### Responsabilidad Solicitud de PRÓRROGA

Encrucijada del proceso: decide si la prórroga la lleva Tramitaciones (fase I) u Operaciones (fase II). Aquí vuelven los caminos que no salen adelante.

1. (inicio) Hay una prórroga que asignar
2. ¿Fase I o fase II?
   - fase I → 3
   - fase II → 5
3. Fase I: la responsabilidad es de TRAMITACIONES
4. (fin) → Flujo: Solicitud de PRÓRROGA · Fase I - Tramitaciones
5. Fase II: la responsabilidad es de OPERACIONES
6. (fin) → Flujo: Solicitud de PRÓRROGA · Fase II - Operaciones

### Solicitud de PRÓRROGA · Fase I - Tramitaciones

Tramitaciones decide entre prorrogar o pedir licencia nueva. Los cinco impedimentos (no admite prórrogas, supera el máximo, permiso caducado, fuera de plazo, denegado por el organismo) cierran la vía de la prórroga.

1. (inicio) Tramitaciones recibe la solicitud de prórroga
2. ¿Prórroga o licencia nueva?
   - prórroga → 7
   - licencia nueva → 3
3. ¿Se puede pedir licencia nueva?
   - sí → 4
   - no → 6
4. Se abre la solicitud de licencia nueva (subestado Pendiente)
5. (fin) → Flujo: Solicitud NUEVA de licencia/permiso
6. (fin) Solicitud cancelada
7. ¿Se puede prorrogar? (admite, máximo, permiso vigente, en plazo, no denegado)
   - sí → 8
   - no → 10
8. Se abre la solicitud de prórroga (subestado Pendiente)
9. (fin) → Flujo: Solicitud de PRÓRROGA
10. (fin) → Flujo: Responsabilidad Solicitud de PRÓRROGA (subestado Pendiente)

### Solicitud de PRÓRROGA · Fase II - Operaciones

Operaciones recibe el enlace de aceptar o denegar. Si acepta la prórroga se comprueba el PLAZO_ACEPTACION_PRORROGA_INTERNO antes de pasarla a Tramitaciones.

1. (inicio) Operaciones recibe la solicitud
2. ¿Prórroga o licencia nueva?
   - prórroga → 9
   - licencia nueva → 3
3. Se envía a Operaciones el enlace aceptar/denegar la licencia nueva (subestado Enviada_Operaciones)
4. ¿Qué responde Operaciones a la licencia nueva?
   - aceptada → 7
   - denegada → 5
   - sin acción → 6
5. (fin) Licencia nueva denegada por Operaciones (subestado Denegada_Operaciones)
6. (fin) Sin respuesta de Operaciones (subestado Enviada_Operaciones)
7. Licencia nueva aceptada por Operaciones (subestado Aceptada_Operaciones)
8. (fin) → Flujo: Solicitud NUEVA por Tramitaciones (automático)
9. Se envía a Operaciones el enlace aceptar/denegar la prórroga (subestado Enviada_Operaciones)
10. ¿Qué responde Operaciones a la prórroga?

- aceptada → 13
- denegada → 11
- sin acción → 12

11. (fin) Prórroga denegada por Operaciones (subestado Denegada_Operaciones)
12. (fin) Sin respuesta de Operaciones (subestado Enviada_Operaciones)
13. Prórroga aceptada por Operaciones (subestado Aceptada_Operaciones)
14. ¿Dentro del PLAZO_ACEPTACION_PRORROGA_INTERNO (15 días)?

- dentro de plazo → 17
- fuera de plazo → 15

15. Se comunica a Operaciones la aceptación fuera de plazo
16. (fin) → Flujo: Responsabilidad Solicitud de PRÓRROGA (automático)
17. (fin) → Flujo: Solicitud de PRÓRROGA por Tramitaciones (automático)

### Solicitud de PRÓRROGA

La prórroga en sí: plantilla con trazabilidad, tasas si las lleva, presentación al organismo y resolución. Si el organismo deniega, el caso vuelve a la encrucijada de fases.

1. (inicio) Tramitaciones prepara la prórroga
2. Se rellena la plantilla: N_LICENCIA_ORIGINAL, cuándo, qué y por qué
3. ¿Lleva tasas?
   - sí → 4
   - no → 5
4. Se pagan las tasas de la prórroga (mismas acciones que el pago de tasas ordinario)
5. Se presenta la solicitud al organismo (subestado Presentada)
6. Se registra la comunicación al organismo: quién, cuándo y qué
7. ¿Qué resuelve el organismo? (se registra quién, cuándo y qué)
   - aceptada → 8
   - denegada → 9
8. (fin) Prórroga aceptada (estado Aceptada)
9. (fin) → Flujo: Responsabilidad Solicitud de PRÓRROGA

### Solicitud NUEVA de licencia/permiso

Cuando la prórroga no es posible: se pide licencia nueva por email, sede electrónica o presencialmente, y a partir de ahí es la solicitud genérica de licencia/permiso/autorización.

1. (inicio) Hace falta una licencia o permiso nuevo
2. ¿Por qué vía se presenta?
   - email → 3
   - sede → 5
   - presencial → 4
3. Se presenta por email al organismo
   - → 6
4. Se presenta presencialmente en el organismo
   - → 6
5. Se presenta en la sede electrónica
6. Sigue la solicitud genérica de licencia/permiso/autorización
7. (fin) La licencia nueva se resuelve en el flujo genérico
