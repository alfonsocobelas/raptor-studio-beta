---
name: spec-driven-workflow
author: Alfonso Cobelas <alfonso.cobelas@gmail.com>
description: >
  Use when the user asks to start a new feature, create a spec, plan a new module
  or screen, decompose a large task, or says things like "vamos a hacer", "implementemos
  la pantalla de", "necesito crear", "hagamos el módulo de". Also use when the user
  references a screen name from product.md that doesn't yet have a spec.
---

# Spec-Driven Development — workflow obligatorio

Cada feature/pantalla/módulo nuevo pasa por **3 fases en orden** antes de tocar código. **No saltarse ninguna.**

## Fase 1 — REQUIREMENTS

Crea `.claude/specs/{NN-nombre-feature}/REQUIREMENTS.md` con esta estructura:

```markdown
# Spec: {Nombre}

## Contexto de negocio

{1-2 párrafos: qué problema resuelve, para qué rol, en qué punto del flujo}

## User stories (formato EARS)

- WHEN {condición} THEN {comportamiento observable}
- IF {estado} THEN {restricción}
- WHILE {proceso} THEN {invariante}

## Criterios de aceptación

- [ ] Criterio observable 1
- [ ] Criterio observable 2
- ...

## Referencias del proyecto de referencia

- `docs/referencia/libs/{ruta-al-módulo-o-patrón-de-oro}`
- Documento de diseño relevante: `docs/{documento}.md` §{NN}

## Reglas de negocio aplicables

- {regla del steering/product.md o de los ADRs de docs/}

## Fuera de scope (deliberado)

- {qué NO se implementa en esta spec}
```

**STOP** después de generar REQUIREMENTS.md. Pide al usuario que lo revise y lo apruebe explícitamente antes de pasar a Fase 2.

## Fase 2 — DESIGN

Solo cuando REQUIREMENTS.md está aprobado. Crea `.claude/specs/{NN-nombre-feature}/DESIGN.md`:

```markdown
# Diseño técnico: {Nombre}

## Capa backend (si aplica)

### Entidades de dominio

- {Entity}: descripción y VOs principales

### Use cases necesarios

- {Acción}{Entidad}UseCase: input, output, errores posibles

### Endpoints HTTP

- METHOD /api/v1/... : descripción

## Capa frontend (si aplica)

### Componentes a crear

- {Feature}ListComponent
- {Feature}DetailComponent
- {Feature}DialogComponent (si hay form)

### Servicio

- {Entity}Service con resource() para list, métodos create/update/remove

### Rutas

- /sap-licensing/{ruta}

## DTOs compartidos (libs/shared/domain)

- {Entity}Dto: campos y tipos exactos

## Decisiones técnicas

- {decisión 1}: razón
- {decisión 2}: razón

## Riesgos identificados

- {riesgo}: mitigación
```

**STOP** después de DESIGN.md. Aprobación explícita antes de Fase 3.

## Fase 3 — TASKS

Solo cuando DESIGN.md está aprobado. Crea `.claude/specs/{NN-nombre-feature}/TASKS.md`:

```markdown
# Tareas atómicas: {Nombre}

> Cada tarea = un commit. Implementar UNA, hacer commit, esperar revisión.
> Orden TDD obligatorio: dominio → aplicación → infraestructura → e2e (backend);
> servicio → componente (frontend).

## Backend

- [ ] TASK-01: Crear constants/enums/types de {Entity}
- [ ] TASK-02: Tests + implementación de VOs de {Entity}
- [ ] TASK-03: Tests + implementación del AggregateRoot {Entity}
- [ ] TASK-04: Object Mother + Builder + RepositoryMock
- [ ] TASK-05: Test + implementación del use case Register{Entity}
- [ ] TASK-06: Test integración + implementación de TypeOrm{Entity}Repository
- [ ] TASK-07: Migración TypeORM (crear schema + tabla + índices)
- [ ] TASK-08: Test e2e + controller + DTO HTTP + module NestJS

## DTOs compartidos

- [ ] TASK-09: Crear {Entity}Dto en libs/shared/domain + actualizar barrel

## Frontend

- [ ] TASK-10: Object Mother + mock data del frontend
- [ ] TASK-11: Test + implementación de {Entity}Service con resource()
- [ ] TASK-12: Test + componente {Feature}ListComponent (sin diálogo)
- [ ] TASK-13: Test + componente {Feature}DialogComponent (form + submit)
- [ ] TASK-14: Integración del diálogo en el list (crear/editar)
- [ ] TASK-15: Test + componente {Feature}DetailComponent
- [ ] TASK-16: Registrar rutas en sap-licensing.routes.ts
- [ ] TASK-17: Añadir entrada en navigation-data.ts

## Validación

- [ ] TASK-18: Gate de oro (/golden-diff) si la spec tocó plantillas o generator.ts
- [ ] TASK-19: Ejecutar suite completa (make test-back + make test-front)

---

## Regla del juego

Implementar **UNA** tarea, `make commit`, esperar aprobación del usuario antes de seguir.
Si una tarea parece > 1h de trabajo o > ~150 líneas, **partirla en subtareas** antes de empezar.
```

**Modo simplificado (2026-07-29)**: se trabaja directamente sobre `develop`, un commit atómico por
tarea, sin ramas ni PRs — ver la skill `git-workflow`.

**STOP** después de TASKS.md. Solo cuando el usuario apruebe TASKS.md se puede empezar a implementar.

## Por qué este orden

- Requirements primero evita que el código se desvíe de lo que se necesita.
- Design después fuerza pensar en la arquitectura antes de teclear.
- Tasks atómicas garantiza commits revisables y permite parar/retomar sin perder contexto.
