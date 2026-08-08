# Spec 31: Historial de cambios (fase 5 · A3)

---

## Contexto de negocio

Tercera pieza de la fase 5. La ficha de un registro cuenta QUÉ es, pero no QUÉ le ha pasado:
quién lo creó, qué campos cambiaron y cuándo se borró o restauró. El historial añade esa
memoria como una timeline en la ficha, alimentada por eventos que registran los use cases
de escritura ya emitidos.

## Decisiones de diseño (tomadas en modo autónomo — vetables)

1. **Flag nuevo `history: true`**, NO derivarlo de `audit: true`. `audit` hoy significa
   «columnas createdAt/updatedAt» y lo llevan customer/license/project: derivar el historial
   de él activaría eventos en modelos que no lo pidieron y cambia su semántica por sorpresa.
   Presencia = emisión, como detail/gallery/gantt/code.
2. **Tabla GLOBAL `audit_events`** (una por app, no por entidad): entity + entityId + action +
   changes(jsonb) + occurredAt. Una tabla, un puerto, un componente — y permite el día de
   mañana una vista transversal «actividad de la app». La alternativa por-entidad multiplica
   migraciones y adapters sin ganar nada hoy.
3. **Captura en el USE CASE** (register/update/remove/restore), no en el repositorio ni con
   eventos de dominio: es la frontera transaccional y donde ya viven los cross-cutting
   (unicidad). Un `AuditTrailPort` inyectado, mejor-esfuerzo (un fallo al escribir el evento
   no tumba la operación de negocio).
4. **Sin actor en v1**: `auth` es una ranura opcional; el evento lleva actor nullable y la
   ranura auth lo rellenará cuando se integre (anotado como siguiente paso, no se hace ahora).
5. **Sin retención** (YAGNI): la tabla crece; si un cliente lo sufre, se decide entonces.
6. **La timeline vive en la FICHA** (`detail`): `history` sin `detail` emite solo el endpoint.

## User stories (formato EARS)

- WHEN el usuario crea/edita/borra/restaura un registro de un modelo con `history` THEN queda
  un evento con la acción, los campos cambiados (antes → después) y el instante
- WHEN el usuario abre la ficha THEN ve la timeline de eventos del registro, del más reciente
  al más antiguo, con los cambios legibles
- IF la escritura del evento falla THEN la operación de negocio NO falla (mejor esfuerzo)
- IF el modelo no declara `history` THEN no se emite ni un byte: ni tabla, ni puerto en el
  módulo, ni sección en la ficha

## Criterios de aceptación

- [ ] `GET /api/v1/<plural>/:id/history` devuelve los eventos del registro (ambos motores)
- [ ] update registra SOLO los campos que cambiaron, con valor anterior y nuevo
- [ ] La ficha de un modelo con `history + detail` muestra la timeline
- [ ] Un modelo sin `history` genera exactamente el mismo código que antes
- [ ] `project` lo estrena (tiene detail y ciclo completo con la papelera de la spec 29)
- [ ] Gates: golden 6/6, typecheck del emitido AMPLIADO al frontend, e2e con captura

## Fuera de scope (deliberado)

- Actor (quién): llega con la integración de la ranura auth, no aquí.
- Vista transversal «actividad de la app» (la tabla global la deja preparada).
- Retención/purga y paginación de la timeline (v1: últimos 50).
- Revertir un cambio desde la timeline.
