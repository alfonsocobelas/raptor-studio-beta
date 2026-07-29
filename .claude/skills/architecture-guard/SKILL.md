---
name: architecture-guard
author: Alfonso Cobelas <alfonso.cobelas@gmail.com>
description: >
  Use when adding imports, creating new modules, structuring folders, adding NestJS
  providers, configuring Nx project boundaries, or when the user asks about layering,
  Clean Architecture, DDD, bounded contexts, dependencies between modules.
  Use also before any commit that touches imports, module.ts files, or moves files
  between layers.
---

# Guardia de arquitectura — reglas inamovibles

Estas reglas no se discuten. Si una petición las viola, **señálalo antes de continuar** y propón la solución correcta.

## Las 10 reglas de oro

1. **Cero acoplamiento horizontal**: `libs/frontend` nunca importa de `libs/backend` ni viceversa.
2. **`shared/domain` agnóstico de framework**: solo TypeScript puro. Prohibido `@nestjs/*`, `@angular/*`, `typeorm`, `class-validator`, `class-transformer`, etc.
3. **Apps sin lógica**: `apps/backend-api` y `apps/frontend-app` son carcasas. Solo importan libs.
4. **Barrel único por lib**: toda lib Nx expone `src/index.ts` como único punto público externo. **Dentro** de la lib, imports directos al fichero concreto — sin barrels intermedios.
5. **Boundary enforcement en CI**: configurado vía `@nx/eslint-plugin` con `nx/enforce-module-boundaries`.
6. **El dominio no conoce el framework**: ningún archivo dentro de `domain/` puede importar `@nestjs/*` ni `typeorm`.
7. **La aplicación no conoce HTTP ni persistencia**: los use cases no importan de `infrastructure/`.
8. **Schema-per-context obligatorio**: cada entidad TypeORM declara `{ schema: '{context}' }`. Prohibido omitir el schema o usar `public` para entidades de negocio.
9. **Sin joins cross-context**: ninguna relación TypeORM (`@ManyToOne`, `@OneToMany`, `@JoinColumn`, FK) cruza el límite de un Bounded Context. Comunicación entre contextos = invocación directa de interfaces de módulo.
10. **Sin foreign keys cross-schema en base de datos**: las migraciones no pueden generar `REFERENCES` a tablas de otro schema.

## Reglas adicionales del acelerador (este repo)

Las 10 reglas de arriba gobiernan el **código emitido** por las plantillas (canon: `docs/referencia/libs/`).
En el propio repo del acelerador rigen además:

11. **`libs/schema` es TypeScript puro**: prohibido `@nestjs/*`, `@angular/*`, `typeorm`, `ejs`, `@nx/devkit`.
12. **Las plantillas no mencionan entidades concretas** (solo huecos EJS y `__name__`).
13. **`tools/golden-fixtures/` es de solo lectura** (re-baseline deliberado vía skill `golden-diff`).
14. **Plantillas de features no importan `@spartan-ng/*`** (ADR-003 Nivel 1: emiten contra shared).
15. **Los adapters de infra se copian/referencian, no se generan** (ADR-004): puertos en `libs/infra/ports`,
    un directorio por adapter, test de conformidad por puerto.

## Checklist al añadir un import

Cuando vayas a añadir un import, verifica en orden:

1. **¿El archivo está en `libs/shared/domain/`?**
   - ¿El import es framework-agnostic? Si importa `@nestjs/*`, `@angular/*` o `typeorm`, **PARA**.

2. **¿El archivo está en `domain/` de un módulo backend?**
   - ¿El import es de `@nestjs/*` o `typeorm`? **PARA**. Mover esa lógica a infrastructure.
   - ¿El import es de `application/` o `infrastructure/` del mismo módulo? **PARA**. La dependencia va al revés (infrastructure depende de domain).

3. **¿El archivo está en `application/` de un módulo backend?**
   - ¿El import es de `infrastructure/`? **PARA**. Use cases no conocen HTTP ni persistencia.

4. **¿El archivo está en cualquier parte de `libs/backend/`?**
   - ¿Importa de `libs/frontend/`? **PARA**. Violación de cero acoplamiento.

5. **¿El archivo está en cualquier parte de `libs/frontend/`?**
   - ¿Importa de `libs/backend/`? **PARA**. Violación de cero acoplamiento.

