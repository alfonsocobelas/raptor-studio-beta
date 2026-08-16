# Spec: Accesos — lavado de cara (tabla de entidades) + granularidad CRUD

---

## Contexto de negocio

La pestaña **Accesos** del estudio (spec 46) quedó funcional pero espartana: un raíl estrecho con
mini-tablas de checkboxes por entidad y el diagrama de casos de uso como lienzo. Los mockups
**30A/31B** (`docs/style/Captura de pantalla 2026-08-16 a las 23.45.04.png` y `…23.45.15.png`,
también en `docs/style/Raptor Studio.html`) invierten el protagonismo: se piensa **por rol**
("Qué puede hacer Usuario"), con una tabla central entidad×capacidad, raíl izquierdo de roles y
panel derecho de resumen y acciones masivas.

Además del lavado de cara, esta spec **parte la capacidad `manage` en `create` / `edit` / `delete`**
(decisión 2026-08-16): el mockup muestra columnas Ver · Crear · Editar · Borrar y esa granularidad
viaja de verdad hasta la app generada (guards de los controladores emitidos y visibilidad de
acciones en el frontend emitido). Deja de existir el "todo o nada" de escritura: un rol puede
crear y editar sin poder borrar.

## User stories (formato EARS)

### Modelo de acceso (schema + generador)

- WHEN un resource-schema declara `access.create/edit/delete` THEN los controladores emitidos
  protegen POST con `create`, PUT/PATCH con `edit` y DELETE/restore con `delete`
- IF un schema no declara `access` THEN la política por defecto se mantiene equivalente a la
  actual: view `['user','viewer']`, create/edit/delete `['user']` — ningún diseño existente
  cambia de significado
- IF un schema antiguo declara `access.manage` THEN se acepta como azúcar y equivale a
  `create+edit+delete` con esos roles (compatibilidad; el estudio ya no lo escribe)
- WHEN el frontend emitido decide qué acciones pinta THEN usa constantes separadas
  (crear/editar/borrar) en lugar del único `CAN_MANAGE_ROLES`
- WHILE se regeneran las referencias de oro THEN el diff solo muestra el cambio esperado de
  guards/constantes (gate `/golden-diff`)

### Estudio — tabla de accesos por rol

- WHEN el usuario entra en Accesos THEN ve el raíl izquierdo con los tres roles (Administrador
  «TODO», Usuario, Consulta), el rol activo resaltado y la tabla central "Qué puede hacer {rol}"
- WHEN se pulsa una celda de la tabla THEN el permiso de esa entidad+capacidad se conmuta y
  persiste en el diseño (matriz explícita completa, como hoy)
- IF el rol activo es Administrador THEN la tabla se muestra en solo lectura ("Admin siempre
  puede todo; su fila no es editable")
- WHEN la tabla pinta las columnas THEN son Ver · Crear · Editar · Borrar, más una columna por
  transición de la máquina de estados de cada entidad (las transiciones no desaparecen)
- WHEN una fila de entidad se pinta THEN muestra su subtítulo real (nº de campos, relación,
  máquina de estados) derivado del diseño — nada inventado
- WHEN el usuario escribe en «Buscar entidad» THEN la tabla filtra las filas por nombre
- WHEN el usuario conmuta «Todas / Con acceso» THEN la tabla muestra todas las entidades o solo
  las que el rol activo puede ver
- WHEN el usuario usa las acciones de columna del panel derecho THEN se aplican en bloque al rol
  activo: «Todo ver», «Nada editar», «Copiar de {otro rol}»
- WHEN el panel derecho pinta el resumen THEN muestra métricas derivadas (entidades visibles
  X de Y, puede crear/editar/borrar) con la barra de proporción
- WHEN el usuario conmuta «Ver la tabla por» THEN alterna entre **Rol** (tabla del mockup),
  **Entidad** (pivote: filas de rol para una entidad) y **Diagrama** (el lienzo de casos de uso
  de la spec 46, que se conserva)
- WHILE no hay entidades en el diseño THEN se muestra el estado vacío con el enlace a Modelo
  (como hoy)

## Criterios de aceptación

- [ ] `AccessDefinition` expone `view/create/edit/delete/transitions`; `resolveAccess` resuelve
      defectos y la compatibilidad con `manage`
- [ ] Los controladores emitidos (CRUD, papelera/restore, composición, adjuntos) usan los roles
      granulares correctos por endpoint
- [ ] El frontend emitido separa la visibilidad de crear/editar/borrar
- [ ] Golden diff en verde tras re-baseline justificado
- [ ] La pestaña Accesos reproduce el layout 30A/31B: raíl de roles, tabla central con búsqueda
      y filtro, panel derecho de resumen y acciones de columna
- [ ] Tema claro y oscuro correctos (30A oscuro, 31B claro; el guion de «sin permiso» mantiene
      el contraste corregido)
- [ ] El diagrama de casos de uso sigue accesible como tercer pivote y refleja la nueva
      granularidad
- [ ] Los e2e/capturas del estudio se actualizan (smoke-access)

## Referencias (proyecto de referencia y diseño)

- Mockups: `docs/style/Captura de pantalla 2026-08-16 a las 23.45.04.png` (30A oscuro),
  `…23.45.15.png` (31B claro), `docs/style/Raptor Studio.html` (§30a/§31b)
- Spec 46 (`.claude/specs/46-accesos-y-casos-de-uso/`) — modelo de acceso actual y diagrama
- `libs/schema/src/lib/access.ts` y `resource-types.ts` — `AccessDefinition`/`resolveAccess`
- `libs/generators/src/generators/resource/build-entrypoints.ts` — `readRoles`/`writeRoles`

## Reglas de negocio aplicables

- Admin siempre puede todo y no se declara (spec 46); su fila/columna no es editable
- La matriz persiste EXPLÍCITA y completa: lo marcado es lo que hay, sin defectos escondidos
- Borrado = borrado suave (spec 38): la capacidad `delete` gobierna soft-delete, papelera y restore
- Nada de datos falsos ni botones muertos en el estudio (doctrina «sin demos»)

## Fuera de scope (deliberado)

- **«+ Nuevo rol»** (roles personalizados) — al backlog
- **«Ver la app como {rol}»** (impersonación en preview) — al backlog
- **«Regla por filas»** (row-level security, condiciones tipo "solo ve las muestras de su planta")
- Contadores de personas por rol (no existe esa población en el diseño)
- La barra de chat IA dentro de Accesos (la chat-barra global del estudio ya existe; no se
  duplica aquí)

---

> ⚠️ **STOP** después de rellenar este fichero. No proceder a `DESIGN.md` hasta aprobación explícita del usuario.
