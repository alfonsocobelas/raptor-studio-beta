# Spec 33: Import CSV validado por el dominio (fase 5 · B1v)

> ⚠️ **SPEC RETIRADA (2026-08-28).** El import CSV se eliminó del generador por decisión de
> Alfonso: ni endpoint, ni caso de uso, ni diálogo, ni botón, ni bandera de schema
> (`list.features.import`). Este documento queda como registro histórico de lo que hubo.

---

## Contexto de negocio

La pieza más diferencial del catálogo: un importador que valida cada fila con los MISMOS
value objects que protegen el alta manual. Los errores que devuelve son de negocio («Contract
number must be at most 50 characters»), por fila y campo — no un «formato inválido» genérico.
Convierte el TDD del dominio en una feature visible para el cliente.

## Decisiones de diseño (autónomas — vetables)

1. **Flag explícito** `list.features.import: true` (como `export`); sin él, ni un byte.
2. **El CSV se parsea en el CLIENTE** (parser mínimo emitido: comillas y comas; sin saltos de
   línea embebidos, documentado). El backend recibe JSON `{ rows: RegisterXInput[] }` — el
   contrato tipado ya existe.
3. **Todo o nada, en dos fases**: fase 1 construye los agregados fila a fila y ACUMULA los
   errores de dominio (fila + mensaje); si hay alguno → 422 con la lista completa y no se
   importa nada. Fase 2 registra todas en UNA transacción, con los checks de unicidad del
   register; un choque → 409 con la fila. Parcial-con-informe queda descartado en v1: deja
   la base en un estado que el usuario no ve.
4. **Cabeceras = nombres de campo del RegisterInput** y botón «Descargar plantilla» que las
   genera — sin mapeo de columnas en v1 (inner-platform de importadores).
5. **`project` lo estrena** (golden, ciclo completo con papelera e historial). Tope 500
   filas por petición (con log del descarte).

## Criterios de aceptación

- [ ] `POST /<plural>/import` valida TODAS las filas y devuelve 422 con `{ row, message }[]`
      si alguna viola el dominio; con todas limpias, importa en una transacción y devuelve
      `{ imported }` (ambos motores)
- [ ] El diálogo de import muestra los errores POR FILA y permite reintentar tras corregir
- [ ] «Descargar plantilla» produce un CSV con las cabeceras exactas del alta
- [ ] Un modelo sin `features.import` genera exactamente lo mismo que antes
- [ ] Gates: golden 6/6 · typecheck 0 (ambas composiciones) · e2e con captura (CSV con una
      fila mala → errores; corregido → importa y aparece en el listado)

## Fuera de scope

- Mapeo de columnas, ficheros Excel, import de hijos de composición, actualización de
  existentes (upsert), import asíncrono con progreso (500 filas síncronas bastan hoy).
