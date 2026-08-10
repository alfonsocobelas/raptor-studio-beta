# Diseño técnico: Borrado suave canónico

> REQUIREMENTS aprobado (2026-08-10, decisiones cerradas). Regla 8: todo lo de abajo lo
> calcula `generator.ts`/`build-substitutions.ts`; las plantillas solo interpolan.

---

## Contrato del schema

`softDelete` se conserva pero **cambia su defecto**: pasa de opt-in a **true**. La escotilla
física es declararlo en contra:

```ts
// resource-types.ts — mismo campo, nueva semántica (documentada en el JSDoc)
softDelete?: boolean   // default: true. `false` = borrado físico (catálogos puros)
```

- Sin `list.features.delete` no hay borrado de ningún tipo (como hoy).
- `material` (demo Solaris) declara `softDelete: false` y estrena la escotilla.
- No se toca `schemaVersion`: ningún schema existente se ROMPE — los que no declaraban nada
  cambian de comportamiento, que es exactamente el cambio de canon aprobado.

## El árbol de arrastre se calcula al emitir

El generador ya sabe quién referencia a quién (lo usa para las tablas relacionadas de la
ficha, ADR-002 punto 4). La misma derivación produce el **árbol de arrastre** estático:

```
cliente ──◄ instalacion ──◄ parte        (◄ = «me referencian por este campo»)
```

`build-substitutions.ts` emite, por entidad soft-borrable, la lista ordenada de niveles
`[{ module, entity, fkField, parentLevel }]`. Solo entran hijos con `softDelete !== false`:
un hijo físico no se arrastra (no hay estado que marcar) — si aparece el caso, el DESIGN de
ese modelo decide; hoy no existe (parte y instalacion son suaves).

## Columna nueva: la operación de borrado

Cada entidad suave lleva, junto a `deletedAt`:

```
deleted_op UUID NULL     -- id de la operación de borrado que la arrastró (uuidv7)
```

- La pone el use case, no un trigger (cero lógica en la BD).
- `restore` de un padre revierte `WHERE deleted_op = :op` en TODO el árbol: vuelve
  exactamente lo que arrastró esa operación (decisión 1). Un hijo borrado por su cuenta
  lleva OTRO op y se queda.
- Migración de fábrica: `deleted_at` (ya existía en los suaves) + `deleted_op` en todas las
  tablas suaves. FKs intactas: protegen, no gobiernan.

## Backend emitido

### Port (domain/<name>-repository.ts)

```typescript
// cambia la semántica de remove (suave) y aparecen las de arrastre
abstract remove(id: EntityId, op: OperationId): Promise<void>        // softDelete + deleted_op
abstract removeWhereParent(parentIds: string[], op: OperationId): Promise<string[]>
                                                  // marca hijos vivos del padre; devuelve ids
abstract restoreByOp(op: OperationId): Promise<void>                 // revierte la operación
```

En una entidad física (`softDelete: false`) el port se queda como hoy: `remove(id)` = DELETE.

### Use case de borrado (remove-<name>-usecase)

```
invoke({ id }):
  cargar agregado (404 si no existe)                     ← igual que hoy
  op = OperationId.generate()                            ← uuidv7 del kernel
  txManager.runInTransaction(async () => {
    repo.remove(id, op)
    nivel1 = instalacionRepo.removeWhereParent([id], op)
    nivel2 = parteRepo.removeWhereParent(nivel1, op)     ← árbol estático, sin recursión dinámica
    auditTrail.record(...)                               ← si history (spec 31), dentro de la tx
  })
```

- Los repos de los hijos entran por DI: sus módulos ya exportan el port (medir en la tarea;
  si un módulo no lo exporta, exportarlo es parte del cambio).
- Rollback total garantizado por `runInTransaction` (criterio de aceptación con test que
  fuerza fallo a mitad).

### Use case de restauración (restore-<name>-usecase, spec 29 revisada)

```
invoke({ id }):
  op = repo.deletedOpOf(id)          // ¿o viaja el op en la petición? → NO: el trash lista
                                     // padres; su fila conoce su op. Detalle: el DTO del
                                     // trash expone deletedOp y el POST /restore lo usa.
  txManager.runInTransaction(() => cada repo del árbol .restoreByOp(op))
```

### Papelera (spec 29) — condición de emisión

`trash = canDelete && softDelete` no cambia de fórmula, pero al cambiar el defecto la
papelera acompaña ahora a **todo** borrado reversible (criterio del REQUIREMENTS). Los
listados/lookups/KPIs/export/galería/gantt/related-tables ya filtran `deletedAt` — verificar
uno a uno en la tarea de integración, no asumirlo.

### Mongo

Mismo contrato en el adapter Mongoose: `deletedAt` + `deletedOp` como campos, marcado con
`updateMany({ fk: { $in }, deletedAt: null })`, transacciones con la sesión del replSet que
el compose de test ya levanta (spec 06). Si `TransactionManager` mongo no existe aún en el
kernel emitido, su tarea lo añade ANTES de tocar los use cases.

## Frontend emitido

- **Diálogo de confirmación** (dialog del listado y de la ficha):
  - suave CON arrastre posible (tiene hijos en el árbol): «Se archivará "X" y sus registros
    relacionados. Podrás restaurarlos desde la papelera.» (aviso genérico, decisión 2)
  - suave SIN hijos: «Se archivará "X". Podrás restaurarlo desde la papelera.»
  - física: el copy de permanencia actual, intacto.
  - El texto lo decide `build-substitutions` (regla 8): `deleteCopy` como sustitución.
- **Toast de error**: el servicio ya propaga errores HTTP; con el 500 eliminado no hay caso
  especial nuevo, pero la tarea e2e verifica que un fallo real muestra toast y no silencio
  (el silencio de hoy es parte del defecto).
- **Papelera**: columna nueva no hace falta; el POST /restore pasa a llevar el op (ver arriba).

## Qué NO cambia

- Las FKs de las migraciones (ni cascada ni borrado de restricciones).
- El DataTable, sus 65 tests, los diálogos de alta/edición.
- La semántica de `restore` para entidades sin hijos (op de un solo miembro).
- El borrado de composiciones (hijos embebidos del agregado, B3): siguen el ciclo del padre
  como hasta ahora.

## Gates

1. TDD por plantilla: cada pieza nueva nace con su test del generador en rojo.
2. Suite completa de generadores + estudio.
3. `typecheck:emitted` a 0 errores.
4. **Golden-diff con re-baseline deliberado**: cambia el canon de las 4 referencias de oro y
   las 2 apps; el diff completo se revisa a mano y va en su commit `chore(golden)` propio.
5. E2E sobre la demo Solaris (regenerada): los tres escenarios del REQUIREMENTS — padre con
   hijos desaparece entero · restaurar devuelve exactamente el arrastre · material borra
   físico sin papelera.
