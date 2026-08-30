# Diseño técnico: Roles personalizados (spec 76)

## Idea central

Los roles personalizados se declaran **una vez, a nivel de app** (`AppDefinition.roles`),
viajan por el diseño del estudio (`.studio/designs/*.json`, clave raíz `roles`) y se
inyectan en dos frentes:

- **Validación**: `defineResource` acepta un conjunto ampliado de roles otorgables.
- **Emisión**: las plantillas IAM dejan de tener la lista literal y la reciben como
  sustitución calculada en el generador (plantillas tontas, lógica en `generator.ts`).

`admin` sigue implícito. `user` y `viewer` siguen fijos con sus defectos. Un rol nuevo
nace sin capacidades (opt-in puro): `resolveAccess` no cambia.

## Contrato (`libs/schema`)

```ts
// app-types.ts
export interface RoleDefinition {
  /** kebab-case, máx. 20 chars (VARCHAR(20) de la migración IAM), ≠ admin/user/viewer */
  name: string
  /** Etiqueta de presentación, 1-40 chars */
  label: string
}
export interface AppDefinition {
  ...
  /** Roles adicionales a admin/user/viewer; participan en la matriz de accesos */
  roles?: RoleDefinition[]
}
export const ROLE_LIMITS = { count: 7, name: 20, label: 40 } as const
```

- `AccessRole` pasa de `'user' | 'viewer'` a `string` (documentado: user/viewer o un rol
  declarado en `AppDefinition.roles`). La seguridad de tipos real la da la validación,
  igual que con los verbos de transición.
- `defineResource(definition, options?: { extraRoles?: string[] })`: `validateAccess`
  valida contra `['user','viewer', ...extraRoles]`. Mensaje de error lista los válidos.
- `defineApp` valida `roles`: patrón/longitud del nombre, colisión con
  admin/user/viewer, duplicados, tope `ROLE_LIMITS.count`, label presente.
- `resolveAccess` **sin cambios** (defectos user/viewer; rol nuevo = opt-in).

## Generador (`libs/generators`)

Nueva función pura `buildRoleSubstitutions(roles: RoleDefinition[])` (en el plugin auth o
en un helper compartido) que produce las cadenas para las plantillas:

- `roleEnumMembers`: `ADMIN = 'admin', USER = 'user', VIEWER = 'viewer', PERITO = 'perito'`
  (miembro = `constantName` del nombre; `back-office` → `BACK_OFFICE`).
- `roleValuesList`: `'admin', 'user', 'viewer', 'perito'` (VO y auth-types union).
- `roleCheckList`: para el `CHECK (role IN (...))` de la migración.
- `roleLabelEntries` / `roleVariantEntries`: labels declaradas; variant `'outline'` para
  los personalizados.
- `roleSeedUsers`: un usuario `<name>@app.local` por rol personalizado.

Puntos que pasan de literal a sustitución (mismo output byte a byte sin roles extra):

1. `shared-domain/files/auth/auth-enums.ts.template` → miembros del enum.
2. `assets-auth/.../user-role.vo.ts.template` → `VALUES`.
3. `assets-auth/.../auth-types.ts.template` → union `UserRoleValue`.
4. `assets-auth/.../seed/local-seed.ts.template` → usuarios de seed extra.
5. `assets-auth/libs/frontend/.../iam-labels.ts.template` → labels y variants.
6. `app/plugins/auth.plugin.ts:443-451` → lista del CHECK SQL.
7. `app.ts:1198` → `defineResource(r, { extraRoles })` con los roles del app-file.
8. `rolesArgs` (`build-entrypoints.ts:290`) → `UserRoleEnum.${constantName(role)}` (hoy
   `toUpperCase()`; equivalente para user/viewer, correcto para kebab-case).

El propio estudio tiene un espejo manual de `auth-enums.ts` (`apps/studio/libs/shared/
domain/src/auth/auth-enums.ts`): no se toca (el estudio no usa roles personalizados para
su propia identidad).

## Estudio

### Dominio compartido (`apps/studio/libs/shared/domain/src/studio/`)

- `AppDraft`/design JSON: nueva clave raíz opcional `roles: RoleDefinition[]`;
  serialización condicional (ausente si vacío — los diseños existentes no cambian).
- `access-table.ts`: `AccessActorRole` pasa a `string`; `ROLE_ORDER`/`ROLE_ROWS` dejan de
  ser constantes y se calculan de `['user','viewer', ...designRoles]`; `roleSummary` y
  helpers reciben la lista. `admin` sigue especial (fila fija «todo»).
- `draft-resource.ts` / `draftToResource`: sin cambios de forma (access ya viaja tal
  cual); el gate de validación (`validate-proposal.ts:124` y el generate del studio-api)
  pasa `extraRoles` a `defineResource`.

### UI (`apps/studio/libs/frontend/.../design/`)

- `access-sidebar.component.ts`: las tarjetas de rol se derivan del diseño; botón
  «+ Nuevo rol» (nombre + etiqueta, validación inline) y borrado de rol personalizado
  (al borrar, se limpia el rol de todas las matrices `access` del diseño).
- `access-table.component.ts` / `access-view.component.ts` / `access-ui.service.ts`:
  filas/columnas dinámicas; el tipo del signal `role` pasa a `string`.
- `design-store.ts`: acciones `addRole` / `removeRole` + persistencia vía autosave.

### studio-api

- El app-file que entrega a `nx g app` incluye `roles` cuando el diseño los tiene.
- `validate-proposal.ts` y el chat: el prompt del adapter menciona la clave `roles`
  (opcional, mínimo: que no la rompa).

## App emitida

- Guard, decorador y navegación no cambian de código: reciben más miembros del enum.
- Pantalla de usuarios IAM: el select de rol y los badges se alimentan de
  `USER_ROLE_LABELS`/`VARIANTS` generados → los roles nuevos aparecen solos (verificar
  que `users-list.component.ts.template` itera sobre labels y no sobre literales).
- Migración IAM: CHECK con la lista completa. `role VARCHAR(20)` casa con el tope 20.

## Decisiones técnicas

- **Roles a nivel de app, no de recurso**: un rol es un actor de toda la app; evitar
  redeclararlo por recurso (duplicación y deriva).
- **`AccessRole = string` + validación**: mismo patrón que los verbos de transición;
  mantener una union generada sería inner-platform.
- **admin intocable e implícito**: ADR-006 completo (permisos recurso:acción) queda para
  otra spec; esta solo amplía el RBAC plano existente.
- **Variant fija `outline` para roles nuevos**: sin selector de color; YAGNI.
- **Sin migración de datos**: roles = configuración de generación (regla de negocio).

## Riesgos identificados

- **Golden diff**: 6 plantillas tocadas → el diff con fixtures congeladas debe quedar
  vacío (sin roles extra, las sustituciones reproducen el literal actual). Gate /golden-diff
  antes de cada commit de plantillas.
- **Espejo del lienzo**: la pestaña Accesos del estudio es la única UI afectada; el shell
  del lienzo no pinta roles → sin riesgo de deriva del espejo.
- **`rolesArgs` con kebab-case**: `toUpperCase()` produciría `BACK-OFFICE` (inválido);
  usar `constantName` y cubrirlo con test.
- **Chat del estudio**: una propuesta de la IA con roles no declarados debe caer en el
  gate de validación, no en el generador.
