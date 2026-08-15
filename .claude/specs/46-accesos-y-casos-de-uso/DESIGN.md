# Diseño técnico: Accesos y diagrama de casos de uso

_Aprobado en el brainstorming del 2026-08-16. Regla de oro: **admin implícito siempre;
ausente = política actual** — el golden no se mueve sin que nadie lo pida._

## 0. El viaje del dato

```
 raíl Accesos ──► DraftResource.access ──► draftToResource ──► ResourceDefinition.access
      │                  (DesignStore,           (copia tal cual)        │
      │                   autosave)                                      ├─► defineResource
      ▼                                                                  │   (gate)
 access-diagram.ts ◄── diseño (entidades + máquinas + access)            ▼
 (dominio compartido,                                            generator.ts calcula
  derivación pura)                                               readRoles/writeRoles/
      │                                                          transitionRoles → las
      ▼                                                          plantillas interpolan
 access-view (lienzo, solo lectura)
```

## 1. Contrato (`@raptor/schema`, resource-types.ts)

```ts
/** Roles que obtienen la capacidad ADEMÁS de admin (admin siempre puede todo) */
export type AccessRole = 'user' | 'viewer'

export interface AccessDefinition {
  view?: AccessRole[]                        // defecto: ['user', 'viewer']
  manage?: AccessRole[]                      // defecto: ['user']
  transitions?: Record<string, AccessRole[]> // por verbo; defecto: ['user']
}

export interface ResourceDefinition { …; access?: AccessDefinition }
```

Gate en `defineResource` (todo con error accionable):

- roles legales (`user`/`viewer`) y sin duplicados en cada array
- cada clave de `transitions` existe en `stateMachine.transitions` (ambos viven en el
  recurso: se valida aquí, no en la frontera)
- `access.transitions` sobre un recurso sin `stateMachine` = error
- un array vacío es LEGAL: «solo admin» es una decisión, no un error

La resolución de defectos vive UNA vez en el schema (`resolveAccess(resource)` exportada):
la consumen el generador y `access-diagram` — divergencia imposible, patrón renderFlows.

## 2. Estudio

- **`DraftResource.access`** (mismo shape); `draftToResource` lo copia tal cual.
  `DesignStore` gana `setResourceAccess(name, access)` con autosave (patrón `state`).
- **`access-diagram.ts` en `shared/domain`**: derivación pura diseño → diagrama.
  Actores a la izquierda (Administrador / Usuario / Consulta), una caja de sistema por
  entidad con sus elipses de capacidad («Ver Facturas», «Gestionar Facturas», label de
  cada transición), aristas actor→capacidad según la matriz EFECTIVA (defectos resueltos
  por `resolveAccess`; admin conecta con todo). Reutiliza `viewport.ts`.
- **`access-sidebar.component`** (raíl `.studio-rail`): por entidad, matriz de checkboxes —
  filas Ver / Gestionar / transiciones, columnas Usuario y Consulta, Admin como columna
  fija atenuada. Sin entidades → estado vacío que manda al Modelo. Testids `access-*`.
- **`access-view.component`** (lienzo): pinta el diagrama, solo lectura; sustituye el
  placeholder del modo `access` en `studio-canvas.component.ts`.
- Runner JIT: la derivación es pura → vitest normal. Los componentes siguen la convención
  (`@Input()`/`@Output()` si hay que montarlos; si no, smoke de Playwright).

## 3. Frontera

`buildAppFile` construye `defineResource`, así que el gate del §1 aplica gratis;
`validateDesign` (studio-api) reenvía el problema con el mensaje accionable del estudio,
como las transiciones de la 43.

## 4. Emitido — backend

Hoy los `@Roles(...)` están escritos a mano en las plantillas (CRUD, composición,
export/import, adjuntos, historial, papelera, transiciones de la 43, pasos de proceso de
la 44). Cambio, regla 8 (plantillas tontas):

- `generator.ts` calcula con `resolveAccess`:
  - `readRoles` → list, get, export, historial, lecturas de adjuntos
  - `writeRoles` → create, update, delete, import, escrituras de adjuntos, restore
  - `transitionRoles[verbo]` → endpoint de la transición y su paso de proceso (44)
- Formato interpolado: `UserRoleEnum.ADMIN, UserRoleEnum.USER` (admin siempre primero).
- Sin plugin auth los decoradores se emiten igual que hoy (el decorador compartido existe
  siempre; solo el guard del plugin los hace cumplir).

## 5. Emitido — frontend

- El generador emite por dominio constantes calculadas (`CAN_MANAGE_ROLES`,
  `TRANSITION_ROLES`) y los componentes condicionan con un computed contra el rol de
  sesión de `AuthService`: «Nuevo», editar/borrar, import y los botones de transición.
- La entrada de nav de una entidad se oculta si el rol no tiene Ver (mismo dato; evita el
  enlace que lleva a un 403).
- Sin plugin auth el dev-auth es admin fijo → nada cambia en las demos sin IAM.

## 6. Tests y gate

- Suite de generators: fixture con matriz NO-default que ejercite las tres costuras
  (view sin viewer, manage vacío, transición con roles propios). El golden se queda con
  la política por defecto → `/golden-diff` vacío sin re-baseline.
- Estudio: tests de la derivación (dominio puro) + specs de raíl según convención JIT.
- Gate final: suite completa + `/golden-diff` + `typecheck:emitted` + `web:build` +
  navegador (estudio y demo con auth: viewer sin «Nuevo» y 403 real).

## Fuera

Chat proponiendo la matriz · roles con nombre libre · permisos por campo/registro.
