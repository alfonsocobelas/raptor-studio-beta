# Spec: Plantillas frontend — EXPLORADA Y POSPUESTA (2026-07-30)

## Medición que motiva el aplazamiento

Comparados los list components de oro (`customers` vs `contracts`) tras normalizar nombres:
**144 de 250 líneas difieren (~58%)**. Las divergencias no son solo binding (columns, badgeMaps):
hay extras por módulo (KPIs, archivado, gating por permisos `canWrite`, comentarios) escritos en
momentos distintos del proyecto. La entidad backend, en contraste, salió con diff vacío a la primera.

## Conclusión

El diff de oro frontend **no es alcanzable sin la uniformización C2 previa** de los 4 módulos
(prevista en la revisión crítica): igualar primero los componentes a mano (diff entre ellos vacío
módulo la sustitución de nombres) y construir la plantilla contra esa forma canónica.

## Camino propuesto (cuando se retome)

1. Pasada C2 de uniformización de los 4 list/dialog/detail components en la referencia (o decidir
   que la forma canónica es una síntesis nueva y re-baselinar fixtures).
2. Modelar el binding restante en el schema: `table.type: 'badge'` + badgeMap, actions, features.
3. Plantillas frontend + diff de oro como en backend.

Los bloques `table`/`form`/`list` del schema ya están tipados (spec 01) — el modelo está preparado.
