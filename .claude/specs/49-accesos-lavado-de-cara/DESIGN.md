# Diseño técnico: Accesos — lavado de cara + granularidad CRUD

> REQUIREMENTS aprobado 2026-08-17. Dos frentes: (A) partir `manage` en `create/edit/delete`
> de schema a app emitida; (B) reconstruir la pestaña Accesos según los mockups 30A/31B.

---

## A. Granularidad CRUD (schema → generador → app emitida)

### A1. `@raptor/schema` — el contrato

`resource-types.ts`:

```ts
export type AccessRole = 'user' | 'viewer'          // sin cambios

export interface AccessDefinition {
  /** Defecto: ['user', 'viewer'] */
  view?: AccessRole[]
  /** Defecto: manage ?? ['user'] */
  create?: AccessRole[]
  /** Defecto: manage ?? ['user'] */
  edit?: AccessRole[]
  /** Defecto: manage ?? ['user'] */
  delete?: AccessRole[]
  /** Azúcar legado (spec 46): create+edit+delete de golpe. El estudio ya no lo escribe. */
  manage?: AccessRole[]
  /** Por verbo de la máquina; defecto: ['user'] */
  transitions?: Record<string, AccessRole[]>
}
```

`access.ts` — `ResolvedAccess` pasa a `{ view, create, edit, delete, transitions }`:

```ts
const fallback = definition.access?.manage ?? ['user']
return {
  view: definition.access?.view ?? ['user', 'viewer'],
  create: definition.access?.create ?? fallback,
  edit: definition.access?.edit ?? fallback,
  delete: definition.access?.delete ?? fallback,
  transitions
}
```

Compatibilidad: un schema sin `access` o con solo `manage` resuelve EXACTAMENTE igual que hoy
(`manage: ['user']` era el defecto). Ningún diseño existente cambia de significado. La clave
granular gana a `manage` si conviven.

### A2. Generador — `build-entrypoints.ts` y plantillas

`EntryPointsEntry`: `writeRoles` se sustituye por `createRoles` / `updateRoles` / `deleteRoles`
(strings vía `rolesArgs`, como hoy). `readRoles` no cambia.

Mapa endpoint → capacidad (files-entrypoints/`__plural__.controller.ts.template`):

| Endpoint                    | Hoy          | Pasa a        |
| --------------------------- | ------------ | ------------- |
| `POST /`                    | `writeRoles` | `createRoles` |
| `POST /import`              | `writeRoles` | `createRoles` |
| `GET /`, `/export`, `/:id`, `/:id/history` | `readRoles` | `readRoles` (igual) |
| `GET /deleted`              | `readRoles`  | `readRoles` (listar la papelera es lectura) |
| `PUT /:id`                  | `writeRoles` | `updateRoles` |
| `DELETE /:id`               | `writeRoles` | `deleteRoles` |
| `POST /:id/restore`         | `writeRoles` | `deleteRoles` (restore es el reverso del borrado) |
| `POST /:id/<transition>`    | `transition.roles` | igual   |

Plantillas satélite:

- **Composición** (`files-composition-entry/…controller.ts.template`, 3× `writeRoles`):
  añadir/editar/quitar hijas = editar el agregado padre → `updateRoles`.
- **Adjuntos** (`files-attachments/…controller.ts.template`): lecturas `readRoles` (igual);
  subir/borrar adjunto = editar el registro → `updateRoles`.

Frontend emitido (`files/frontend/__fileName__-access.ts.template`):

```ts
export const CAN_CREATE_ROLES: readonly UserRoleEnum[] = [<%- entry.createRoles %>]
export const CAN_EDIT_ROLES:   readonly UserRoleEnum[] = [<%- entry.updateRoles %>]
export const CAN_DELETE_ROLES: readonly UserRoleEnum[] = [<%- entry.deleteRoles %>]
```

Consumidores:

- `__plural__-list.component.ts.template`: botón crear/import → `CAN_CREATE_ROLES`; acción
  editar → `CAN_EDIT_ROLES`; acción borrar y enlace a papelera → `CAN_DELETE_ROLES`.
- `__plural__-trash.component.ts.template`: restaurar → `CAN_DELETE_ROLES`.
- `TRANSITION_ROLES` sin cambios.

Gate: `/golden-diff` — el diff esperado es solo el cambio de decoradores/constantes; después
re-baseline justificado.

### A3. Fuera del generador pero afectado

- `flow-process.ts` y `app.ts` importan tipos de acceso: revisar compilación, sin cambio funcional.
- Frontera del estudio (`draft-resource.ts:315`): pasa `draft.access` tal cual — sigue válido
  porque el shape nuevo es superconjunto; el estudio escribirá las claves granulares.

## B. Estudio — la pestaña Accesos según 30A/31B

### B1. Anatomía (mockup → componentes)

```
┌────────────┬──────────────────────────────────────────┬──────────────────┐
│ ROLES      │  Qué puede hacer {rol}                   │  {rol} resumen   │
│ ▸ Admin    │  [Buscar entidad]   [Todas|Con acceso]   │  · visibles X/Y  │
│ ▸ Usuario  │  ┌─────────┬────┬─────┬─────┬──────┬───┐ │  · crear N       │
│ ▸ Consulta │  │ ENTIDAD │VER │CREAR│EDIT.│BORRAR│...│ │  · editar N      │
│            │  │ filas…  │ ✓  │  ✓  │  ✓  │  —   │   │ │  · borrar N      │
│ VER LA     │  └─────────┴────┴─────┴─────┴──────┴───┘ │  [barra]         │
│ TABLA POR  │  («...» = una columna por transición)    │  APLICAR COLUMNA │
│ Rol│Entid. │                                          │  Todo ver        │
│ │Diagrama  │  N DE M ENTIDADES                        │  Nada editar     │
│            │                                          │  Copiar de {rol} │
│ nota admin │                                          │                  │
└────────────┴──────────────────────────────────────────┴──────────────────┘
```

