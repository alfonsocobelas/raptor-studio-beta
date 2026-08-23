# Spec: Auth por defecto — se retira `auth=none`

---

## Contexto de negocio

Decisión de producto (Alfonso, 2026-08-23): **todos los dashboards llevan autenticación**.
`auth=none` existía solo porque el auth aún no estaba desarrollado y aceleraba las demos; ya no
tiene razón de ser de cara al usuario. `single-tenant` pasa a ser el comportamiento por defecto
y único.

**La arista: mongo.** El plugin de auth emite persistencia TypeORM y exige `database=postgres`
(ranura `requires`). Una app mongo no puede llevar single-tenant hoy. Decisión: mongo queda
**aparcado con una excepción interna y visible** hasta portar el auth a Mongoose (spec futura,
Alfonso estima que no será complicado): de cara al usuario `none` no se ofrece, pero la
maquinaria conserva el proveedor para que mongo siga generando (sin auth, con aviso claro) y su
fixture de oro siga viva.

## User stories (formato EARS)

- **WHEN** se genera una app postgres sin decir nada de auth **THEN** sale con single-tenant (login, invitaciones, roles, Mi cuenta, rate limiting)
- **WHEN** el usuario mira el wizard del estudio o el formulario CLI **THEN** la autenticación NO se pregunta (no hay elección: siempre single-tenant en postgres)
- **WHEN** se genera con `database=mongo` **THEN** la app sale sin auth con un aviso explícito ("auth pendiente del port a Mongoose"), no con un error ni en silencio
- **IF** un comando guardado trae `--auth=single-tenant` **THEN** sigue funcionando (es el nuevo default)
- **IF** un comando guardado trae `--auth=none` con postgres **THEN** aviso de deprecación y se respeta temporalmente (compat, mismo trato que `--plugins=auth`) — o falla con mensaje claro; decidir en DESIGN
- **WHEN** el wizard ofrece la base de datos **THEN** la tarjeta de MongoDB indica la limitación ("sin autenticación hasta el port a Mongoose")

## Criterios de aceptación

- [ ] Ranura `auth` con default `single-tenant`; `none` fuera de `schema.json`, del wizard y de `tools/slots.json` como opción visible
- [ ] App mongo genera con aviso y sin auth; fixture `app-mongo` de oro sigue en verde
- [ ] La fixture `app` de oro no cambia (ya se genera con auth) salvo que el flag desaparezca del comando del gate
- [ ] El grupo "Autenticación" desaparece del wizard (una ranura con una sola opción elegible no se pregunta — regla existente)
- [ ] `sessionStore` sigue funcionando: su `requires auth=single-tenant` se cumple por defecto en postgres y bloquea en mongo con motivo claro
- [ ] typecheck-emitted y demos existentes (`taller`, etc.) regeneran sin `--auth`

## Referencias

- Ranura y validación: `libs/generators/src/generators/app/plugins/slots.ts` (SLOTS.auth, `normalizeLegacyPlugins`, `validateCombination`)
- Formulario: `libs/generators/src/generators/app/schema.json` + `slots-schema.spec.ts` (regla "no expone ranuras con un solo proveedor")
- Wizard: `apps/studio/libs/frontend/src/domains/studio/generate/generate-catalog.ts` (grupo auth y tarjeta multi-tenant "Próximamente")
- Gate de oro: `tools/golden-diff.sh` (`--plugins=auth,email` del gate app; el gate mongo sin auth)

## Fuera de scope (deliberado)

- Portar el auth a Mongoose (spec propia; hasta entonces mongo = excepción visible)
- Multi-tenant (sigue "Próximamente" en el wizard)
- Las vistas de sistema en el estudio (spec 57, depende de esta)

---

> ⚠️ **STOP** tras REQUIREMENTS: confirmar en particular el trato de `--auth=none` heredado
> (deprecación tolerada vs. error claro) antes del DESIGN.
