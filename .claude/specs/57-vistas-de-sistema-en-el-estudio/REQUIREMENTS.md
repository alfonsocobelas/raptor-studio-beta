# Spec: Auth en el diseño + vistas de sistema en el estudio

---

## Contexto de negocio

Hoy el lema "lo que ves es lo que se genera" se rompe en el IAM: la autenticación se elige en
una tarjeta efímera del wizard (no se persiste en el diseño ni en el historial) y las pantallas
que regala — login, recuperación, usuarios, Mi cuenta — no aparecen en ninguna parte del
estudio. El cliente las descubre en la app generada. La pestaña Accesos (spec 46/49) ya cubre la
parte conceptual (roles × capacidades); falta la parte visual y la persistencia de la decisión.

Decisión de diseño (conversación 2026-08-23): **término medio**. Las vistas de IAM NO se hacen
editables ni se modelan como bloques del schema (sería inner-platform effect, regla 7): se
muestran como **vistas de sistema en solo lectura**, la contrapartida inversa de la etiqueta
"Diseño aún no generable" — aquí es "esto te lo regala la autenticación, no se edita".

## User stories (formato EARS)

- **WHEN** el diseñador activa la autenticación en el estudio **THEN** la decisión se guarda en el diseño (autosave + historial), no solo en la sesión del wizard
- **WHEN** la autenticación está activa **THEN** el raíl de vistas muestra un grupo "Sistema" con Login, Usuarios y Mi cuenta, distinguible de las vistas del diseño
- **WHEN** el diseñador abre una vista de sistema **THEN** el lienzo la pinta en solo lectura (previsualización fija, sin drop de bloques, sin edición) con una nota "La trae la autenticación"
- **IF** la autenticación se desactiva **THEN** el grupo Sistema desaparece del raíl (sin tocar las vistas del diseño ni los accesos ya definidos)
- **WHEN** se abre el wizard de generar **THEN** la tarjeta de auth llega pre-sembrada con lo que dice el diseño (el wizard puede sobrescribirla puntualmente, el diseño manda como default)
- **IF** un diseño antiguo no declara auth **THEN** se comporta como hasta ahora (auth none, sin grupo Sistema): compatibilidad total

## Criterios de aceptación

- [ ] `auth` persistido en el diseño (`DesignPage`/estado del estudio), con autosave e historial (undo/redo)
- [ ] Grupo "Sistema" en el raíl con las 3 vistas cuando auth activa; ausente cuando no
- [ ] Vista de sistema en el lienzo: previsualización estática fiel a lo que emite el generador (login, users-list, mi cuenta), sin edición ni drop
- [ ] El wizard siembra `auth` desde el diseño; `sessionStore` sigue siendo decisión del wizard (es infra, no diseño)
- [ ] Diseños existentes en `.studio/designs/` cargan sin migración manual
- [ ] Smoke del estudio actualizado

## Preguntas abiertas (validar con Alfonso ANTES del diseño técnico)

1. ¿Dónde vive el interruptor de auth en la UI? (¿pestaña Accesos, que ya es el territorio IAM, o ajustes del diseño?)
2. ¿La previsualización de las vistas de sistema se dibuja a mano (mock estático) o se renderizan los componentes reales del emitido en el runner? (El runner ya compila componentes — spec 35 — pero los del emitido no están en el estudio.)
3. ¿"Mi cuenta" y "Usuarios" se listan siempre con auth, o "Usuarios" solo si el rol admin existe? (Hoy los 3 roles son fijos.)

## Referencias

- Raíl y lienzo: `apps/studio/libs/frontend/src/domains/studio/design/views-sidebar.component.ts`, `canvas-page.component.ts`, `studio-modes.ts`
- Estado y persistencia: `design/design-store.ts`, `design-history.service.ts`, `.studio/designs/`
- Wizard: `generate/generate-page.component.ts` (`defaultSelection`), `generate/generate-catalog.ts`
- Lo que emite el generador (la verdad a previsualizar): `libs/generators/src/generators/app/plugins/assets-auth/libs/frontend/src/domains/{auth,iam}/`
- Precedente de etiqueta: memoria `etiqueta-diseno-aun-no-generable`

## Fuera de scope (deliberado)

- Editar las vistas de IAM o modelarlas como bloques del schema (inner-platform, regla 7)
- Exponer `sessionStore` en el diseño (es infra: se queda en el wizard, arreglado en `70cd6f33`)
- El shell admin completo con nav-user (backlog de rescates)

---

> ⚠️ **STOP**: hay preguntas abiertas de experiencia de usuario. Validar con Alfonso antes de DESIGN.md
> (esencia antes que fontanería: sin demos, decidir mirando el estudio).
