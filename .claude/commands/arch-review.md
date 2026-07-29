---
description: Audita un fichero o módulo contra las reglas de arquitectura del proyecto
author: Alfonso Cobelas <alfonso.cobelas@gmail.com>
allowed-tools: Read, Glob, Bash(grep:*)
---

# /arch-review — Auditoría arquitectónica

Revisa un fichero o módulo contra las 10 reglas inamovibles de arquitectura.

## Uso

`/arch-review {ruta}`

Donde `{ruta}` puede ser:

- Un fichero: `libs/backend/src/contexts/sap-licensing/modules/contracts/domain/contract.ts`
- Un directorio: `libs/backend/src/contexts/sap-licensing/modules/contracts/`
- Una capa: `libs/backend/src/contexts/sap-licensing/modules/contracts/domain/`

## Pasos

1. **Lee la skill `architecture-guard`** para refrescar las 10 reglas.

2. **Recorre cada fichero del ámbito indicado** y verifica:

   ### Imports
   - [ ] `libs/frontend` no importa `libs/backend` ni viceversa
   - [ ] `libs/shared/domain` no importa `@nestjs/*`, `@angular/*`, `typeorm`, `class-validator`
   - [ ] `domain/` no importa `@nestjs/*` ni `typeorm`
   - [ ] `application/` no importa de `infrastructure/`
   - [ ] No cruza bounded contexts excepto por la interface pública del módulo NestJS

   ### Barrels
   - [ ] Imports dentro de la lib van al fichero concreto, no a un barrel intermedio
   - [ ] Solo el `src/index.ts` raíz expone públicamente

   ### TypeORM
   - [ ] Toda `@Entity` declara `{ schema: '{context}' }`
   - [ ] No hay `@ManyToOne`/`@OneToMany`/`@JoinColumn` cruzando contextos
   - [ ] Índices declarados para campos únicos, FKs lógicas, campos de estado
   - [ ] Naming de índices: `IDX_{TABLA}_{CAMPOS}` en UPPER_SNAKE_CASE

   ### Dominio (si aplica)
   - [ ] AggregateRoot con `private constructor`
   - [ ] Campos inmutables como `readonly` directo, mutables con `_` + getter
   - [ ] `static create()` y `static fromPrimitives()` presentes
   - [ ] Setters privados, mutaciones por métodos de negocio
   - [ ] VOs con jerarquía base correcta (`StringValueObject`, `IntegerValueObject`, etc.)
   - [ ] Errores tipados (extends `BusinessRuleViolationError` o similar)

   ### Aplicación (si aplica)
   - [ ] Use cases reciben repositorios por DI (interface, no implementación)
   - [ ] `Promise.all` solo en operaciones genuinamente independientes
   - [ ] Validaciones antes de mutar (`exists()`, `get()`, etc.)
   - [ ] Handlers son delegación fina sin lógica

   ### Naming
   - [ ] Ficheros en kebab-case
   - [ ] Clases en PascalCase
   - [ ] Convenciones de naming respetadas (UseCase, Handler, Repository, Mapper, etc.)

3. **Reporta hallazgos**:

```
🔍 Auditoría arquitectónica: {ruta}

Ficheros revisados: {n}

✅ Conformidades: {n}
⚠️ Violaciones detectadas: {n}

Violaciones:

1. [REGLA-{N}] {nombre}
   Fichero: {ruta:linea}
   Detalle: {qué viola}
   Solución propuesta: {qué cambiar}

2. ...

Recomendación: {aprobar / corregir antes de commit}
```

4. **NO corrijas nada** — esto es solo una auditoría. Si hay violaciones críticas, propón al usuario que se corrijan antes de continuar.
