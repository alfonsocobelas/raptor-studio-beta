# Diseño: Plantillas backend canónicas

## Clasificación de los 67 ficheros de la fixture (auditoría 2026-07-30)

| Categoría | Ficheros | Decisión |
| --- | --- | --- |
| Canónicos derivables | entity, mapper, search-config, constants, with-id specification | **Generar (esta spec)** |
| Canónicos con extras idiosincráticos | repository port y TypeOrm repository (finders de sync), specifications de negocio | Posponer: exigen modelar finders; candidato a spec futura |
| Protocolo + binding denso | agregado (`contract.ts`), VOs (16), types, errors | Spec futura (requiere modelar VOs con jerarquía de bases) |
| No canónicos (sap-licenses) | phases, sync services, maintenance mapper, license-value reader, seeds | **Nunca generar**: código a mano |

## Ampliaciones del schema (binding nuevo)

- `query.{filterable,sortable,searchable}: boolean | number` — el número fija el **orden** en las
  listas ALLOWED_* (los módulos de oro no siguen el orden de campos).
- Resource-level `searchNotes?: string[]` — comentario emitido sobre SEARCHABLE_FIELDS (contracts lo tiene, customers no).
- Resource-level `constraints?: Record<string, { shared: true } | Record<string, number>>` — alimenta `<name>-constants.ts` (`shared` referencia `SHARED_CONSTRAINTS.<KEY>`).
- `field.optionalPrimitive?: boolean` — en `toPersistence` el mapper emite `?? <default|null>` (campos añadidos tarde al dominio, opcionales en primitives).

## Derivaciones (todas en build-substitutions, plantillas tontas)

- Listas ALLOWED_*: campos con flag ≠ false/undefined ordenados por número (boolean `true` = después, en orden de campo).
- Mapper `toDomain`: `entity.x` salvo `Nullable<Date>` → `entity.x?.toISOString() ?? null`.
- Mapper `toPersistence`: `primitives.x` salvo `Nullable<Date>` → `primitives.x ? new Date(primitives.x) : null`; `optionalPrimitive` → `?? <default renderizado | null>`.
- Constants: entradas en orden de declaración; `shared` → `SHARED_CONSTRAINTS.<KEY>`.
