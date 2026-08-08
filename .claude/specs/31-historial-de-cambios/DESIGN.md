# Diseño técnico: Historial de cambios

> Condición de emisión: `model.history === true`. Regla 8: cálculo en generator.ts, plantillas tontas.

---

## Kernel (emitido una vez por app, si ALGÚN modelo declara history)

```
contexts/shared/domain/audit/audit-event.ts          # tipo del evento + acciones
contexts/shared/domain/audit/audit-trail.port.ts     # abstract class AuditTrailPort
contexts/shared/infrastructure/audit/typeorm-audit-trail.ts   (motor postgres)
contexts/shared/infrastructure/audit/mongoose-audit-trail.ts  (motor mongo)
```

```typescript
export interface AuditEvent {
  id: string            // uuidv7
  entity: string        // 'project'
  entityId: string
  action: 'created' | 'updated' | 'deleted' | 'restored'
  /** update: { campo: { from, to } }; created/deleted/restored: {} */
  changes: Record<string, { from: unknown; to: unknown }>
  occurredAt: string
  actor: string | null  // lo rellenará la ranura auth; null en v1
}

export abstract class AuditTrailPort {
  abstract record(event: Omit<AuditEvent, 'id' | 'occurredAt'>): Promise<void>
  abstract of(entity: string, entityId: string, limit: number): Promise<AuditEvent[]>
}
```

- Migración: tabla `shared.audit_events` (índice por entity+entity_id+occurred_at DESC).
  La emite el plugin de migraciones cuando algún modelo trae history.
- `record` es mejor-esfuerzo EN EL ADAPTER (try/catch + log): el use case no conoce esa política.
- Binding en el módulo compartido/root, no por recurso.

## Por recurso (cuando `history`)

- Use cases register/update/remove/restore: inyectan `AuditTrailPort` y registran tras el éxito.
  - update: el diff se calcula con los primitives ANTES y DESPUÉS (el use case ya carga el
    agregado; `toPrimitives()` de ambos y comparación superficial por campo).
- Controller: `GET :id/history` (antes de `:id`? no hace falta: ':id/history' no colisiona,
  pero se declara junto a los GET). Handler + use case `Get<Entity>HistoryUseCase` finos.
- Frontend: `history(id)` en el servicio; sección timeline en la ficha (lista vertical:
  icono por acción, fecha formateada, chips «campo: antes → después»). Sin librerías.

## Decisiones técnicas

| Decisión | Opción | Razón |
| --- | --- | --- |
| Disparo | `history: true` explícito | `audit` ya significa otra cosa; presencia = emisión |
| Almacén | Tabla global `shared.audit_events` | 1 tabla, 1 puerto, 1 componente; habilita vista transversal futura |
| Captura | Use case, tras el éxito, mejor-esfuerzo | Frontera transaccional; un fallo de auditoría no tumba negocio |
| Diff | Superficial sobre primitives | Los campos son planos en el schema; composición fuera de scope |
| Timeline | En la ficha, últimos 50 | La ficha es el lugar natural; paginación YAGNI |

## Riesgos

| Riesgo | Prob. | Impacto | Mitigación |
| --- | --- | --- | --- |
| El diff del update con VOs no planos (Period) sale ruidoso | media | bajo | Comparar primitives (strings/números), no VOs |
| Doble escritura sin transacción compartida | media | bajo | Aceptado: mejor-esfuerzo declarado; el evento puede perderse, el negocio no |
| Golden churn grande (use cases de 4+ ficheros × project) | segura | medio | Re-baseline incremental por tarea, como specs 29/30 |
