# Tareas atómicas: Schema lib (`@acc/schema`)

> Cada tarea = un commit atómico en develop. Implementar UNA, commitear, esperar revisión, siguiente.

---

## La lib

- [x] **TASK-01**: Scaffold de `libs/schema` (`@nx/js:library`, importPath `@acc/schema`, jest, sin bundler) + limpiar el ejemplo generado; lint y test verdes
- [x] **TASK-02**: `resource-types.ts` (formato canónico completo del DESIGN) + `validation-errors.ts` (`SchemaValidationError` con lista de problemas) + barrel — sin tests (tipos y clase de error sin lógica)

## defineResource (TDD)

- [ ] **TASK-03**: Tests + implementación de `defineResource()` — las 8 reglas de validación del DESIGN, acumulativas, con mensajes "campo: motivo"; casos: modelo válido (contract), cada regla violada, varios problemas a la vez, freeze

## Migración del generador

- [ ] **TASK-04**: Migrar `libs/generators` a `@acc/schema`: `contract.model.ts` con `defineResource` y fields keyed, `build-substitutions.ts` sobre `ResourceDefinition` (`Object.entries`), adaptar tests existentes, eliminar `model-types.ts`

## Cierre

- [ ] **TASK-05**: Gate final — diff de oro de contract VACÍO tras la migración + suite completa (lint, test, format:check) + marcar spec completa

---

## Regla del juego

- Implementar **UNA** tarea, commitear en develop, esperar aprobación, siguiente.
- Si una tarea parece > 1h o > ~150 líneas, **partirla en subtareas** antes de empezar.
- Si descubres una dependencia oculta que la spec no contempla, **PARA** y reporta antes de seguir.
