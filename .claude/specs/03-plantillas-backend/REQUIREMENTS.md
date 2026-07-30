# Spec: Plantillas backend canónicas

## Contexto

Extender el generador del corte mínimo (entidad TypeORM) a un **corte multicapa canónico** del
módulo backend, manteniendo diff de oro vacío contra `contracts`. Alcance elegido tras auditar los
67 ficheros de la fixture: se generan los ficheros **derivables por dato sin escape hatches**;
los que arrastran lógica idiosincrática del sync de sap-licenses (puerto del repositorio y
repositorio TypeORM con finders `findMaintenanceByCaseId`/`findArchivable`, agregado, use cases,
phases, seeds) quedan como **código a mano post-generación** (regla "generar, no interpretar"),
documentado en DESIGN.

## Criterios de aceptación

- [ ] `application/config/search-<name>-config.ts` generado (query flags con orden explícito + notas)
- [ ] `domain/<name>-constants.ts` generado (constraints literales o referencia a SHARED_CONSTRAINTS)
- [ ] `domain/specifications/<name>-with-id.specification.ts` generado (100% estructural)
- [ ] `infrastructure/persistence/typeorm/<name>.mapper.ts` generado (conversiones de fecha y
      opcionales de primitives derivadas del schema)
- [ ] `npm run golden:diff` en verde con los 5 ficheros (entidad incluida)
- [ ] Tests del builder para las nuevas derivaciones

## Fuera de scope (documentado)

Puerto del repositorio, repositorio TypeORM, agregado, VOs, use cases/handlers/DTOs, controller,
module.ts, seeds y ficheros de sync — se posponen o quedan como edición manual (ver DESIGN).
