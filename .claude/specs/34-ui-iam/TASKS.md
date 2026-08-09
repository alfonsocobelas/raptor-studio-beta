# Tareas atómicas: UI de IAM

> Cada tarea = un commit atómico en develop. TDD: test rojo en la suite de `generators` primero.
> Toca plantillas → gate de oro antes de cada commit que cambie lo emitido (re-baseline deliberado).

---

- [x] **TASK-01**: `iam-labels.ts` + `AuthService.isAdmin` en el kernel — test rojo en
      `auth-frontend-wiring.spec.ts` (con auth existe el fichero de labels; el kernel expone
      `isAdmin`), plantillas, verde, re-baseline.
- [x] **TASK-02**: `invite-user-dialog.component.ts` — test rojo (existe con auth, importa solo
      contratos neutrales, POST a `/auth/invitations` vía `UserService.invite`), plantilla, verde.
- [x] **TASK-03**: `users-list.component.ts` — test rojo (existe con auth, DataTable + selects de
      rol/estado, acciones rol/toggle, sin imports helm), plantilla, verde.
- [x] **TASK-04**: `session-footer.component.ts` + cirugía del shell y de rutas en
      `auth.plugin.ts` — test rojo (con auth: ruta `/users` y `<app-session-footer />` en el
      shell; sin auth: árbol sin rastro de IAM UI), implementación, verde.
- [x] **TASK-05**: Gate completo — hecho de forma continua: cada tarea llevó su re-baseline
      propio (`chore(golden)` tras cada feat) y los 6 gates quedaron en verde en cada commit.
      `typecheck-emitted` a **0 errores en las dos pieles** con auth activo:
      `--app=golden --ui=spartan --plugins=auth,email --infra=azure` y
      `--models=customer,contract,license,project --ui=material --auth=single-tenant`.
- [x] **TASK-06**: Verificación en navegador sobre `iamdemo` (app generada fuera del árbol,
      `--models=customer --auth=single-tenant`, Postgres docker + migraciones + seed):
      login admin → pie de sesión con identidad y rol → `/users` (los 3 sembrados) → invitar
      (aparece «Pendiente») → cambiar rol a Auditor → desactivar con aviso de sesiones →
      logout → login como `user@app.local` y la entrada «Usuarios» NO aparece.
      Evidencia: `apps/studio/e2e-23-usuarios-listado.png`, `e2e-26-usuarios-tras-acciones.png`,
      `e2e-27-no-admin-sin-usuarios.png`.
      · **La demo cazó un bug real** (regla «las demos detectan, no se parchean»): con pocos
      módulos el array `imports` del root module queda en una línea y la cirugía de
      `AuthModule` no prendía — la API arrancaba sin UNA SOLA ruta de auth. Ni el golden
      (fixture multilínea) ni el typecheck lo veían. Fix + test en `ed70e28`.
