# Tareas atómicas: UI de IAM

> Cada tarea = un commit atómico en develop. TDD: test rojo en la suite de `generators` primero.
> Toca plantillas → gate de oro antes de cada commit que cambie lo emitido (re-baseline deliberado).

---

- [ ] **TASK-01**: `iam-labels.ts` + `AuthService.isAdmin` en el kernel — test rojo en
      `auth-frontend-wiring.spec.ts` (con auth existe el fichero de labels; el kernel expone
      `isAdmin`), plantillas, verde, re-baseline.
- [ ] **TASK-02**: `invite-user-dialog.component.ts` — test rojo (existe con auth, importa solo
      contratos neutrales, POST a `/auth/invitations` vía `UserService.invite`), plantilla, verde.
- [ ] **TASK-03**: `users-list.component.ts` — test rojo (existe con auth, DataTable + selects de
      rol/estado, acciones rol/toggle, sin imports helm), plantilla, verde.
- [ ] **TASK-04**: `session-footer.component.ts` + cirugía del shell y de rutas en
      `auth.plugin.ts` — test rojo (con auth: ruta `/users` y `<app-session-footer />` en el
      shell; sin auth: árbol sin rastro de IAM UI), implementación, verde.
- [ ] **TASK-05**: Gate completo — `/golden-diff` con re-baseline deliberado (commit
      `chore(golden)` propio), `npm run typecheck:emitted` a 0 errores.
- [ ] **TASK-06**: Verificación en navegador sobre una demo con auth (invitar, cambiar rol,
      desactivar, logout) + captura e2e; cierre de spec y ROADMAP.
