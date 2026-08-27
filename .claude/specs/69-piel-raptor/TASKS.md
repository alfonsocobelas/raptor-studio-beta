# Tareas atómicas: La familia raptor

> Cada tarea = un commit en develop. Implementar UNA, commit, esperar revisión.
> TDD estricto: test rojo primero, también en el derivador y en el descriptor del lienzo.

## El tema

- [ ] TASK-01: `chromaByStep` / `hueByStep` en `ThemeSurface` + `surfaceTokens`.
      Test primero: (a) un tema con croma por escalón emite el croma declarado en cada token;
      (b) **guarda de no-regresión**: los seis temas actuales emiten exactamente lo de hoy.
      **Gate**: `/golden-diff` vacío.
- [ ] TASK-02: tema `raptor` en `THEMES`. Test: los 26 tokens en claro y en oscuro coinciden
      token a token con `.theme-neutral` del `styles.css` del estudio (el test lee el fichero,
      no copia los valores: si el estudio cambia de paleta, el test lo canta).
      El selector del estudio lo recoge gratis (`PREVIEW_PALETTES` deriva de `THEMES`).

## El espejo del lienzo (deuda de la 68)

- [ ] TASK-03: `shell-descriptor.ts` + la plantilla genérica del lienzo; `cabina` y `suite`
      pasan a ser datos. Test: el DOM de los cuatro `data-testid` del mock (`mock-sidebar`,
      `mock-banner`, `mock-modules`, `mock-breadcrumb`) es el mismo antes y después para las dos
      pieles, y `actual` sigue sin shell propio.
      **Gate**: `npm run typecheck` del estudio.

## Las tres pieles

> Cada una en su commit y completa de punta a punta: preset (tokens + CSS que viste los seis
> hooks Y los contratos `[appbtn]/[appinput]/[appbadge]` en claro y oscuro), shell emitido,
> `schema.json`, `preview-settings.ts` y descriptor del lienzo.

- [ ] TASK-04: piel `taller`.
- [ ] TASK-05: piel `banco`.
- [ ] TASK-06: piel `rotulo`.

Test por piel: entra en `DESIGN_PRESETS` con su carpeta de override existente, el enum de
`schema.json` y el selector del estudio la listan, `design-drift.spec.ts` verde, y el CSS del
preset alcanza los seis hooks (test de la 67: por cada hook, al menos una regla).
**Gate por tarea**: `/golden-diff` vacío + `npm run typecheck`.

## Verificación

- [ ] TASK-07: tres apps generadas (una por piel, tema `raptor`), CONSTRUIDAS, dist servido
      estático y API simulada con `page.route`. Capturas de listado, diálogo, calendario y panel
      a `docs/style/smoke-69-<piel>-*`. Lo que cace se arregla en el GENERADOR, nunca en la app
      generada.

---

## Regla del juego

Implementar **UNA** tarea, commit, esperar aprobación.
