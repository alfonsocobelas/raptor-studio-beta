# Spec: Golden fixtures y gate ejecutable

## Contexto de negocio

La validación por referencias de oro (maestro §6) necesita dos piezas que hoy no existen: las
**fixtures congeladas** (copia inmutable de los módulos de oro de `docs/referencia`, que está
gitignored y podría cambiar) y un **gate ejecutable** que regenere y compare de una pasada.
Hasta ahora el diff se hacía a mano contra `docs/referencia`.

## User stories (formato EARS)

- WHEN ejecuto `npm run golden:diff` THEN se regeneran todos los modelos registrados y se comparan contra `tools/golden-fixtures/`, con reporte por entidad y exit code ≠ 0 si hay diffs
- IF el generador emite un fichero THEN se compara contra el fichero homólogo de la fixture; los ficheros de la fixture que el generador aún no emite NO fallan (cobertura incremental)
- IF intento editar `tools/golden-fixtures/` con Write/Edit THEN el guard lo bloquea (re-baseline solo por procedimiento deliberado)
- WHILE crecen las plantillas THEN la cobertura del gate crece sola (compara lo generado, no una lista hardcodeada)

## Criterios de aceptación

- [ ] `tools/golden-fixtures/contracts/` congelado desde `docs/referencia` (backend module + frontend feature) y versionado
- [ ] Salida del generador reestructurada a `<plural>/backend/…` (y futuro `frontend/…`) para espejar la fixture
- [ ] `tools/golden-diff.sh` + `npm run golden:diff` funcionando, con reporte por entidad
- [ ] El gate pasa en verde con la plantilla actual (entidad TypeORM)

## Fuera de scope (deliberado)

- Fixtures de customer/license/project (se congelan cuando sus modelos se registren)
- Uniformización C2 de los 4 módulos (se abordará al validar las 4 entidades)
