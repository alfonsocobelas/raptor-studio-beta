# Spec 36: Retirar la piel material

> Decisión de Alfonso (2026-08-09), tras medir que las dos pieles emiten apps casi
> indistinguibles (12 ficheros distintos de ~750; listado y diálogo idénticos byte a byte):
> la variabilidad visual NO va a venir de una segunda librería de componentes, sino de
> **presets de diseño sobre spartan** (ranura nueva, spec futura). Material se elimina.

## Contexto de negocio

Mantener material vivo tiene coste permanente y rendimiento visual casi nulo: cada componente
nuevo del kernel exige segunda implementación, su DataTable no tiene suite, arrastra el defecto
del `sortColumnInput` sin usar y 5 de sus contratos son Tailwind imitando Material con un azul
hardcodeado. El puerto ADR-003 ya cumplió su función (validado con 2º adapter real); **los
contratos neutrales se QUEDAN** — son la base de los presets de diseño y de cualquier piel
futura que un cliente exija.

## Qué se elimina y qué se conserva

- Se elimina: proveedor `material` de la ranura `ui`, `files-ui/material`, `files-theme/material`,
  overrides de esqueleto material si los hay, dependencias `@angular/material`/`@fontsource/roboto`
  del package emitido en esa rama, y su rastro en `slots.json`/wizard del estudio.
- Se conserva: los contratos UI neutrales (`shared/components/ui/*`), la ranura `ui` (con un solo
  proveedor por ahora — la ranura es el punto de re-entrada si un cliente exige Material),
  y la «aproximación material» del lienzo del estudio se retira con el proveedor.

## Criterios de aceptación

- [ ] `--ui=material` falla con error claro («proveedor retirado») o desaparece del schema
- [ ] `npm run slots` regenera `slots.json` sin material; el wizard del estudio no lo ofrece
- [ ] Suite de generators verde; 6 gates de oro vacíos; `typecheck:emitted` a 0
- [ ] ROADMAP y memoria actualizados (la piel deja de estar «congelada»: está retirada,
      recuperable de git si un cliente la exige — anotar el último commit que la contiene)

## Fuera de scope

- La ranura/presets de diseño (spec propia tras elegir maquetas)
- Tocar los contratos neutrales
