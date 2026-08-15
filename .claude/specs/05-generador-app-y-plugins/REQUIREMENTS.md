# Spec: Generador de app y plugins (retroactiva)

> Spec retroactiva (2026-07-31): documenta trabajo YA implementado y verificado durante las
> sesiones de demos (concesionario/almacén). Se escribe a posteriori para que el diseño
> quede en el arnés SDD al nivel del resto del proyecto, no como propuesta.

## Contexto de negocio

Las specs 00-04 dejaron un generador de *módulos* excelente que emitía ficheros sueltos: no
existía forma de entregar a un cliente un **proyecto arrancable**. La petición de Alfonso
durante la demo del concesionario fue literal: "el generador de app cuando ejecuta el comando
de generar tiene que entregar un proyecto funcional… los package.json, los docker para hacer
pruebas… deben ser plugins… al ejecutar el comando debe salir un formulario preguntando qué
elegir". Esta spec cubre ese salto: de módulos a producto.

## User stories (formato EARS)

- WHEN ejecuto `npm run new` THEN un CLI me pregunta nombre, modelos (multiselección desde el registro), librería de componentes y plugins opcionales, y genera la app completa
- WHEN ejecuto `nx g @raptor/generators:app <n> --models=… --ui=… --plugins=…` THEN obtengo un proyecto con el layout del canon de referencia (apps/backend-api, apps/frontend-app, libs/backend, libs/frontend, libs/shared/domain, libs/ui) que instala, migra, siembra, compila, testea y corre
- IF no elijo ningún plugin THEN la app trae igualmente migraciones TypeORM (de fábrica, decisión 2026-07-31): migración inicial derivada de los modelos, synchronize:false y scripts generate/run/revert
- IF elijo `email` sin `auth` THEN auth se añade automáticamente (email publica adaptadores tras el puerto EmailSender que instala auth)
- WHEN elijo `--ui=material` THEN la misma app funciona con Angular Material sin que ninguna pantalla emitida cambie (ADR-003 nivel 1)
- WHILE se regenera sobre una app existente THEN lo escrito en los huecos `// @ai:begin` sobrevive; si el destino está git-ignorado, el generador avisa en alto
- IF una pantalla emitida (o editada a mano) importa `@spartan-ng/*` o `@angular/material` THEN `npm run lint:ui-boundaries` falla con fichero y línea
- WHEN corre el CI emitido (push/PR) THEN ejecuta typecheck + fronteras UI + unit + integración contra un Postgres de servicio + build del frontend

## Criterios de aceptación

- [x] Un comando emite proyecto completo: package.json, tsconfig, angular.json, docker local+test, Dockerfile, Makefile, CI, .gitignore, shell Angular con menú lateral y rutas derivadas
- [x] Esqueleto por COPIA LITERAL (scope fijo `@app`, sin EJS); solo rutas/nav/seed/test-repositories se templan (decisión de Alfonso: "empaquetar tal cual, templar solo contextos/módulos/dominio")
- [x] Registro único de modelos consumido por los 6 generadores; kernel deriva id-VOs; `--models` filtra por app
- [x] Plugins como manifiestos tipados `definePlugin` (deps, scripts, makeTargets, assets, apply); NO decoradores — misma ergonomía sin registro global ni reflect-metadata
- [x] 3 plugins opcionales: auth (IAM referencia: sesión opaca+cookie, 4 pantallas agnósticas de piel, guards APP_GUARD), email (ACS/SES/Brevo tras EmailSender, SDKs lazy), observability (telemetry verbatim, primer import de main.ts)
- [x] Migraciones de fábrica (retiradas del registro de plugins con tolerancia al nombre antiguo)
- [x] Nivel 1 ADR-003: contratos shared/components/ui con 2 pieles de API idéntica (spartan/material); 0 referencias a librería en lo emitido; guard de lint en la app
- [x] Tests emitidos EJECUTABLES: jest multi-proyecto (unit 146/146 y 111/111 en las demos; integración 23/23 contra Postgres real)
- [x] CLI `npm run new` interactivo con flags para CI
- [x] Verificación en navegador de ambas demos (Playwright + Postgres): login, CRUD persistido, export, reset-password por LogEmailSender

## Referencias (proyecto de referencia y diseño)

- Canon de layout y de infraestructura de test: `docs/referencia/` (apps/backend-api, libs/backend/tests/infrastructure)
- ADR-003 (aceptado, addendum 2026-07-31: spartan primera clase, material congelada)
- Decisiones de sesión registradas en la memoria del proyecto (2026-07-30/31)
