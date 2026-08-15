# Spec: Schema lib (`@raptor/schema`)

## Contexto de negocio

El resource-schema es **el contrato único del acelerador**: de él salen a la vez el backend y el
frontend generados. Hoy vive de forma provisional como tipos mínimos dentro del generador
(`libs/generators/.../models/model-types.ts`, spec 00). Esta spec lo formaliza como lib propia
`libs/schema` (`@raptor/schema`): `defineResource()`, los tipos completos del formato canónico
(campos con vo/query/table/form, list, relations, detail) y la validación estructural del modelo,
incorporando las 5 decisiones ratificadas el 2026-07-30 (skill `schema-authoring`).

Resuelve además la corrección A4 de la revisión crítica: hoy conviven dos formatos de schema
(el array de la guía §3 usado en spec 00 y el objeto keyed de `resource-schema-customers.md` §2);
esta spec **unifica en uno**.

## User stories (formato EARS)

- WHEN escribo un `*.model.ts` con `defineResource({...})` THEN TypeScript me autocompleta y valida la estructura completa (fields, list, relations, detail) en tiempo de compilación
- IF un campo declara `table.show: true` sin `label` THEN la validación lo rechaza con un mensaje que nombra el campo y lo que falta
- IF un campo declara `unique: true` y es opcional THEN la semántica registrada es `ifPresent` (decisión 1)
- IF un campo declara `relation` hacia otro recurso THEN el drill-down del padre es derivable desde ese dato (decisión 3), sin duplicarlo en el padre
- WHEN el generador consume un modelo THEN lo hace a través de los tipos de `@raptor/schema` (se elimina `model-types.ts` provisional)
- WHILE `libs/schema` exista THEN no importa ningún framework ni tooling (`@nestjs/*`, `@angular/*`, `typeorm`, `ejs`, `@nx/devkit`) — es TypeScript puro (regla 11 de architecture-guard, vigilada por el guard de hooks)

## Criterios de aceptación

- [ ] Lib `libs/schema` creada (`@raptor/schema`), TypeScript puro, con barrel único
- [ ] Formato **unificado**: un solo shape de schema (decidir array vs objeto keyed en DESIGN, con criterio)
- [ ] Tipos completos del formato canónico: identidad del recurso, `fields` (type/origin/vo/constraints/query/table/form/unique/relation), `list`, `relations`, `detail`
- [ ] `defineResource()` con validación estructural y mensajes de error útiles (campo + motivo)
- [ ] Las 5 decisiones ratificadas codificadas en tipos/validación donde aplique
- [ ] `schemaVersion` incluido (mejora C-schemaVersion de la revisión: coste cero hoy, evita arqueología mañana)
- [ ] El generador de la spec 00 migrado a `@raptor/schema` (adiós `model-types.ts`), con el **diff de oro de contract aún vacío**
- [ ] Suite verde (tests de validación con TDD) y lint con boundaries

## Referencias (proyecto de referencia y diseño)

- `docs/resource-schema-customers.md` (formato canónico completo + fidelidad §4)
- `docs/guia-generador-nx.md` §3 (forma mínima usada en spec 00)
- `docs/revision-arquitectura-acelerador.md` (A4 unificar formato, schemaVersion)
- `.claude/skills/schema-authoring/SKILL.md` (decisiones ratificadas)

## Reglas de negocio aplicables

- "Generar, no interpretar": la validación rechaza lo malformado, no intenta interpretarlo
- Regla 11 architecture-guard: `libs/schema` es TypeScript puro
- Las 5 decisiones ratificadas (2026-07-30)

## Fuera de scope (deliberado)

- Plantillas nuevas o campos que la entidad de contract no necesite aún (query/table/form se tipan
  pero solo se consumen cuando lleguen las specs 03-04)
- La composición padre-hijo en detalle (B3 de la revisión) — se tipa `relations` pero su semántica
  de generación llega con las plantillas
- Cualquier runtime de validación de datos de negocio (los VOs son cosa del código emitido)

---

> ⚠️ **STOP** — revisar y aprobar antes de pasar a DESIGN.md.
