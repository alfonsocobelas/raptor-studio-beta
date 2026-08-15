# Spec: Accesos y diagrama de casos de uso

> Acordada en el brainstorming del 2026-08-16 (idea §7 del backlog del estudio, nacida en el
> brainstorming de la spec 43). Cierra la pestaña «Accesos» que el lavado de cara dejó como
> placeholder.

---

## Contexto de negocio

El emitido ya tiene autorización real pero cableada en duro: tres roles fijos (`ADMIN`,
`USER`, `VIEWER`), `RolesGuard` global y `@Roles(...)` escritos a mano en las plantillas con
una política única (lecturas abiertas a viewer, escrituras admin+user). El diseñador no
puede decir «solo el supervisor aprueba» — el caso jugoso que motivó la idea en la 43.

Esta spec convierte esa política en **matriz declarable actor→capacidad**: el diseñador
reparte capacidades entre los roles en la pestaña Accesos, el lienzo pinta el diagrama de
casos de uso derivado (una fuente, dos vistas — patrón model/state/flow-diagram), y la
matriz viaja hasta el emitido: `@Roles()` calculados y botones/nav condicionados por rol.
No produce cuerpos de método — no compite con estados (43) ni con flujos (44).

Decisiones cerradas en el brainstorming:

- **Actores = los tres roles fijos del IAM.** Roles con nombre libre quedan para una spec
  futura por regla de los dos.
- **Capacidades = Ver / Gestionar por entidad + una por transición de su máquina.** Ni «solo
  dos gruesas» (pierde el caso jugoso) ni por-endpoint (matriz ilegible, inner-platform).
- **Admin implícito y no negociable**: la matriz solo decide sobre `user` y `viewer`.
- **Raíl edita, lienzo pinta**: el diagrama es derivado y solo lectura, como los demás.
- **Ausente = política actual**: ningún diseño existente cambia de significado y el
  golden-diff queda vacío sin re-baseline (misma jugada que `brief`).

## User stories (formato EARS)

### Estudio

- WHEN el diseñador abre Accesos THEN el raíl lista las entidades con su matriz de
  checkboxes (filas: Ver / Gestionar / cada transición de su máquina; columnas: Usuario y
  Consulta; Admin pintado fijo y atenuado) y el lienzo pinta el diagrama de casos de uso
- WHEN cambia un checkbox THEN el diseño persiste (autosave) y el diagrama se rehace
- IF la entidad no tiene máquina de estados THEN su matriz solo ofrece Ver y Gestionar
- IF el diseño no tiene entidades THEN el modo Accesos muestra un estado vacío que manda
  a la pestaña Modelo

### Frontera

- IF `access.transitions` cita un verbo que no existe en la máquina de la entidad THEN se
  rechaza con error accionable (patrón de la 43)
- IF `access.transitions` aparece en una entidad sin máquina THEN error

### Emitido

- WHEN un recurso declara `access` THEN los `@Roles(...)` de sus endpoints salen de la
  matriz — Ver → list/get/export/historial/lecturas de adjuntos; Gestionar →
  create/update/delete/import/escrituras de adjuntos/papelera; admin siempre incluido
- WHEN una transición declara sus roles THEN su endpoint (43) y su paso de proceso
  convergido (44) los usan
- WHEN `access` está ausente THEN se emite exactamente la política actual (golden intacto)
- WHEN el frontend emitido corre con un rol sin Gestionar THEN no ve los botones de
  escritura (Nuevo, editar, borrar, import) ni los de transición que no le tocan
- IF el rol no tiene Ver sobre una entidad THEN su entrada de nav no aparece
- WHILE la app se genera sin plugin auth THEN nada cambia visualmente (el dev-auth es admin)

## Fuera de alcance

- Roles con nombre libre declarados por el diseñador.
- El chat proponiendo la matriz (prompt + schema): spec posterior si se echa en falta.
- Permisos por campo o por registro.

## Criterios de aceptación

- [ ] `defineResource` valida `access` (roles legales, sin duplicados, verbos existentes,
      transitions sin máquina = error) con mensajes accionables
- [ ] La pestaña Accesos edita la matriz por entidad y el lienzo pinta el diagrama derivado
- [ ] Los `@Roles(...)` emitidos salen de la matriz; ausente = política actual y
      `/golden-diff` vacío sin re-baseline
- [ ] Botones y nav del frontend emitido condicionados por rol de sesión
- [ ] Suite completa + `web:build` + `typecheck:emitted` + comprobación en navegador
      (estudio + demo con auth donde un viewer no ve «Nuevo» y recibe 403 en la API)