- **`access-sidebar.component.ts`** (se reescribe): raíl de roles — tarjetas Administrador
  («TODO»), Usuario, Consulta con el activo resaltado (borde primary como el mockup); debajo el
  conmutador «Ver la tabla por» **Rol | Entidad | Diagrama**; al pie la nota «Admin siempre
  puede todo; su fila no es editable». Sin contadores de personas (no existen).
- **`access-view.component.ts`** (se convierte en conmutador): según el pivote pinta
  la tabla por rol, la tabla por entidad o el diagrama de la spec 46.
- **`access-table.component.ts`** (nuevo): la tabla central. Pivote Rol: filas = entidades,
  columnas = Ver·Crear·Editar·Borrar + una por transición **del conjunto de la fila** (cada
  entidad pinta solo sus verbos; celda vacía si la entidad no tiene esa transición). Pivote
  Entidad: filas = roles (admin arriba, solo lectura), columnas = capacidades de ESA entidad;
  un selector de entidad en la cabecera. Cabecera con «Buscar entidad» y filtro «Todas | Con
  acceso» (solo pivote Rol). Pie «N de M entidades». Subtítulo de fila derivado:
  `{n} campos` `· rel. {Entidad}` (si tiene campo `ref`) `· máquina de estados` (si tiene `state`).
- **`access-summary.component.ts`** (nuevo, solo pivote Rol): resumen derivado (entidades
  visibles X de Y, puede crear/editar/borrar) + barra de proporción + acciones de columna:
  «Todo ver», «Nada editar» (limpia create/edit/delete y transiciones del rol), «Copiar de
  {el otro rol}». Con Administrador activo, el panel solo informa (sin acciones).
- **El diagrama existente** se extrae tal cual a `access-diagram-view.component.ts` (pan/zoom
  incluidos) y `access-view` lo monta cuando el pivote es Diagrama.

### B2. Estado de UI — `AccessUiService` (nuevo, no persiste)

Señales: `role: 'admin' | 'user' | 'viewer'` (defecto `user`), `pivot: 'role' | 'entity' |
'diagram'` (defecto `role`), `search: string`, `onlyWithAccess: boolean`, `entity: string`
(pivote Entidad). Es estado de sesión de la pestaña, NO viaja al diseño — el diseño solo
persiste la matriz vía `DesignStore.setResourceAccess` (misma puerta que hoy; la matriz se
escribe EXPLÍCITA y completa con las claves granulares, nunca `manage`).

### B3. Lógica derivada — pura y compartida

`apps/studio/libs/shared/domain/src/studio/access-table.ts` (nuevo, funciones puras + tests):

- `accessRows(resources)` → filas con capacidades `view/create/edit/delete` + transiciones y
  roles efectivos (usa `resolveAccess`; misma fuente que el diagrama — divergencia imposible).
- `toggleCapability(resource, capability, role)` → la `AccessDefinition` explícita siguiente
  (absorbe el `flip` que hoy vive en el componente).
- `roleSummary(resources, role)` → métricas del panel derecho.
- `applyColumn(resources, role, action)` → lote «todo ver» / «nada editar» / «copiar de rol».

`access-diagram.ts` se actualiza: elipses `Ver/Crear/Editar/Borrar {plural}` + transiciones
(4+t por entidad en vez de 2+t) con los roles granulares.

### B4. Estética

Reutilizar los tokens/clases del lavado de cara existente (`studio-rail`, `studio-eyebrow`,
`canvas-surface`): 30A/31B son el mismo lenguaje visual que Vistas/Modelo/Flujos. El guion «—»
de sin-permiso con el contraste corregido (nota de 31B): celda con borde discontinuo tenue y
guion `text-muted-foreground`, nunca invisible en claro. Celdas = botones (`<button>` con
`aria-pressed`), fila de Auditoría… no existe; la fila admin en pivote Entidad va atenuada y
`disabled` como los checkboxes de admin hoy.

## Testing

- **Schema**: `access.spec.ts` — defectos, azúcar `manage`, granular gana a `manage`.
- **Generador**: `access-roles.spec.ts` + specs de entrypoints — mapa endpoint→capacidad;
  gate `/golden-diff` con re-baseline justificado en el commit que toca plantillas.
- **Estudio**: funciones puras de `access-table.ts` y `access-diagram.ts` con vitest;
  `design-store-access.spec.ts` se extiende al shape nuevo. Los componentes nuevos usan
  `@Input()`/`@Output()` si necesitan montarse en tests (limitación JIT, backlog idea 5);
  el gate real de plantillas Angular es `npm run web:build` (AOT).
- **e2e/smoke**: actualizar `tools/smoke-access.ts` y regenerar capturas
  (`smoke-access-*.png`), tema claro y oscuro.

## Orden de construcción (esencia → fontanería)

1. Schema (`AccessDefinition`/`resolveAccess`) — todo lo demás depende de él.
2. Estudio: helpers puros → componentes (tabla, raíl, resumen, pivotes) — la parte visible
   que valida el diseño con los mockups.
3. Generador: entrypoints + plantillas + golden re-baseline.
4. Diagrama actualizado + smoke/capturas.

---

> ⚠️ **STOP**. No proceder a `TASKS.md` hasta aprobación explícita de este diseño.