6. **¿Cruzas bounded contexts** (ej: módulo de `sap-licensing` importa de `catalog`)?
   - **Solo permitido**: importar la interface pública del módulo destino (el barrel `src/index.ts` de su módulo NestJS).
   - **Prohibido**: importar entidades TypeORM, repositorios concretos, agregados o VOs del otro contexto.
   - Si necesitas datos de otro contexto, usa el use case o repositorio expuesto en su `module.ts`.

7. **¿El módulo necesita resolver datos de otro contexto en la misma transacción?**
   - Usa el `TransactionManager` de `shared/`. Nunca coordines transacciones desde el controlador.

## Checklist al crear una entidad TypeORM

```typescript
@Entity({ schema: 'sap_licensing', name: 'contracts' }) // ← schema OBLIGATORIO
@Index('IDX_CONTRACTS_CUSTOMER_ID', ['customerId']) // ← índice por FK lógica
@Index('IDX_CONTRACTS_CONTRACT_NUMBER', ['contractNumber'], { unique: true }) // ← unique
export class TypeOrmContractEntity {
  // ⚠️ Nunca relaciones que crucen schemas
  // ❌ @ManyToOne(() => TypeOrmCustomerEntity)  si Customer vive en otro schema
}
```

- **Sin `tenantId`**: el multi-tenancy se eliminó deliberadamente (spec `10-drop-tenant`). NO añadir `tenantId` a ninguna entidad, agregado, DTO ni tabla, aunque el prototipo o specs antiguas (05-contracts, 06-licenses) lo muestren.
- Índices: campos únicos, FKs lógicas, campos de estado, compuestos para queries frecuentes.
- Convención de naming: `IDX_{TABLA}_{CAMPOS}` en UPPER_SNAKE_CASE.

## Checklist al crear una migración

```sql
-- 1. Crear schema si no existe
CREATE SCHEMA IF NOT EXISTS sap_licensing;

-- 2. Crear tabla con schema explícito
CREATE TABLE sap_licensing.contracts (...);

-- 3. Crear índices en la misma migración (no en otra después)
CREATE INDEX IDX_CONTRACTS_CUSTOMER_ID ON sap_licensing.contracts (customer_id);

-- ❌ Prohibido: REFERENCES a tablas de otro schema
-- ALTER TABLE sap_licensing.contracts ADD CONSTRAINT ... REFERENCES other_schema.table(id);
```

## Reglas de borrado — sin cascadas en BD

Las reglas de negocio sobre qué pasa con los registros hijos al borrar **no** se delegan a la base de datos.

- **Prohibido `ON DELETE CASCADE`** para ejecutar borrados de negocio. La BD borraría los hijos por su cuenta sin pasar por el agregado ni el use case: sin invariantes, sin validaciones, sin soft-delete, sin poder vetar el borrado. La regla queda escondida en el DDL y diverge en silencio cuando cambia la semántica (ej.: con soft-delete el `CASCADE` queda inerte porque nunca se borra físicamente el padre).
- **El borrado en cascada se orquesta explícitamente en el use case** (capa de aplicación): testeable, visible y bajo control del dominio.
- FKs lógicas: índice sí; `REFERENCES ... ON DELETE CASCADE`, no.

## Cuando detectes una violación

1. **PARA**. No completes la tarea.
2. Reporta al usuario:
   ```
   🛑 Violación de arquitectura detectada:
   - Regla violada: {n}. {nombre}
   - Fichero: {ruta}
   - Línea: {número}
   - Causa: {descripción concreta}
   - Solución propuesta: {qué hacer}
   ```
3. Espera decisión del usuario antes de continuar.

## Nota sobre `libs/shared/domain/`

Esta librería es el ÚNICO punto de unión front↔back. Solo va aquí:

**Sí**:

- Interfaces y tipos de DTOs (`ContractDto`, `LicenseDto`, `OffsetPaginatedOutput<T>`, `CursorPaginatedOutput<T>`)
- Enums del dominio compartidos (`LicenseMetricEnum`, `ContractStatusEnum`, `MandatoryActivityType`)
- Constantes de dominio que se usan en ambos lados (`LICENSE_THRESHOLDS`)
- Tipos de error de respuesta HTTP (`ErrorResponse`)

**No**:

- Value Objects con lógica de validación (eso es backend)
- Entidades TypeORM, repositorios, decoradores
- Cualquier lógica de negocio
