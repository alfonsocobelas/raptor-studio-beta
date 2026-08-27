# Spec: La familia raptor — tres pieles y el tema de la casa

---

## Contexto de negocio

Hasta hoy el acelerador emite apps con tres pieles (`actual`, `cabina`, `suite`) y seis temas, y
ninguna de las combinaciones se parece al producto que las genera: Raptor Studio tiene una
identidad calibrada a mano (papel cálido, tinta casi negra, naranja de la casa, lino en los
raíles) que vive sólo en el `styles.css` del estudio.

Esta spec la baja al emitido en las DOS ranuras que le corresponden:

- **el color** entra como el 7.º tema del catálogo (`raptor`), disponible con cualquier piel;
- **el cromo** entra como tres pieles nuevas (`taller`, `banco`, `rotulo`), disponibles con
  cualquier tema, maquetadas y elegidas el 2026-08-27 sobre el listado real emitido.

Las tres direcciones se validaron antes de escribir código (lienzo de maquetas, 2026-08-27) y
Alfonso las aprobó las tres: no son alternativas a elegir, son tres pieles del catálogo.

## User stories (formato EARS)

- WHEN un modelo declara `theme: { id: 'raptor' }` THEN el `styles.css` emitido lleva los tokens
  de la paleta del estudio, carácter a carácter, en claro y en oscuro
- WHEN un modelo declara `design: 'taller' | 'banco' | 'rotulo'` THEN la app emitida cambia de
  shell, de densidad y de cromo, y **los componentes van vestidos**: los seis hooks de piel y los
  contratos `[appbtn]/[appinput]/[appbadge]` (más sus gemelos `[hlm*]`)
- WHEN se elige una piel nueva en el panel del estudio THEN el lienzo la dibuja con el CSS real
  del preset y con su shell, igual que ya hace con `cabina` y `suite`
- IF una piel se combina con un tema que no es `raptor` THEN sus superficies siguen siendo
  coherentes: el cromo se deriva de los tokens del tema, no de hex fijos de la paleta raptor
- IF no se declara ni tema ni piel THEN no cambia un byte del emitido (gate de oro intacto)

## Criterios de aceptación

- [ ] `deriveTheme` admite croma por escalón y los seis temas actuales emiten exactamente lo mismo
- [ ] El tema `raptor` reproduce los tokens de `apps/studio/apps/frontend-app/src/styles.css`
      (bloques `.theme-neutral` claro y oscuro) token a token
- [ ] Las tres pieles aparecen en `schema.json` (enum + x-prompt), en `DESIGN_PRESETS` y en el
      selector del estudio
- [ ] `design-drift.spec.ts` sigue verde: ninguna piel cita clases inventadas y ningún hook
      queda sin vestir en las tres nuevas
- [ ] El espejo del lienzo deja de ser `@if` por piel: `cabina` y `suite` salen del descriptor
      con el mismo DOM que hoy
- [ ] Tres apps generadas, CONSTRUIDAS y capturadas (dist servido + API simulada), una por piel

## Referencias

- Maquetas aprobadas: lienzo «Piel Raptor» (2026-08-27), artboards `Main` (taller),
  `DireccionB` (banco), `DireccionC` (rotulo), `Paleta` (tema)
- Fuente de la paleta: `apps/studio/apps/frontend-app/src/styles.css` §`.theme-neutral`
- Vocabulario de hooks: `.claude/specs/67-pieles-alcanzan-los-bloques/DESIGN.md`
- Espejo del lienzo: `.claude/specs/68-el-canvas-lleva-la-piel/DESIGN.md`

## Reglas de negocio aplicables

- Ranuras separadas: el color es del TEMA, el cromo es de la PIEL (`design-presets.ts`, cabecera).
  Ninguna piel de esta spec pisa un token de color del tema.
- Una piel no aporta componentes: el DataTable y sus 65 tests son los mismos para todas.
- El CSS del preset va SIN `@layer` (si no, pierde contra las utilidades de Tailwind).
- Los tokens del preset se inyectan DENTRO del bloque del tema, detrás de los suyos.
- Los ids quedan congelados: `taller`, `banco`, `rotulo` — sin guiones (las claves con guion ya
  dieron un defecto en la demo de peritajes).

## Fuera de scope (deliberado)

- Tipografía propia por piel: las tres escriben con la pila del tema (decisión del 2026-08-25).
- Retirar o tocar `cabina` y `suite` más allá de la extracción al descriptor.
- Exponer `--brand` como token del catálogo de temas: el naranja entra por `ring` y por el CSS
  de las pieles, no como token nuevo del emitido.
