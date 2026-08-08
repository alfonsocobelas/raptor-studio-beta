# Tareas atómicas: Vista papelera

> Cada tarea = un commit atómico en develop. TDD: tests unitarios de emisión primero (specs del
> plugin) + gate de oro. Los modelos con `softDelete` (license, project) validan la emisión; los
> que no lo tienen (customer, contract) validan la no-regresión byte a byte.

---

## Emisión backend

- [x] TASK-01 — bandera `trash` en `build-substitutions` + port: `matchingDeleted`,
      `countDeleted`, `restore` en el template del repositorio abstracto
- [x] TASK-02 — repositorio TypeORM: implementación de los tres métodos (+ soporte en el
      repo base del kernel si hace falta)
- [x] TASK-03 — repositorio Mongoose: implementación de los tres métodos
- [x] TASK-04 — `Restore<Entity>UseCase` + input + handler
- [x] TASK-05 — `SearchDeleted<Plural>UseCase` + handler (espejo del search)
- [x] TASK-06 — controller: `GET /deleted` (antes de `:id`) + `POST /:id/restore` + wiring
      en el module
- [x] TASK-07 — tests emitidos: use case restore + integración (dos motores)

## Emisión frontend

- [x] TASK-08 — servicio: `trashRequest` + resource `/deleted` + `restore(id)`
- [x] TASK-09 — componente papelera + ruta `<ruta>/papelera` + enlace en la toolbar del listado

## Gates

- [x] TASK-10 — re-baseline de oro deliberado (license, project, apps) revisando el diff;
      customer y contract sin cambio alguno
- [x] TASK-11 — el emitido compila y sus tests pasan (typecheck-emitted + suites del golden app)
- [x] TASK-12 — e2e con navegador: borrar → papelera → restaurar en una app generada (si
      Docker disponible; si no, anotar bloqueo como en specs 15/16/17)

---

## Cierre (2026-08-08)

- E2E con navegador sobre una app generada con `vehicle` (que ganó `softDelete` para estrenar
  la papelera en la demo del concesionario): evidencias `apps/studio/e2e-10..13-papelera-*.png`
  (listado con enlace, borrado visible en papelera, papelera vacía tras restaurar, registro
  de vuelta al listado).
- Integración emitida contra Postgres real: 27/27, incluida la suite `trash` de project.
- Typecheck del emitido: 0 errores; suite unit emitida 386/386.
- Correr por primera vez la integración del oro destapó y arregló 4 defectos latentes del
  generador (ajenos a la papelera): `defaultRaw` con comillas TS en el SQL, tabla del hijo de
  composición ausente en la migración, tipos por defecto sin `column` (boolean→VARCHAR) y
  columnas array sin `[]`; además el arranger de tests ahora desactiva los triggers de FK.

### Limitaciones anotadas

- La papelera muestra el botón «Exportar» del DataTable sin cablear (el botón es incondicional
  en el componente y `data-table.ts.template` estaba en manos de otra sesión): pendiente un
  input `showExport` y ocultarlo en la papelera.
- El seed de `contract` (modelos legacy de sap-licenses) viola `noInnerWhitespace` en
  `contractNumber`: la siembra del oro aborta ahí. Es de los samples, no del pipeline.
