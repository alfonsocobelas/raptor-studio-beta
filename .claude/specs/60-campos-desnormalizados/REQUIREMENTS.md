# Spec: Campos desnormalizados en el resource-schema

---

## Contexto de negocio

Los listados necesitan mostrar, filtrar, ordenar y buscar por datos de la entidad referenciada (ej.: el nombre del cliente en la tabla de pedidos) sin hacer JOIN entre agregados — la asociación entre agregados es por identidad, y el `search-config` solo opera sobre columnas propias. La referencia (sap-licenses) lo resuelve con copias desnormalizadas (`customer_name` en `contracts`, `projects`, `licenses`), pero el resource-schema no tiene forma de declararlas: hoy el generador no puede emitir este patrón.

**Enmienda (Fase 2, 2026-08-23)**: la exploración reveló que el schema YA declara la desnormalización — `form.lookup.denormalizes` en el campo FK (`resource-types.ts:79-86`), usada por los modelos golden — pero la resuelve el navegador. No se crea el tag `denormalized` propuesto inicialmente (duplicaría la información); se reutiliza la declaración existente y se mueve la resolución al use case. Ver DESIGN.md §0.

**Semántica ratificada (2026-08-23, esta conversación):**

- **Snapshot al escribir, sin propagación**: si la entidad origen cambia después, la copia conserva el valor histórico. La sincronización posterior queda fuera del caso canónico (edición a mano; regla de los dos).
- **Lookup en backend, sin fiarse del DTO** (decisión de Alfonso, se aparta deliberadamente de la referencia): el campo desnormalizado NO viaja en los DTOs de escritura. El use case de register/update hace el lookup del origen por el FK y copia el valor él mismo. De regalo, valida que el FK apunta a una entidad existente. La referencia confiaba en el DTO (el diálogo copiaba el nombre con un `find()` en memoria) porque el sync diario con SAP auto-reparaba el drift; nuestras apps generadas no tienen sync, así que un dato mentiroso quedaría para siempre.

## User stories (formato EARS)

- **WHEN** el campo FK declara `form.lookup: { resource: 'cliente', labelField: 'name', denormalizes: 'clienteNombre' }` y `clienteNombre` existe como campo persistido del recurso **THEN** el generador emite entidad/dominio/mapper/migración como hoy (sin cambios en esas capas) y mueve la resolución del valor al use case.
- **WHEN** el use case register/update recibe un input cuyo FK origen (`clienteId`) está presente o cambia **THEN** hace lookup del cliente en su repositorio y copia el campo declarado; el valor persiste el del canon, nunca uno aportado por el cliente HTTP.
- **IF** el FK apunta a una entidad inexistente **THEN** el use case falla con `NotFoundError` (no se persiste nada).
- **IF** un campo es destino de `denormalizes` **THEN** NO aparece en los DTOs HTTP de register/update ni lo envía el diálogo emitido; sí aparece en las respuestas de lectura.
- **WHEN** el campo declara `query.sortable/filterable/searchable` **THEN** entra en `ALLOWED_ORDERS`/`ALLOWED_FILTERS`/`SEARCHABLE_FIELDS` y en la `ColumnDef` del listado, como cualquier campo propio.
- **IF** el campo destino de `denormalizes` declara `form` propio **THEN** la validación del schema lo rechaza (el valor no lo aporta el usuario).
- **IF** `lookup.denormalizes` no nombra un campo existente del recurso, o `lookup.resource`/`lookup.labelField` están vacíos **THEN** `defineResource` falla con mensaje claro.

## Criterios de aceptación

- [ ] `defineResource` acepta y valida el tag `denormalized` (tests en `libs/schema`).
- [ ] Módulo generado con un campo desnormalizado: compila, la tabla lo muestra y permite ordenar/filtrar/buscar por él.
- [ ] Crear por HTTP con un FK válido persiste el valor canónico del origen aunque el payload intente colar otro (el campo se ignora/rechaza en el DTO).
- [ ] Crear/editar con FK inexistente devuelve 404.
- [ ] Editar cambiando el FK refresca la copia.
- [ ] Golden-diff en verde (con re-baseline documentado: el use case emitido inyecta el repo del origen, cosa que la referencia manual no hace).

## Referencias (proyecto de referencia y diseño)

- Patrón de columna+VO+search-config: `docs/referencia/libs/backend/src/contexts/sap-licensing/modules/contracts/` (`typeorm-contract.entity.ts:29-33`, `search-contract-config.ts`)
- Patrón de lookup+copia (el que adoptamos, trasladado al use case): `docs/referencia/libs/backend/src/contexts/sap-licensing/modules/contracts/application/services/sync-contracts.service.ts:40-64`
- Contraejemplo (enriquecer en memoria, sin columna → sin orden server-side): `docs/referencia/libs/backend/src/contexts/sap-licensing/modules/qbr/application/config/search-qbr-declarations-config.ts:7`
- Skill `schema-authoring` (formato del schema y decisiones ratificadas)

## Reglas de negocio aplicables

- Sin JOIN entre agregados en SQL; asociación por identidad (migración `1785700000000-AddCustomerNameToMetricConsumption.ts:11-18` de la referencia).
- Cero lógica en la BD: sin FK constraints; la existencia del origen la valida el use case (doctrina de borrado).
- Plantillas tontas: la decisión de qué campos son desnormalizados y de dónde copiar se calcula en `generator.ts`; las plantillas EJS solo interpolan.

## Fuera de scope (deliberado)

- **Propagación al cambiar la entidad origen** (renombrar el cliente NO actualiza los pedidos): se acepta el snapshot histórico. Si aparece 2-3 veces la necesidad real, spec futura.
- **Referencias cross-contexto**: el lookup asume repositorio del mismo contexto (acoplamiento intra-contexto deliberado, como los sync de la referencia). Puerto anticorrupción solo si un caso real lo pide.
- **Copia de copia** (licenses copia `customerName` vía contract): el tag solo copia de la entidad directamente referenciada; cadenas se resuelven declarando el FK intermedio.
- **Backfill de datos existentes**: los módulos ya generados se regeneran o migran a mano.

---

> ⚠️ **STOP** después de rellenar este fichero. No proceder a `DESIGN.md` hasta aprobación explícita del usuario.
