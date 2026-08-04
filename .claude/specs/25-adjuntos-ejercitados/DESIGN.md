# Diseño técnico: adjuntos ejercitados y validados en el dominio

> Diseño aprobado en brainstorming 2026-08-04.

---

## 1. Los VOs, en el kernel

Las reglas de fichero son transversales (mismas para todo recurso) y sus constantes ya son
compartidas, así que los VOs van al kernel junto a `attachment-constants.ts`, no al árbol por
recurso. Todos extienden clases base que el kernel ya emite:

```
  kernel/files-attachments/contexts/shared/domain/storage/
    attachment-constants.ts          (ya existe: MAX_ATTACHMENT_SIZE_BYTES, ALLOWED_…MIME_TYPES)
    value-objects/
      attachment-file-name.vo.ts     extends StringValueObject   → no vacío, longitud máxima
      attachment-mime-type.vo.ts     extends EnumValueObject     → allowlist de MIME
      attachment-size-bytes.vo.ts    extends IntegerValueObject  → > 0 y ≤ máximo
```

Espejo exacto del canon `qbr` (`EvidenceFileName`, `EvidenceMimeType`, `EvidenceSizeBytes`),
renombrados a `Attachment*` porque aquí no son de un módulo concreto.

## 2. El servicio valida construyendo VOs

```
  ANTES                                          DESPUÉS
  if (file.sizeBytes > MAX) throw BadRequest…    AttachmentSizeBytes.create(file.sizeBytes)
  if (!ALLOWED.includes(mime)) throw BadReq…     AttachmentMimeType.create(file.mimeType)
  (fileName sin validar)                         AttachmentFileName.create(file.originalName)
```

El VO lanza el error de dominio; el borde HTTP lo traduce a 400 con el filtro global que ya emite el
kernel (`BusinessRuleViolationError` → 422 / `InvalidRequestError` → 400). Se conserva intacto lo
que ya está bien resuelto: el `storageKey` UUIDv7 generado en backend y el **rollback del binario**
si falla el guardado de metadatos.

## 3. Guard mongo + adjuntos

Los adjuntos emiten hoy una entidad TypeORM. Con `--database=mongo` eso metería TypeORM en una app
Mongo, que es exactamente lo que el candado de la spec 23 prohíbe. Se comprueba en el ensamblador,
antes de emitir:

```
  Attachments on 'project' require postgres and the app targets mongo.
  Drop attachments from the model or use --database=postgres.
```

Mismo estilo que el `requires` de `auth=single-tenant`. Va en el ensamblador y no en el manifiesto
del motor porque el disparador es una propiedad del MODELO, no de una ranura.

## 4. Fixtures

```
  app        postgres · auth,email · infra=azure · contract,project   ← project trae los adjuntos:
                                                                        tabla, servicio, controller,
                                                                        componente y StorageModule
                                                                        con binding de Blob
  app-mongo  mongo · sin plugins · infra=none · customer,contract,license
                                                                      ← license sustituye a project:
                                                                        conserva softDelete y se
                                                                        queda sin adjuntos
```

Las dos se re-baselinean (commit propio). La de app gana ficheros; la de mongo cambia un módulo.

## 5. La verificación que ningún gate da

El golden compara ficheros y la suite del plugin no ejecuta la app. Que una subida funcione de
verdad sólo se ve ejecutándola: app generada, `POST` multipart con un fichero, y comprobar que el
binario está en el almacenamiento y los metadatos en la tabla. Con `infra=none` el adapter es disco
local, así que no hace falta cuenta de Azure para verificarlo.

Se comprueba también el camino de error: forzar un fallo tras subir el binario debe dejar el
almacenamiento sin huérfanos.

## 6. Testing

- Unit (plugin): los tres VOs (property-based donde aplique: vacío, límite, por encima del límite,
  MIME fuera de la lista), el guard mongo+adjuntos, y que `project` emite la pieza.
- Golden: 6 gates vacíos tras el re-baseline.
- End-to-end manual (una vez): subida real y rollback contra la app generada.
