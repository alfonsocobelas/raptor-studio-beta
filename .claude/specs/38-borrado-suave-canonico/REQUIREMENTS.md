# Spec: Borrado suave canónico

> Decisión de Alfonso (2026-08-10, demo Solaris): el borrado emitido pasa a ser **soft delete
> por defecto**, el **caso de uso** gobierna las entidades relacionadas **en una misma
> transacción**, y **cero lógica de negocio en Postgres** (ni `ON DELETE CASCADE` ni
> restricciones que decidan comportamiento). Igual que el repo de referencia.

---

## Contexto de negocio

La demo Solaris destapó que el botón «Eliminar» **no funciona en ninguna tabla con hijos**:
borrar un cliente con obras (o una obra con partes) devuelve `500 · An unexpected error
occurred` porque el `DELETE` físico choca con la FK (`fk_instalaciones_cliente`,
`fk_partes_instalacion`). Como la semilla relaciona todos los registros, el usuario percibe
que «no borra nada». Solo las hojas (partes) borran bien (204). Medido en navegador el
2026-08-10 con la app generada en `apps/solaris`.

El defecto no es la FK (protege bien): es que el caso de uso emitido
(`remove-<entity>-usecase`) no sabe que existen relacionadas y hace borrado físico. La
decisión de producto: el borrado del acelerador es **reversible por defecto** (soft delete,
como la papelera de la spec 29) y quien conoce las relaciones es **el dominio**, nunca el
motor de base de datos.

## User stories (formato EARS)

- **WHEN** el usuario elimina un registro sin relacionadas **THEN** desaparece del listado y
  aparece en la papelera (soft delete, `deletedAt` poblado)
- **WHEN** el usuario elimina un registro CON relacionadas (cliente con obras) **THEN** el
  registro y sus relacionadas dejan de mostrarse en la web, marcados **en la misma
  transacción**
- **IF** la transacción de marcado falla a medias **THEN** no queda ningún registro marcado
  (rollback completo)
- **WHEN** el usuario restaura desde la papelera un registro que arrastró relacionadas
  **THEN** {pendiente de decisión: ¿restaura también las relacionadas, o solo el padre?}
- **IF** un modelo declara borrado físico explícitamente (caso especial donde no importa la
  permanencia) **THEN** el generador emite el `DELETE` físico de hoy
- **WHILE** un registro está borrado suavemente **THEN** ningún listado, lookup, KPI, export,
  galería, gantt ni tabla relacionada lo muestra

## Criterios de aceptación

- [ ] Borrar un cliente con 3 obras: 204, ni el cliente ni sus obras (ni los partes de esas
      obras) se ven en ninguna vista
- [ ] El marcado de padre+relacionadas viaja en UNA transacción (test de integración que
      fuerza el fallo a mitad y comprueba rollback)
- [ ] `softDelete` deja de ser opt-in: todo modelo lo lleva salvo declaración explícita en
      contra en el resource-schema
- [ ] Ninguna migración emitida contiene `ON DELETE CASCADE` ni pierde la FK (la FK se queda:
      protege, no gobierna)
- [ ] La papelera (spec 29) acompaña a todo borrado reversible
- [ ] Golden-diff: re-baseline deliberado de las 4 referencias de oro + 2 apps (este cambio
      SÍ cambia el canon empezado — OK de Alfonso ya dado para la dirección; el diff completo
      se revisa a mano antes del commit de re-baseline)
- [ ] E2E sobre una demo: borrar padre con hijos → desaparecen; restaurar → {según decisión
      de la story abierta}

## Referencias (proyecto de referencia y diseño)

- `docs/referencia/libs/backend/src/contexts/sap-licensing/modules/projects/infrastructure/persistence/typeorm/typeorm-project.repository.ts`
  — `softDelete({ id })` como implementación del `remove` del repositorio
- `docs/referencia/.../typeorm-project.entity.ts` — `@DeleteDateColumn({ type: 'timestamptz' })`
- `docs/referencia/.../use-cases/remove-project-usecase.service.ts` — el caso de uso decide
  quién puede borrarse (regla ME_SAP); precedente de reglas de borrado en dominio
- Spec 29 (`vista-papelera`) — GET /deleted + restore + vista de papelera ya emitidos
- Spec 31 (`historial-de-cambios`) — los use cases de escritura ya registran eventos; el
  borrado suave debe seguir registrándolos

## Reglas de negocio aplicables

- Regla 8 (CLAUDE.md): plantillas tontas — el cálculo de «quién me referencia» vive en
  `generator.ts` (ya existe para las tablas relacionadas de la ficha), nunca en EJS
- Doctrina de borrado (memoria `doctrina-de-borrado`): soft delete por defecto · caso de uso
  transaccional · cero lógica de negocio en la BD
- ADR-002 punto 4: los drill-downs derivan de las referencias de los hijos — la misma
  derivación alimenta el marcado de relacionadas

## Fuera de scope (deliberado)

- Borrado físico con confirmación reforzada («escribe el nombre para confirmar») — YAGNI
- Purga programada de la papelera (retención) — cuando haya demanda real
- Restauración selectiva de relacionadas una a una — la papelera restaura, no cherry-picks
- Mongo: la ranura `database=mongo` recibe el mismo contrato en su adapter, pero si el gate
  mongo exige trabajo desproporcionado se abre tarea propia

## Preguntas abiertas (cerrar antes del DESIGN)

1. Restaurar un padre, ¿restaura sus relacionadas marcadas en la misma operación? (simétrico
   al borrado parece lo natural, pero hay que decidir qué pasa si una relacionada fue borrada
   DESPUÉS por su cuenta)
2. ¿El diálogo de confirmación debe enumerar el arrastre («se archivarán también 3 obras y
   12 partes»)? Hoy el texto dice «permanentemente», que además pasa a ser mentira — el copy
   hay que cambiarlo en cualquier caso.
3. ¿Qué modelos de la demo/oro declaran borrado físico como caso especial, si alguno?
