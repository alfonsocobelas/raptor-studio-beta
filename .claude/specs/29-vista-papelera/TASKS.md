# Tareas atómicas: Vista papelera

> Cada tarea = un commit atómico en develop. TDD: tests unitarios de emisión primero (specs del
> plugin) + gate de oro. Los modelos con `softDelete` (license, project) validan la emisión; los
> que no lo tienen (customer, contract) validan la no-regresión byte a byte.

---

## Emisión backend

- [ ] TASK-01 — bandera `trash` en `build-substitutions` + port: `matchingDeleted`,
      `countDeleted`, `restore` en el template del repositorio abstracto
- [ ] TASK-02 — repositorio TypeORM: implementación de los tres métodos (+ soporte en el
      repo base del kernel si hace falta)
- [ ] TASK-03 — repositorio Mongoose: implementación de los tres métodos
- [ ] TASK-04 — `Restore<Entity>UseCase` + input + handler
- [ ] TASK-05 — `SearchDeleted<Plural>UseCase` + handler (espejo del search)
- [ ] TASK-06 — controller: `GET /deleted` (antes de `:id`) + `POST /:id/restore` + wiring
      en el module
- [ ] TASK-07 — tests emitidos: use case restore + integración (dos motores)

## Emisión frontend

- [ ] TASK-08 — servicio: `trashRequest` + resource `/deleted` + `restore(id)`
- [ ] TASK-09 — componente papelera + ruta `<ruta>/papelera` + enlace en la toolbar del listado

## Gates

- [ ] TASK-10 — re-baseline de oro deliberado (license, project, apps) revisando el diff;
      customer y contract sin cambio alguno
- [ ] TASK-11 — el emitido compila y sus tests pasan (typecheck-emitted + suites del golden app)
- [ ] TASK-12 — e2e con navegador: borrar → papelera → restaurar en una app generada (si
      Docker disponible; si no, anotar bloqueo como en specs 15/16/17)
