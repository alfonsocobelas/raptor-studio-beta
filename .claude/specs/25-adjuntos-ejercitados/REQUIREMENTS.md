# Spec: Adjuntos ejercitados y validados en el dominio

---

## Contexto de negocio

La spec 14 construyó los adjuntos (tabla propia, servicio, controller multipart, componente
Angular) pero **nadie los usa**: ningún modelo registrado declara `attachments: true`, así que en
ninguna app generada ni en ninguna fixture de oro se emite la pieza. Consecuencias medidas el
2026-08-04, al cablear el proveedor `infra=azure` (spec 24):

- El `StorageModule` **no existe en ninguna app emitida**, así que el binding de Azure Blob que
  añade el proveedor de infra no se puede ejercitar end-to-end: sólo está cubierto por un test
  unitario sobre `apply()`.
- La pieza de adjuntos entera (servicio, controller, componente) no la ve ningún gate: ni el golden
  ni la suite del plugin.
- `attachments: true` + `--database=mongo` emitiría una **entidad TypeORM en una app Mongo**, que
  rompe el candado de la spec 06/23 (una app mongo no lleva TypeORM). Hoy no salta porque nadie lo
  pide, pero es un fallo latente esperando al primer cliente que lo declare.

Además hay una divergencia con el canon (`docs/referencia`, módulo `qbr`) que conviene cerrar
mientras se toca la pieza: el canon valida nombre, MIME y tamaño con **value objects del dominio**
(`EvidenceFileName`, `EvidenceMimeType` como `EnumValueObject`, `EvidenceSizeBytes` como
`IntegerValueObject`), y nuestro servicio lo hace con `if`s y `BadRequestException` en
infraestructura. Las clases base que el canon usa ya las emite nuestro kernel, y las constantes
(`MAX_ATTACHMENT_SIZE_BYTES`, `ALLOWED_ATTACHMENT_MIME_TYPES`) ya existen: subir la validación al
dominio es barato y alinea con la regla de que el código emitido se parezca al de la referencia.

Decisiones cerradas en brainstorming (2026-08-04):

- **Alcance**: ejercitar lo que ya existe + subir la validación a VOs. **NO** se convierten los
  adjuntos en entidad del agregado (el canon lo hace, pero eso es la spec grande que se descartó):
  siguen en su tabla y su servicio, que es la decisión de la spec 14.
- **Modelo portador**: `project`, que está en la fixture postgres pero **no** en la de mongo.
- **Fixture mongo**: pasa de `customer,contract,project` a `customer,contract,license`; `license`
  conserva la cobertura de `softDelete` sin arrastrar adjuntos.
- **Mongo + adjuntos**: el generador **falla** con mensaje claro, en vez de emitir una app rota.
  Adjuntos en Mongo (subdocumento o colección aparte) es spec posterior.
- **Los VOs viven en el kernel**, no por recurso: las reglas de fichero son transversales y las
  constantes ya son compartidas.

## User stories (formato EARS)

- **WHEN** genero la app canónica (fixture postgres) **THEN** se emiten la tabla de adjuntos, el
  servicio, el controller multipart, el componente Angular y el `StorageModule`
- **WHEN** esa app se genera con `--infra=azure` **THEN** su `StorageModule` enlaza Azure Blob si la
  config trae la sección `storage`, y disco local si no
- **IF** un modelo declara `attachments: true` **Y** la app se genera con `--database=mongo`
  **THEN** el generador falla con un error claro antes de emitir un solo fichero
- **IF** se sube un fichero con un MIME fuera de la lista permitida **THEN** el rechazo viene de un
  value object del dominio (`AttachmentMimeType`), no de un `if` en infraestructura, y el borde HTTP
  lo traduce a 400
- **IF** se sube un fichero que supera el tamaño máximo **THEN** lo rechaza `AttachmentSizeBytes`
- **IF** el nombre del fichero supera el máximo **THEN** lo rechaza `AttachmentFileName`
- **WHEN** se sube un fichero contra la app generada **THEN** el binario queda en el almacenamiento,
  los metadatos en su tabla, y si falla el guardado de metadatos el binario se borra (sin huérfanos
  apuntando a nada)
- **WHILE** el `storageKey` se genera **THEN** lo genera siempre el backend (UUIDv7), nunca llega
  del cliente

## Criterios de aceptación

- [ ] `project.model.ts` declara `attachments: true` y la fixture postgres emite la pieza completa
- [ ] La fixture mongo (`customer,contract,license`) sigue cubriendo composición, único opcional y
      softDelete, y no emite nada de adjuntos
- [ ] `attachments` + `mongo` → error claro del generador, con test
- [ ] Tres VOs nuevos en el kernel (`AttachmentFileName`, `AttachmentMimeType`, `AttachmentSizeBytes`)
      con sus tests, y el servicio validando con ellos en vez de con `if`s
- [ ] El candado de la spec 06/23 sigue verde: una app mongo no contiene TypeORM
- [ ] Los 6 gates de oro en verde tras el re-baseline deliberado de las dos fixturas de app
- [ ] Verificación end-to-end: subida real de un fichero contra la app generada, con el binario en
      el almacenamiento y el rollback comprobado
- [ ] Suite del plugin verde

## Referencias (proyecto de referencia y diseño)

- Canon de VOs de fichero: `docs/referencia/libs/backend/src/contexts/sap-licensing/modules/qbr/domain/value-objects/evidence-*.vo.ts`
- Canon del flujo de subida: `.../qbr/application/use-cases/upload-evidence-usecase.service.ts`
- Pieza actual: `libs/generators/src/generators/resource/files-attachments/`,
  `files-attachments-front/` y `kernel/files-attachments/`
- Decisión de alcance por página (no por fila): ROADMAP, observación 2

## Reglas de negocio aplicables

- La validación de entrada externa vive en el dominio (VOs), no en infraestructura
- `storageKey` generado en backend con UUIDv7, nunca aceptado del cliente
- Plantillas tontas, lógica en `generator.ts` (regla 8)
- Gate de oro antes de commit; el re-baseline va en commit propio (`chore(golden): …`)

## Fuera de scope (deliberado)

- **Adjuntos en Mongo** (subdocumento embebido o colección aparte) → spec posterior; aquí el
  generador simplemente falla si se piden
- **Adjuntos por fila** (necesitan el arquetipo `detail`) → ROADMAP obs. 2
- Convertir el adjunto en entidad del agregado con use cases y handlers, como el canon `qbr`
- Antivirus, thumbnails, URLs firmadas o descarga directa desde el almacenamiento

---

> Aprobado en brainstorming 2026-08-04.
