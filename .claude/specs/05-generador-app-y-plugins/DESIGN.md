# Diseño: Generador de app y plugins

> Retroactiva: describe lo construido. Los porqués en presente; la evidencia, al final.

## Composición, no monolito

`@raptor/generators:app` ORQUESTA los generadores existentes (kernel, root, shared-domain,
frontend-kernel, resource×N) sobre un staging y RECOLOCA su salida al layout del canon:

```
apps/<n>/
├── apps/backend-api/          main.ts (telemetry primero si observability) + Dockerfile
├── apps/frontend-app/         shell (menú lateral) + rutas derivadas + tsconfig app
├── libs/backend/src/          kernel + root.module + contexts/<ctx>/modules/<plural>
├── libs/backend/tests/        infrastructure (arranger+setup+repos module) + modules/<plural>
├── libs/frontend/src/         core (servicios+guards+constantes) / shared (contratos UI + piel) / domains
├── libs/shared/domain/src/    DTOs front⇄back
├── libs/ui/                   solo spartan: helm materializado por @spartan-ng/cli al crear
└── esqueleto literal          package.json, tsconfig*, angular.json, docker/, Makefile, CI, .gitignore
```

Reglas de recolocación no obvias (las profundidades de import las exigen): mocks de repos en
`tests/modules/<p>/mocks` (4 niveles), mothers/builders en `domain/mothers` y vo-tests en
`domain/value-objects` (5); servicios de recurso en `core/services`, pantallas en features.

## Esqueleto literal + capa por piel

`files-skeleton/` se copia byte a byte (sufijo .template solo para esquivar el build del
plugin); `files-skeleton-ui/<piel>/` se copia DESPUÉS y puede sobrescribir (styles.css).
El scope `@app` es fijo: sin interpolación no hay bugs de interpolación. Nombres de BD
fijos (app_local/app_test) por la misma razón: el compose no se templa, la config se alinea.

## Plugins: manifiesto tipado

`definePlugin({ name, description, dependencies, devDependencies, scripts, makeTargets,
assets, schemas, apply(tree, ctx) })`. El generador funde manifiestos en package.json y
Makefile y ejecuta apply() con contexto (root, backendSrc, frontendSrc, models, scope).
Decorador descartado: exigiría registro global y reflect-metadata en el build del plugin
sin ganar ergonomía. El ensamblado "a la Nest" queda para la app emitida, no para el plugin.

Migraciones NO son plugin (2026-07-31): el módulo existe pero appGenerator lo aplica
siempre. Un esquema versionado no es opcional.

## Nivel 1 (ADR-003) — lo que costó de verdad

Contratos en `shared/components/ui` con API pública idéntica por piel (verificado por hash
de firmas). Lecciones que condicionan futuros contratos, documentadas también en el ADR:
el portal de la librería no sobrevive a 2 niveles de ng-content; el `<dialog>` nativo vive
en el top layer por encima de los overlays CDK (→ overlay propio); MatButton no puede ser
hostDirective; matInput exige ser hijo de mat-form-field; Tailwind v4 deja border-color en
currentColor (→ cada piel puentea tokens; Material vía @theme→--mat-sys-*); el tema Material
pide Roboto sin fallback (→ @fontsource autohospedado).

## Tests emitidos ejecutables — el gate que faltaba

El diff de oro compara texto: no puede ver que una fixture sea TS inválido o que un test
contradiga el invariante del VO. Compilar y EJECUTAR lo emitido cazó, en dos tandas:
- llave sin cerrar en _fb.group (fixture rota baselinada), ruta numérica incompleta,
  helpers ToLabel inexistentes, mocks con imports incompilables y sin remove()
- clasificador de vo-tests que exigía aceptar lo que el VO rechaza (min/ensure/noInner/email)
- randomHelpers de únicos ignorando MIN; builder inventando literales de enum; numéricos en 0 bajo MIN
- winston importado estáticamente sin declararse (arrancaba por hoisting del workspace)

Regla operativa que queda: cada artefacto emitido nuevo se compila Y se ejecuta al menos
una vez en una app real antes de baselinarse.

## CLI

`npm run new` (tsx: el paquete de generadores es ESM y ts-node/CJS no puede requerirlo).
Multiselección real de modelos y plugins desde los registros; flags espejo para CI; email
implica auth; inyecta NX_PREFER_NODE_STRIP_TYPES=false (quirk de Node 24 con __dirname).

## Evidencia de verificación

- Demo spartan (concesionario) y material (almacén) generadas DE CERO y verificadas en
  navegador con Postgres real; la segunda sin ningún retoque manual.
- Unit 146/146 y 111/111; integración 23/23; gate de oro 226 ficheros vacíos (60+72+40+54).
- CI: cada paso del workflow es un comando ya verificado en local; YAML parseado y scripts
  referenciados comprobados contra el package emitido.
