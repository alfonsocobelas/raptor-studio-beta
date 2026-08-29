# ROADMAP — Acelerador de Dashboards

> Mapa de specs del proyecto, derivado de la secuencia por riesgo del documento maestro (§9).
> Regla: **profundidad antes que anchura** — un recurso perfecto antes que muchos a medias.
> Las specs se crean con `/spec-new` cuando llega su turno; este mapa solo ordena la intención.

## Fase 1 — Núcleo del generador (el 70-80% de probabilidad de éxito)

| Nº  | Spec                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Objetivo                                                                                                         | Estado        |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------- |
| 00  | ✅ `generador-recurso` [DONE]                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Workspace Nx + plugin `@raptor/generators` + primera plantilla (entidad TypeORM de `contract`) validada por diff | ✅ Completada |
| 01  | ✅ `schema-lib` [DONE]                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | `libs/schema`: `defineResource`, tipos, validación del modelo (cerrando las 5 decisiones §5)                     | Pendiente     |
| 02  | ✅ `golden-fixtures`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Congelar los 4 módulos de oro desde `docs/referencia` + comando/target de diff                                   | Pendiente     |
| 03  | ✅ `plantillas-backend` (corte canónico)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Módulo backend completo (domain + application + infrastructure) con diff vacío para `contract`                   | Pendiente     |
| 04  | ✅ `plantillas-frontend` — cerrada de facto el 2026-08-08: la app de oro entera SE SIRVE por primera vez con 0 errores (ng serve/esbuild). Los cuatro huecos que la mantenían abierta cayeron esa sesión: enums reales en `<entity>-enums.ts` (los dialogs los usan como valores), DTO con el `dtoName` del modelo (LicenseWithConsumptionDto), módulo `<entity>-labels` emitido desde el propio modelo (badgeMap→options→capitalizado) y mocks con literales para las unions. Evidencia: e2e-18-dialog-contrato.png (dialog con lookup de cliente, dates, selects tipados y labels en español) | Vista completa (list + dialog + detail + service + rutas) con diff vacío                                         | ✅ 2026-08-08 |
| 05  | `validacion-4-entidades`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Las 4 referencias de oro generan con diff vacío (gate completo)                                                  | Pendiente     |

## Fase 2 — Catálogo de infra (ADR-004) — ampliada 2026-07-30 a petición de Alfonso

| Nº  | Spec                    | Objetivo                                                                                                                                                                                                                                                | Estado        |
| --- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| 06  | `infra-ports`           | `FileStoragePort` + suite de conformidad reutilizable                                                                                                                                                                                                   | ✅ 2026-07-30 |
| 07  | `adapter-storage-azure` | `AzureBlobFileStorage` (Blob) con tests de SDK mockeado                                                                                                                                                                                                 | ✅ 2026-07-30 |
| 08  | `config-azure`          | Plugin de config: loader JSON por entorno + resolver `vault.*` de Key Vault (copiar de referencia)                                                                                                                                                      | Pendiente     |
| 09  | `composition-root`      | Registro de adapters + `.env.template` + scaffolding Terraform Azure (desde `docs/referencia/iac/`)                                                                                                                                                     | Pendiente     |
| 10  | `adapter-storage-s3`    | Adapter S3-compatible (cubre **AWS S3, Cloudflare R2, MinIO local**) — valida el puerto con el 2º proveedor real; conformidad contra MinIO en docker                                                                                                    | Pendiente     |
| 11  | `adapter-storage-gcs`   | Adapter Google Cloud Storage (3º barato una vez validado el puerto)                                                                                                                                                                                     | Pendiente     |
| 12b | `auth-plugin`           | ✅ Puertos (PasswordHasher, SecureTokenGenerator, Clock, SessionStore sobre primitivas) + adapters argon2/crypto/system-clock/in-memory + **RedisSessionStore** (TTL nativo + índice por usuario para logout-everywhere; single-tenant, cookie-session) | ✅ 2026-07-30 |
| 12  | `secrets-port`          | `SecretsPort` + adapters: **Azure Key Vault** (referencia) · **Doppler** · **Bitwarden/Infisical** (free-tier para stacks Cloudflare)                                                                                                                   | Pendiente     |
| 13  | `observability-port`    | `AppLogger`/telemetría: **App Insights** (referencia) · **Prometheus+Grafana** (prom-client, self-host free) · **Sentry**                                                                                                                               | Pendiente     |
| 14  | `plantillas-tests`      | El generador emite también los tests del módulo (mothers, builders, repository mock, tests de VOs/use cases) — hoy los módulos de oro los tienen y el generador no los produce                                                                          | Pendiente     |
| 15  | `kernel-config-infra`   | Replicar del esqueleto de referencia: config por entornos JSON, logger, filtros/interceptores, health checks, Dockerfiles, CI                                                                                                                           | Pendiente     |

Nota (regla de los dos, ADR-004): la ampliación multi-cloud la pidió Alfonso el 2026-07-30. Orden de
ROI: S3-compatible primero (un adapter cubre 3 proveedores y valida el puerto), GCS después. Cómputo
sigue fuera (Cloudflare Workers ≠ contenedor Node — ADR-004 §6).

## Fase 3 — Bordes (bajo demanda, no especulativo)

| Nº    | Spec                      | Objetivo                                                                                                                                                        | Estado                                                                                                    |
| ----- | ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| 09    | `ia-pre-generacion`       | IA redacta el `*.model.ts` desde NL/SQL/captura, bajo gate                                                                                                      | Bajo demanda                                                                                              |
| 10    | `ia-post-generacion`      | Huecos `// @ai:begin…@ai:end` + gate determinista                                                                                                               | Bajo demanda                                                                                              |
| —     | `ui-nivel-2`              | Contratos headless + adapters de piel (ADR-003)                                                                                                                 | Solo con cliente real                                                                                     |
| —     | `adapter-storage-s3`      | 2º proveedor: valida la abstracción del puerto                                                                                                                  | Solo con cliente AWS                                                                                      |
| —     | `arquetipo-bridge-api`    | Perfil `bridge-api` (ref. ip-opentext-cmis-api)                                                                                                                 | Solo con proyecto real                                                                                    |
| 06    | `mongo-persistence`       | Motor alternativo `--database=mongo` (Mongoose): adapters de persistencia + arrange de tests (docker replSet) + fixture golden mongo                            | **Activa, re-encajada sobre la spec 23** (TASK-01..05 hechas; TASK-06..12 = rellenar `mongo.provider.ts`) |
| ✅ 05 | `generador-app-y-plugins` | Proyecto arrancable en un comando: esqueleto literal, plugins (auth/email/observability), migraciones de fábrica, 2 pieles, tests emitidos ejecutables, CI, CLI | **Hecha (retroactiva 2026-07-31)**                                                                        |
| —     | `demo-app-gate-visual`    | ~~App de demo~~ → cubierto por spec 05 (demos verificadas con Playwright); queda solo integrar el gate visual como paso reproducible                            | Parcialmente cubierta                                                                                     |
| —     | `gitflow-completo`        | Reinstaurar ramas/PRs/rulesets (base: spec 51 de la referencia)                                                                                                 | Cuando madure                                                                                             |

## Fase 4 — Editor visual de schemas (visión 2026-07-31, ver `docs/vision-editor-visual-schema.md`)

Chat + lienzo schema-driven: el usuario y la IA editan el schema (nunca código) y el lienzo lo
renderiza con los componentes reales de `libs/ui`. Decisión ancla cerrada: schema-driven, no
diseño libre traducido. Fases (cada una útil por sí sola, ejecutar tras el trabajo en curso):

| Fase | Pieza                                                         | Estado                                                                                                                                                                                                                                                     |
| ---- | ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A    | App/page-schema + soporte en el generador (sin UI)            | ✅ 2026-07-31 (spec 07: `defineApp`, registro `APPS`, `--app=demo` ≡ opciones planas byte a byte)                                                                                                                                                          |
| B    | Visor read-only: schema → preview vivo (app Angular monorepo) | ✅ 2026-07-31 (spec 08: `apps/studio` dogfood `--app=boutique`, visor `/studio` con DataTable/KpiCard reales, verificado en navegador)                                                                                                                     |
| C    | Interactividad: hover-borrar, drag&drop (CDK) → muta schema   | ✅ 2026-07-31 (spec 09: mutaciones puras con gate defineApp, AppStore, paleta del catálogo, panel JSON; smoke Playwright)                                                                                                                                  |
| D    | Chat IA que edita el schema (structured output + gate)        | ✅ 2026-07-31 (spec 10: ChatPort con adapters Anthropic/fake, gate defineApp+composeApp en servidor y cliente, panel en /studio)                                                                                                                           |
| E    | Wizard de plugins (db, infra, auth…)                          | ✅ 2026-07-31 (spec 11: `--appFile` en el generador + wizard en /studio con descarga del schema y comando exacto; verificado end-to-end)                                                                                                                   |
| F    | Escritorio (Electron/Tauri) — solo si hace falta              | ✅ 2026-07-31 resuelta como **generación in situ sin empaquetar** (spec 12, decisión de Alfonso): botón «Generar aquí» vía `studio-api` local (chat+generate sin Postgres). Electron queda instalado como devDep del estudio para la comparativa opcional. |

## Fase 5 — Ampliación del catálogo de vistas (brainstorming 2026-08-07)

Principio rector acordado: **añadir componentes poco a poco**, priorizando las vistas que se
DERIVAN de flags que el resource-schema ya declara (el schema sabe más de lo que las vistas
explotan). El schema NO aprende a describir procesos (workflows, transiciones, permisos por
estado): ahí empieza el inner-platform effect (regla 7) y lo raro se edita a mano.
_Revisión 2026-08-15 (spec 43): las TRANSICIONES DE ESTADO sí entraron — no como lenguaje,
sino como diagrama de semántica cerrada (estados + flechas = definición total, sin cuerpos
que interpretar). El resto del principio sigue vigente._

Orden acordado: **tanda A (latente) → tanda C (analítica) → tanda B (import)**, siempre por
detrás del trabajo activo (spec 15). Una spec por componente, cada una con su gate de oro.

| Nº  | Spec                                                         | Objetivo                                                                                                                                                                                                                                                                    | Estado        |
| --- | ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| A1  | 🗑️ `vista-papelera` (spec 29) — **RETIRADA 2026-08-27**      | Se emitió y se ha vuelto a quitar entera del generador (endpoints, casos de uso, puerto y adapters, vista y ruta). El borrado suave sigue siendo el defecto: lo archivado deja de verse y ya no vuelve desde la aplicación                                                  | 🗑️ 2026-08-27 |
| A2  | ✅ `vista-gantt` (spec 30)                                   | Schema `gantt` (exige period), página/ruta/nav `· cronograma`, barras con eje mensual y seed de intervalos escalonados; contract lo estrena. E2E con captura (e2e-17/18) tras desbloquear la spec 04 en la misma sesión                                                     | ✅ 2026-08-08 |
| A3  | ✅ `historial-cambios` (spec 31)                             | Flag `history` (no derivado de audit): tabla global `shared.audit_events`, AuditTrailPort mejor-esfuerzo en ambos motores, eventos en los 4 use cases de escritura (update con diff), `GET /:id/history` y timeline en la ficha (e2e-19). Actor pendiente de la ranura auth | ✅ 2026-08-08 |
| C1v | ✅ `widgets-analiticos` (spec 32)                            | Dashboard: `count-by` (barras por enum), `kpi-count` (conteo condicionado) y `series` (12 meses) — SIN backend nuevo: compuestos de conteos filtrados sobre el listado. Sumas/medias quedan para un futuro endpoint de agregación (C2v). E2e e2e-20                         | ✅ 2026-08-08 |
| B1v | 🗑️ `import-csv-validado` (spec 33) — **RETIRADA 2026-08-28** | Se emitió y se ha vuelto a quitar entera del generador: endpoint `POST /import`, caso de uso en dos fases, diálogo con parser, botón «Importar» y la bandera `list.features.import` del schema                                                                              | 🗑️ 2026-08-28 |

## Fase 6 — Rescates de la referencia (backlog auditoría 2026-07-31)

| Nº  | Spec                           | Objetivo                                                                                                                                                                                                                                                                                                                                                                                 | Estado        |
| --- | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| 34  | ✅ `ui-iam` (spec 34)          | Rescate nº 2: UI de IAM sobre el backend ya emitido — `/users` (listar/buscar/filtrar, invitar, cambiar rol, desactivar/reactivar) + pie de sesión en el shell (identidad, Usuarios solo admin, logout). Sobre los contratos UI neutrales: 0 errores en las dos pieles. De propina la demo cazó el bug del `AuthModule` fuera del `imports` en línea única (`ed70e28`). E2e e2e-23/26/27 | ✅ 2026-08-09 |
| 35  | ✅ `tests-datatable` (spec 35) | Rescate nº 4: el runner emitido ya compila componentes (antes NG0303 en todo binding) y cada app generada trae **65 tests** de su DataTable. La suite del canon contra el emitido destapó tres defectos reales: `sortField` sin resolver de vuelta, `valueMap` sin desplegable de filtro y el `test-setup` sin los polyfills de jsdom                                                    | ✅ 2026-08-09 |

| 37 | ✅ `presets-de-diseno` (spec 37) | Ranura `design` con tres presets: `actual` (por defecto, diff de oro vacío), `cabina` (centro de operaciones, cromo en los dos temas) y `suite` (ERP: banda de marca, pestañas de módulo, rejilla). Nace de medir que spartan↔material dejaba las apps indistinguibles. La verificación en navegador cazó el defecto de cascada: el CSS del preset dentro de `@layer` perdía contra las utilidades de Tailwind | ✅ 2026-08-10 |
| 38 | `borrado-suave-canonico` (spec 38) | El borrado emitido pasa a soft delete por defecto; el caso de uso marca las relacionadas en una transacción; cero lógica de negocio en Postgres. Nace del 500 de la demo Solaris al borrar padres con hijos (2026-08-10). REQUIREMENTS con 3 preguntas abiertas | Abierta |
| 36 | ✅ `retirar-material` (spec 36) | La ranura `ui` pasa a un único proveedor (`spartan`); `--ui=material` se rechaza antes de emitir nada. Fuera `@angular/material`/`@fontsource/roboto` del package emitido (`@angular/cdk` se conserva: lo usan las primitivas headless de spartan), fuera `files-ui/material`/`files-theme/material`/`files-skeleton-ui/material`. La ranura y los contratos UI neutrales se conservan como punto de re-entrada. Último commit con material viva: `103f24d`. Suite 524 ✅ · 6 golden vacíos ✅ · typecheck emitido 0 errores | ✅ 2026-08-10 |

Banco de ideas aparcadas (YAGNI hasta demanda real): listados derivados/vistas guardadas (canon
`licenses-overused`), kanban por enum, master-detail split, vista árbol (self-relation),
calendario, comparador de registros, QR del código de negocio, semáforos por umbral, columnas
moneda/porcentaje/progreso, controles radio/multi-select/autocomplete, pivote enum×enum, mapa,
bandeja de trabajo, aprobaciones (descartada: workflow = inner-platform), PDF/informes.

## Observaciones abiertas (2026-08-01, sesión del estudio) — atajar más adelante

1. ~~Adapter de Azure emitido siempre y sin dependencia~~ — **resuelto**: vive tras la ranura `infra` con sus dependencias declaradas en el proveedor. Verificado: una app con `infra=none` no emite ningún fichero de Azure.

   Texto original: **Adapter de Azure emitido siempre y sin dependencia** (⚠️ bug latente, mismo patrón que el de
   winston): el kernel copia `azure-blob-file-storage.ts` en TODAS las apps, nadie lo referencia y
   `@azure/storage-blob` NO está en el `package.json` emitido — compila aquí solo por hoisting del
   monorepo; en máquina de cliente reventaría. Arreglo: sacarlo del kernel siempre-emitido (plugin
   de storage) → **exige re-baseline deliberado del golden de app; requiere OK de Alfonso**.

2. ~~Adjuntos: alcance por página~~ — **resuelto** (spec 16): cuelgan del registro, con FK en cascada y rutas anidadas.

   Texto original: **Adjuntos: alcance por página, no por registro.** Hoy `attachments: true` da un área de
   documentos de la entidad (albaranes, catálogos). Los adjuntos POR FILA necesitan el arquetipo
   `detail` (spec 15) — se añadirá allí.

3. **Sin fixture de oro para `attachments`** (TASK-05 de la spec 14): cubierto por 8 tests unitarios
   - compilación e2e real, pero no por el gate de oro. Congelar un modelo con adjuntos.
4. **La tabla del lienzo es una réplica controlada**, no el DataTable emitido (hacía falta para
   editar cabeceras). WYSIWYG estricto exigiría un «modo diseño» en el DataTable emitido.
5. **Puerto 3000 ocupado** por sap-licences en el entorno de Alfonso: el estudio arranca con
   `PORT=3400 npm run studio:api` (documentar en el README del estudio).
6. ~~Vista de generación con animación~~ — **resuelto**: progreso real en NDJSON (etapa, ficheros escritos, último fichero y cronómetro).

   Texto original: **Vista de generación con animación** (petición de Alfonso, 2026-08-01): al pulsar «Generar
   aquí» el diálogo debería dar paso a una **pantalla de progreso animada** (spinner/pasos con
   estados: validando diseño → generando módulos → instalando dependencias → listo), no al
   estado «Generando…» de un botón. La generación puede tardar minutos con instalación, así que
   necesita feedback de progreso real (idealmente streaming del log del generador, hoy se
   devuelve entero al terminar).

7. ~~Pluralización naïf en el lienzo~~ — **resuelto** (hallazgo 20): regla del castellano con diez casos en tests.

   Texto original: **Pluralización naïf** en el lienzo (`newDraftResource`): «Vehículo» → vehiculos. Suficiente para
   diseñar (el chat real produce singular/plural correctos y se puede editar), pero conviene una
   lista de irregulares si se usa mucho a mano.

## Pendientes conocidos (no bloquean la spec 00)

Descubiertos por el dogfooding del estudio (2026-07-31, spec 08): la app ensamblada con los 4
modelos de oro **no compila entera** — (a) los VOs de context-shared (`voShared`: CustomerName,
ContractDate, Period, Phone, SyncTimestamp, constants) se importan pero ningún generador los
emite (van con spec 15 `kernel-config-infra`/C1); (b) los dialogs de contract/project usan
enums como valores, `*-labels` y DTOs (`LicenseWithConsumptionDto`) que faltan — es el trabajo
restante de la spec 04. Las demos (boutique/almacén/concesionario) no lo sufren porque sus
modelos no usan esos conceptos. El bug de `update()` sin VO sí se arregló (fix + re-baseline).

Del README del starter (2026-07-12): ~~ADR-008 distribución del kernel (B1)~~ → **RESUELTO 2026-07-30** (docs/ADR-008: paquetes npm @raptor/*, instalabilidad verificada por smoke; pipeline de publicación pendiente), selección de adapter en
generación (A3), propagación de denormalización (B2), scoping en Criteria (B4), constante compartida
de campos (C1), uniformización de los 4 módulos de oro (C2), anotar ADR-001 (A1).

✅ Las 5 decisiones del resource-schema fueron **ratificadas el 2026-07-30** (ver skill `schema-authoring`) —
el starter original las tenía cerradas pero no llegó a este repo.

## Observaciones abiertas (cont.)

8. ~~Piel Material del lienzo es una aproximación~~ — **resuelto por retirada** (spec 36,
   2026-08-10): medido el 2026-08-09 que spartan y material emitían apps indistinguibles
   (12 ficheros distintos de ~750; listado y diálogo idénticos byte a byte), así que la piel
   se retiró en vez de perseguir fidelidad. La variedad visual la lleva la ranura `design`
   (spec 37). Último commit con material viva: `103f24d`.
9. **Paletas de previsualización no viajan al app-schema todavía**: elegir
   "Océano" en el lienzo NO cambia los tokens de la app generada. Siguiente
   paso natural: `theme: { palette }` en el app-schema y el kernel emitiendo
   los tokens correspondientes en styles.css.
10. **Tema del estudio no se persiste** entre recargas (el de la app generada
    sí, vía localStorage en ThemeService).

11. ~~Booleanos como true/false en la tabla~~ — **resuelto**: `type: 'boolean'` emitido y pintado Sí/No en las dos pieles; después llegó el formateador único del kernel.

    Texto original: **Booleanos en la tabla emitida se ven como `true`/`false`** (visto en la
    clínica generada). La ficha ya los formatea como Sí/No; la columna del
    listado debería hacer lo mismo — es el mismo formateo, en dos sitios.

12. **La app generada no persiste la paleta por usuario**: el tema claro/oscuro
    sí (localStorage), el color es fijo. Correcto por ahora (es identidad de
    cliente, no preferencia), pero anotado por si algún cliente lo pide.

## Defectos del generador detectados en demos (NO parchear la demo: arreglar aquí)

13. **La instalación de Spartan tarda 20 min y revienta**: 16 invocaciones
    separadas de `nx g @spartan-ng/cli:ui`, cada una arrancando Nx de cero.
    Supera el tope de 15 min del studio-api y deja la app a medias (node_modules
    sin `.bin`, sin `libs/ui`). Arreglo: vendorizar los helm una vez y copiarlos.
14. **Regenerar sobre una app existente machaca `tsconfig.base.json`** y con él
    las rutas `@spartan-ng/helm/*` que añadió `ui:add`. La app deja de compilar.
15. **El script `web` no fija puerto**: `ng serve` toma el 4200 y choca con
    cualquier otro Angular abierto; el proceso muere y parece que «tarda».
16. **Un timeout de generación deja la carpeta a medias** sin avisar: parece
    una app generada y no lo es.
17. **Booleanos en el listado emitido salen como `true`/`false`** (la ficha ya
    los pinta Sí/No).

18. **La «paleta» de la spec 18 sólo tiñe la acción**, no viste la app: cambia
    botones y chips de enum, y deja fondos, tarjetas, bordes y sidebar en gris.
    No era lo pedido (Alfonso, 2026-08-02: «yo lo que exigía eran temas»). Lo
    corrige la **spec 20**, que deriva el juego completo de tokens.

## Ranuras de capacidad (spec 23, hecha 2026-08-04) y lo que queda por enchufar

El generador ya distingue **decisiones excluyentes** (elige-un-proveedor) de **plugins aditivos**.
Las ranuras viven en `libs/generators/src/generators/app/plugins/slots.ts`; añadir un proveedor es
registrarlo ahí + `npm run slots`, y aparece solo en el CLI y en el wizard del estudio.

```
  RANURA      PROVEEDORES HOY                 PENDIENTE (spec que lo rellena)
  database    postgres ✅ | mongo ✅          spec 06: falta golden mongo + suite integración
  ui          spartan ✅ (único proveedor)      material retirada (spec 36, 2026-08-10)
  infra       none ✅ | azure ✅ | aws ✅       C4 gcp
              raptor ✅ (low cost)
  auth        none ✅ | single-tenant ✅       D multi-tenant (¡ojo: ya hay código, ver abajo)

  PLUGINS ADITIVOS: email, observability  → los absorbe el proveedor de infra en C1
```

| Nº    | Spec                   | Objetivo                                                                                                                                                                                                                                                                                                             | Estado                  |
| ----- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| ✅ 23 | `ranuras-de-capacidad` | Ranuras + proveedor de persistencia dueño de su emisión + `tools/slots.json` + wizard derivado                                                                                                                                                                                                                       | ✅ 2026-08-04           |
| C1    | `infra-azure`          | Empaquetar lo de la referencia como proveedor `infra=azure`: config+Key Vault, App Insights (absorbe `observability`), Blob, ACS (absorbe la pata azure de `email`), Terraform. Aquí se arregla la obs. 1 (adapter Azure siempre emitido)                                                                            | ✅ 2026-08-10 (spec 24) |
| ✅ C2 | `infra-raptor-cloud`   | `infra=raptor` (spec 50, nombre definitivo **Raptor Cloud**): Infisical (secretos, REST sin SDK), Cloudflare R2 (reusa el adapter S3), Grafana Cloud Loki + Sentry (logs y errores), Brevo (email, ya estaba) y un VPS Hetzner. El estudio "a estudiar" de 2026-08-04 queda cerrado                                  | ✅ 2026-08-17           |
| ✅ C3 | `infra-aws`            | S3+CloudWatch+Secrets Manager+SES                                                                                                                                                                                                                                                                                    | ✅ 2026-08-16 (spec 47) |
| C4    | `infra-gcp`            | GCS+Cloud Monitoring+Secret Manager                                                                                                                                                                                                                                                                                  | Pendiente               |
| —     | (transversal, spec 50) | **La IaC viaja dentro de la app generada**: elegir `--infra=<x>` emite `iac/` con el stack del proveedor (azure, aws o raptor), con el nombre del proyecto ya puesto. Antes vivía solo en el repo del acelerador, que el cliente no recibe. Un test de deriva impide que la copia y el catálogo `iac/<x>` se separen | ✅ 2026-08-17           |
| D     | `auth-multi-tenant`    | `auth=multi-tenant`. **No parte de cero**: `libs/infra/auth` ya tiene tenant resolvers y `TenantScopedSessionStore` (commit c33ac61, 2026-07-30), **suite en verde** — los 2 rojos eran fechas absolutas caducadas en el fixture, no un hueco (arreglado `8ba9dc6`, 2026-08-09)                                      | Pendiente               |

## En pausa

- **Spec 19 (código de negocio)**: contrato hecho e inerte; pendiente decidir
  formato (¿año?) antes de emitir. Alfonso lo está pensando.

## Deuda detectada en la spec 23 (no arreglada, decisión de Alfonso)

19. **`apps/studio/.prettierrc` es `{"singleQuote": true}`**: sin `semi: false` ni
    `printWidth: 120`, así que formatear dentro del estudio mete punto y coma y
    parte a 80 columnas, contra la convención del proyecto — y las 624 fuentes del
    estudio están escritas en estilo raíz. Además el `--config` de prettier NO gana
    al `.prettierrc` más cercano. Arreglarlo reformatea medio estudio: decisión de Alfonso.
20. ~~**`build-mongo.spec.ts` sin `build-mongo.ts`**~~ — resuelto 2026-08-04 (spec 06 TASK-06):
    la suite de `generators` está entera en verde (43 suites).
21. ~~Los 2 tests rojos de `TenantScopedSessionStore`~~ — **resueltos 2026-08-09**: no era la
    spec D sino un fixture con `expiresAt` absoluta que caducó al día siguiente de escribirse
    (`InMemorySessionStore` poda con `Date.now()`). Fechas relativas al reloj desde `8ba9dc6`.
22. ~~El generador NO emite los VOs compartidos que sus modelos referencian~~ — **resuelto**
    (spec 27, la capa compartida del contexto): la app de oro de 4 modelos da 0 errores en el
    typecheck fuera del árbol. Verificado de nuevo el 2026-08-09 (spartan y material, con auth).
23. ~~El typecheck de la app emitida no está en ningún gate~~ — **resuelto** (spec 26):
    `npm run typecheck:emitted` (`tools/typecheck-emitted.sh`) genera FUERA del árbol,
    instala y pasa `tsc` a backend+shared y frontend. Lento (~2 min por app): se corre al
    cerrar spec y en CI, no en cada commit. Ya cazó el renombre del logger (`ea6031d`) y los
    dialogs rotos de la spec 04.

## Hallazgos de la demo de validación (2026-08-03)

13. ~~El diseño no sabe declarar un enum~~ — **en marcha** (spec 22): contrato,
    expansión, chat y badges del lienzo hechos; quedan el editor del lienzo y el
    e2e. Texto original del hallazgo:

    **El diseño no sabe declarar un enum.** `DraftFieldType` es
    `string|text|number|integer|boolean|date|ref`: no hay forma de decir «estado:
    disponible / reservada / vendida». El resource-schema SÍ lo soporta
    (`vo.values`, `table.badgeMap`, `form.control: 'select'` con `optionsType`) y
    los cuatro módulos de oro lo usan, así que el canon de emisión está probado —
    falta el tramo del diseño, igual que le faltaba a las relaciones antes de la
    spec 15. **Recomendación: spec propia** (misma forma que `ref`: tipo nuevo +
    expansión + badges + select tipado). Sin ella, cualquier «estado» sale como
    texto libre, sin colores ni validación.

14. ~~Los puertos del docker-compose emitido están fijos~~ — **resuelto**:
    `ports` en el app-schema (api, web, postgres, postgresTest) y contenedor
    con el nombre de la app. El estudio los envía en el artefacto.
15. **El puente del chat esperaba 180 s** y descartaba respuestas válidas que
    tardaban más (componer un diseño real lleva minutos). Arreglado: 900 s.
16. **El modo del arnés era una variable de entorno olvidable**: al fijar el
    puerto en el script, la API arrancó en modo `fake` sin avisar. Arreglado:
    script `studio:api:bridge` explícito + traza del modo al arrancar.

17. **Las relaciones no emitían clave ajena** (visto en fincaraiz): `agente_id`
    era un UUID suelto. Resuelto con `FOREIGN KEY … ON DELETE RESTRICT` + índice.
18. **El oro no cubre plurales irregulares**: los cuatro modelos pluralizan en
    «+s», así que tres bugs de pluralización a mano llegaron a una demo sin que
    el gate los viera. Mitigado con `plural-guard.spec.ts`, que barre TODO lo
    emitido para una entidad `propiedad→propiedades` buscando el plural ingenuo.
    Queda pendiente decidir si además merece un quinto modelo de oro.
19. ~~`npm test` enmascara suites que no compilan~~ — **era un error mío, no de
    jest**: el exit code SÍ es 1 cuando una suite no compila (verificado con una
    suite rota a propósito). Lo que engañaba era mi forma de comprobarlo: leer la
    línea «Tests: 210 passed» en lugar del código de salida. Lección aplicada
    (regla 2 del protocolo): **cortar por exit code, nunca por grep**. El riesgo
    real no era la herramienta sino la verificación declarada.

20. ~~La singularización del estudio es ingenua~~ — **resuelto**: regla del
    castellano («-es» tras consonante, «-s» tras vocal) usando los finales de
    palabra válidos, con diez casos fijados en tests. Queda como mejora poder
    editar el nombre de la entidad a mano en el lienzo, para los irregulares que
    ninguna regla acierta (luces → luz).

## Abiertos de verdad (revisado 2026-08-05)

- **Fixture de oro para adjuntos** (punto 3): cubierto por tests unitarios, sin diff congelado.
- **La tabla del lienzo es una réplica** (punto 4), no el DataTable emitido.
- **Piel Material del lienzo es una aproximación** (punto 8).
- **El tema del estudio no se persiste entre recargas** (punto 10).
- **La app generada no persiste la paleta por usuario** (punto 12).
- **El oro no cubre plurales irregulares** (punto 18): mitigado con `plural-guard.spec.ts`;
  queda decidir si merece un quinto modelo de oro.
- **Spec 19 (código de negocio)**: en pausa, pendiente de decidir el formato.
- **Cinco tareas e2e** (specs 15, 16, 17, 20, 22): bloqueadas por Docker, no por código.

21. ~~La tabla relacionada muestra las fechas en ISO crudo~~ — **resuelto**:
    `renderRelated` deriva el tipo de la columna (table.type o el tipo del campo)
    y `RelatedTable` lo pasa a `formatValue`. Una fecha se lee igual en la ficha
    y en su tabla de hijos.
22. ~~El separador de fecha difiere entre listado y ficha~~ — **resuelto**: el
    canónico es dd/MM/yyyy (lo que produce Intl es-ES, el formateador único, y lo
    que ya usaba la piel material — el dd-MM venía de sap-licenses). Unificados el
    DataTable spartan, la réplica del lienzo del estudio y el comentario del
    skeleton.

## Siguiente spec acordada (brainstorming 2026-08-14/15, cierre de la spec 43)

- **44 — Convergencia flujos↔transiciones**: un paso de flujo con `transition` declarada
  (la costura ya está en el contrato y en la frontera) emite cuerpo REAL determinista
  (cargar → `entidad.verbo()` → guardar) y AHORA SÍ su endpoint — endpoint solo donde hay
  cuerpo real, nunca fachadas sobre huecos vacíos. Además: encadenar el relleno de los
  huecos `@ai` restantes como fase visible de la pantalla de obra (decisión «opción b»,
  2026-08-15). Doctrina: el vocabulario de cajas compilables crece VERBO A VERBO por regla
  de los dos; prohibido el vocabulario genérico (asignar/condición/bucle) — ver
  memoria «backlog-ideas-estudio» §9.

## Hallazgos de la demo taller (2026-08-18)

23. **El lienzo no dice que promover un enum a máquina le quita el campo del formulario.**
    Alfonso preguntó, con la demo delante, si al editar un registro y cambiar el estado se
    harían las validaciones. La respuesta es que ese gesto no existe: el campo sale del alta
    y de la edición (spec 43), y el estado solo se mueve por transición — verificado contra
    la app corriendo (`PUT` con `estado` → 400 «property estado should not exist»; transición
    ilegal → 409 con el mensaje del dominio). La decisión es correcta; **lo que falta es que
    se vea**: quien diseña marca «Es el estado de la entidad» y nada en el lienzo le cuenta
    que acaba de sacar ese campo del formulario y de ganar botones en la ficha. Es la
    pregunta que va a hacer cualquiera que diseñe en el estudio.

24. **Precondiciones declarativas sobre datos** — el siguiente salto de valor, por encima de
    más vocabulario de flujo. La demo dejó el límite nítido por dos sitios:
    - Las reglas de la casa que NO son flechas no se emiten: «no se factura una orden sin
      horas de mano de obra apuntadas», «no se entrega sin el parte de trabajo firmado
      adjunto». Hoy el botón _Facturar_ aparece igual con cero horas y sin adjunto: la única
      guarda emitida es el estado de origen.
    - Los pasos que no son transición piden anotar cosas que el modelo no tiene (dónde queda
      registrada la reclamación al proveedor), y el cuerpo honesto acaba siendo solo guardas.
      Es la categoría 2 de reglas de negocio: una precondición declarada sobre campos y
      adjuntos, derivable a guarda en el agregado + 409 + botón deshabilitado en la ficha.

25. **Una tabla en una vista con KPIs se emite en otra pantalla, y se come el título de la
    siguiente.** `designPagesToAppPages` traduce el bloque `kpis` a la página `dashboard` (que solo
    lleva widgets) y la tabla de la MISMA vista a una página de listado independiente; como el
    título ya lo gastó el dashboard, ese listado sale sin etiqueta y hereda el plural del recurso.
    Si otra vista repite la tabla de ese recurso, se descarta en silencio (`listed`) **con su
    título**. Efecto medido en la demo taller: la vista «Panel» (kpis + tabla de órdenes) emitió
    panel sin tabla, y la vista «Órdenes» desapareció — el menú dice «Órdenes de reparación».
    `generableHere` no lo marca: para el lienzo esa tabla es emitible. Dos arreglos posibles, y el
    primero no es opcional: (a) que el lienzo diga la verdad — bloque duplicado o tabla bajo KPIs
    marcados como «se emitirá como pantalla aparte» / «ya emitido en otra vista»; (b) decidir si el
    arquetipo dashboard debe poder llevar el listado debajo de los widgets, que es lo que el
    diseñador dibuja y lo que un panel suele ser. Ver ROADMAP 23: el lienzo no puede mentir.

> **Punto 25 resuelto** por la spec 52 (2026-08-19): el panel emite los listados que el diseñador
> dibuja en su vista, y la tabla repetida en su propia vista conserva pantalla y título. La app de
> oro estrena la combinación, así que el gate ya la cubre. Queda anotada una trampa de proceso: el
> `studio-api` corre con `ts-node` y no recarga — tras tocar la frontera o los generadores hay que
> reiniciarlo antes de generar desde el estudio, o se emite con el código viejo.

> **Modelo del panel cerrado** por la spec 53 (2026-08-19): la página `dashboard` es una secuencia de
> bloques como cualquier vista (ADR-009). `widgets` y la ranura `tables` de la spec 52 se retiraron sin
> alias; el orden y el ancho salen del dibujo, y el ancho `half` —que el lienzo pintaba y el panel
> ignoraba— ya se emite. Criterio cumplido: oro vacío en 1671 ficheros salvo una línea en blanco
> declarada. Encima de este modelo van, como specs propias, las **pestañas maestro + tabla
> relacionada** (el caso que Alfonso pidió: elegir una máquina y ver SUS órdenes) y la **lista con
> propósito** (top N), que ya no tocarán el contrato.
>
> Deuda de proceso anotada tres veces ya: la suite del estudio caduca a 5 s con la máquina cargada.
> Toca subir `testTimeout` o quitarle a esas specs la dependencia del arranque de Angular.

26. **Pestañas maestro + tabla relacionada: DESCARTADA** (2026-08-19, decisión de Alfonso al terminar
    la spec 53). Motivo suyo, y es bueno: una fila de pestañas sobre registros **no escala con el
    volumen** (una entidad tiene cientos), y la pregunta que responde —«qué le pasa a ESTA máquina»—
    ya se contesta en la vista del recurso con su filtro. No se implementa.

27. **Lo que un panel debería llevar es un RESUMEN, no un listado** (misma conversación, el hallazgo
    que deja la 53 abierta por arriba). Alfonso: «las tablas serían un resumen de lo que hay a modo
    informativo, igual que los KPIs». Eso hoy NO se puede emitir: un resumen de verdad (totales por
    grupo, sumas, medias, «las 5 más urgentes» con criterio de negocio) exige **entidades de dominio
    nuevas** — un modelo de lectura/proyección que el acelerador no tiene. Lo que hay es su versión
    pobre: `count-by` y `kpi-count`, conteos filtrados sobre el endpoint de listado (sin sumas ni
    medias, ver la nota de la spec 32). Consecuencia práctica: el bloque `table` del panel sigue
    siendo legal —el modelo de la 53 no opina— pero **no es lo que hace útil a un panel**, y meterlo
    en un diseño solo repite lo que la vista del recurso ya enseña. El candidato de verdad es la
    proyección de lectura, y es una spec grande: dominio + endpoint + vocabulario del panel.

> **Tablas legibles: cerrado** por la spec 54 (2026-08-20). Una columna puede declarar su techo
> (`FieldTable.maxWidth` → `ColumnDef.maxWidth`) y la política se lo pone sola a los campos que se
> editan en `textarea`: 280px, una línea, elipsis y el texto completo en el tooltip. Medido en la
> demo `taller`: el lienzo pasó de 789px de alto a 273 (cinco filas de una línea) y la app emitida
> pinta filas de 49px con la avería cortada de verdad (`scrollWidth > clientWidth`) e Importe y
> Horas otra vez en pantalla. El gate de oro quedó vacío salvo el `data-table.ts` del kernel.

28. **El spec de servicio emitido va ROJO en cuanto el recurso tiene soft delete.** Descubierto al
    regenerar `taller` para la spec 54: 12 fallos de 134 en su suite de frontend, los mismos 3 tests
    en los 4 recursos (`adds an orders param`, `adds the search param`, `serializes column filters`).
    Diagnóstico: el servicio emitido tiene DOS `resource()` —el listado y la papelera— y el spec
    afirma con `toHaveBeenLastCalledWith('/api/v1/<plural>')`, pero la última llamada es
    `/api/v1/<plural>/deleted`. No es de la spec 54 (el gate de oro salió idéntico en los 788
    ficheros de la fixture, que incluyen esos specs): es un defecto de plantilla anterior, y significa
    que **cualquier app entregada con soft delete nace con su suite en rojo**. Arreglo: que el spec
    afirme sobre la llamada del listado (`toHaveBeenCalledWith`) o que espere a que la papelera
    asiente. Barato y urgente — es lo primero que ve un cliente al correr los tests.

29. **El `vitest.config.mts` emitido no declara `testTimeout`; el `jest.config.js` emitido sí (30 s).**
    Esa asimetría es la causa de los timeouts de 5 s que llevan cuatro sesiones apareciendo (la
    suite del estudio, 7 fallos con la máquina cargada; la del emitido, 1). No es «la máquina va
    lenta»: es que el arranque de Angular por fichero no cabe en el defecto de vitest. Se arregla en
    `files-skeleton/vitest.config.mts.template`, una línea, y deja de contaminar todos los gates.

30. **`stickyLeftOffsets` asume que toda columna mide exactamente su `minWidth`.** Si una columna
    fijada mide más, las siguientes quedan descolocadas. Es anterior a la spec 54 y el techo lo
    _acota_ (antes el desbordamiento no tenía límite), así que no urge; el arreglo natural es que el
    cálculo use `min(maxWidth, ancho real)` o que una columna fijada declare un ancho fijo.

31. **La copia propia del DataTable del estudio no estrena el techo.** `apps/studio` es una app
    generada y su `shared/components/data-table.ts` se quedó en la versión anterior; sus pantallas de
    demo (warehouse) no tienen texto largo, así que no se ve. Se arregla cuando el estudio se
    regenere, no antes.

32. **Cada bloque está implementado DOS veces: el canvas del estudio y la plantilla emitida.**
    Es la deuda que la spec 68 decide pagar en vez de saldar, y conviene tenerla contada. El
    estudio dibuja sus propios `canvas-table`, `canvas-calendar`, `canvas-kanban`,
    `canvas-cards`, `canvas-detail`, `canvas-form*` (doce componentes con cromo), y el generador
    emite los suyos en `files-*/frontend/`. Nada las ata: son dos maquetas del mismo bloque
    escritas a mano en dos sitios.

    **Lo que cuesta, medido, no supuesto**: la spec 67 tuvo que poner el vocabulario de hooks en
    las plantillas y la 68 lo repite en el canvas — dos veces el mismo trabajo, dos guards
    (`design-drift.spec.ts` y `design-hooks-canvas.spec.ts`) para vigilar que ninguna de las dos
    copias se quede atrás. Y ya se quedó atrás: entre el 2026-08-10 y el 2026-08-25 el estudio
    previsualizaba las pieles con `presetChrome()`, una aproximación de colores que hizo a
    Alfonso concluir —con razón en lo que veía— que la piel no se aplicaba. La misma familia de
    defecto que el `data-table.ts` del estudio congelado (idea 31) y que el `previewThemeVars`
    de antes de derivarlo del schema.

    **Por qué no se ataca en la 68**: unificar exige decidir QUIÉN es la fuente. Tres caminos, y
    ninguno barato: (a) el canvas importa los componentes emitidos —imposible hoy, son plantillas
    EJS con `<%- %>` dentro, no Angular compilable—; (b) las plantillas se generan DESDE los
    componentes del canvas (invertir la dirección: el estudio sería el canon y el generador
    emitiría su transcripción); (c) un tercer artefacto —componentes Angular reales,
    parametrizados por datos, que el canvas usa tal cual y el generador copia verbatim al
    emitir—, que es la variante de lo que ya se hace con `files-skeleton-ui/` y con la copia
    vendorizada de helm. (c) es la que huele mejor y la que más se parece a lo que el repo ya
    sabe hacer.

    **Cuándo deja de ser opcional**: cuando el peaje se pague por tercera vez. Cada bloque nuevo
    son dos maquetas y dos listas de hooks; a partir de ahí el coste de unificar es menor que el
    de seguir duplicando. Señal de alarma concreta: la próxima vez que un defecto visual se
    arregle en un lado y siga vivo en el otro.

    **Añadido por la 68 y a vigilar**: `scopePresetCss()` es un mini-parser de CSS a mano. Hoy es
    defendible —el CSS de los presets es corto y nuestro—, pero es la primera pieza a revisar si
    algún día un preset escribe `@media`, selectores anidados o un `:root:not(...)`.

33. **Concurrencia sobre datos: condiciones de carrera y bloqueos optimistas/pesimistas**
    (2026-08-29, apuntado por Alfonso; hablado entre sesiones sin registrar). El caso canónico
    es el stock: dos usuarios decrementan la misma existencia a la vez y el último en escribir
    pisa al primero. Hoy el código emitido no tiene ninguna protección: ni columna de versión
    (bloqueo optimista con 409 al chocar), ni `SELECT … FOR UPDATE` (pesimista), ni la
    transacción cubre leer-decidir-escribir como unidad. Afecta también a las transiciones de
    estado (dos «Facturar» simultáneos) y a los contadores/agregados. Forma candidata a debatir:
    bloqueo optimista por defecto en el agregado emitido (campo `version` + retry o 409 con
    mensaje de dominio), pesimista solo donde el schema lo pida. Toca dominio, repositorios
    (TypeORM y Mongoose), use cases y el vocabulario del schema. Requiere brainstorming antes
    de spec.

34. **Entidad intermedia para desnormalizar** (2026-08-29, hablado entre sesiones). La spec 60
    resolvió el lookup de campos desnormalizados en el use case, pero hay modelados que piden
    una entidad intermedia real (p. ej. línea-de-pedido entre pedido y producto, que congela
    precio y nombre en el momento de la venta). Hoy el schema solo sabe `ref` entre agregados y
    `composition` (hija embebida); no hay forma de declarar «tabla intermedia con campos
    propios copiados/congelados del referenciado». Decidir si es una extensión de `composition`
    (hija cuyos campos se rellenan por lookup al crearla) o un tercer vocablo. Regla de los dos:
    esperar al segundo caso real, pero dejar aquí contado el primero.

35. **Clases hijas no-agregado (Contact) de punta a punta** (2026-08-29; precisa y ata la idea
    15 del backlog de memoria). El backend YA emite composición entera (`build-composition.ts`,
    `files-composition*`: hija en el dominio del padre, use cases add/update/remove, controlador
    anidado, persistencia TypeORM con cascade — reproduce Customer→Contact de la referencia).
    Lo que falta: (a) **front**: la ficha del padre no pinta la colección hija (tabla embebida +
    diálogo); (b) **estudio**: `DraftResource` no tiene ranura de composición — el lienzo no
    sabe decir «esto cuelga de aquello»; (c) persistencia Mongoose de la hija. Orden recomendado:
    front primero (valor propio aunque el modelo siga siendo manual), después el gesto del lienzo.

36. **Botones de acción manuales en el lienzo, asociados a un paso de flujo** (2026-08-29).
    En inmobiliaria el diseño ya declara acciones como `publicar` y `retirar` que acaban como
    botones en la app emitida — pero nacen del flujo, no del lienzo: no existe el gesto de
    soltar/editar un botón en una vista del estudio y decirle «este botón dispara tal paso de
    tal flujo». El diseñador debería poder: añadir un botón a la ficha/listado, elegir el paso
    de flujo (o transición) al que se ata, y ver la vista previa igual que la app emitida.
    Continúa la idea 3 del backlog («el flujo se ve y se pulsa») pero desde el otro extremo:
    allí los botones se DERIVAN del flujo por convención; aquí se pide además el gesto manual
    de colocarlos/curarlos en el lienzo. Mantener la doctrina: el botón siempre REFERENCIA un
    paso existente (idea 9), nunca lógica dibujada.

37. **Pipeline de generación por fases: instalar → rellenar huecos IA → validar → reparar**
    (2026-08-29, pedido por Alfonso; extiende y concreta la idea 16 y el punto (b) de su
    memoria). Fases nuevas en la pantalla de obra, después de instalar dependencias:
    (1) **Ejecución de flujos/procesos con IA**: correr `fill-flow-slots` (ya existe como
    generador) sobre los huecos `@ai:begin…@ai:end` como fase integrada de la generación, no
    como paso manual; (2) **Validación**: ejecutar la suite de tests emitida (+ typecheck y,
    si procede, arranque real como pedía la idea 16) con informe accionable; (3) **Reparación**:
    si falla algo generado por IA, un ciclo acotado de corrección SOLO dentro de los huecos
    `@ai:*` — nunca sobre el código canónico emitido (doctrina «las demos detectan, no se
    parchean»: un fallo del determinista se arregla en el generador con test rojo + golden).
    Pendiente de spec; decidir presupuesto de reintentos de la reparación y qué corre el gate
    (vitest de la app emitida vs. suite completa).

38. **La opción `database=mongo` debe funcionar al generar, de punta a punta** (2026-08-29).
    La ranura existe (`schema.d.ts: database?: 'postgres' | 'mongo'`) y hay fixture de oro
    `app-mongo` con repositorios Mongoose, pero la opción no está al día con todo lo que ha
    entrado después por el camino TypeORM (aggregate/KPIs de las specs 71-72, composición,
    borrado, transiciones…) ni verificada end-to-end desde el estudio (elegir Mongo en «Antes
    de generar» → app que arranca, migra/seeds y pasa su suite contra un Mongo real). Tarea:
    auditar qué emite hoy el camino mongo, completar los huecos y verificarlo con una demo
    como se hizo con las de Postgres. Se ata con el fleco de la spec 38 (arrastre del adapter
    Mongoose) y con la parte (c) de la idea 35.

39. **Sistema de conocimiento de modelado para la IA de los bordes** (2026-08-29, apuntado por
    Alfonso como importante). Diseñar/pensar un corpus de conocimiento (ficheros .md curados,
    RAG, o lo que gane el debate) que le dé a la IA criterio de ARQUITECTO, no solo de
    redactor: dado un problema del usuario («dos operarios descuentan el mismo stock a la
    vez»), saber qué patrón de dominio aplica (bloqueo optimista, agregado que protege el
    invariante, entidad intermedia, máquina de estados…) y traducirlo al vocabulario que el
    schema ya sabe emitir. Dos consumidores:
    (a) **el chat/puente del estudio** al redactar o ampliar un modelo — hoy propone entidades
    y campos, pero no razona patrones (idea 33: nada le diría que el stock necesita versión);
    (b) **guiar al usuario que construye a mano desde el lienzo** — detectar por las señales
    del diseño (un campo `stock`, dos entidades que se referencian con datos congelados, un
    enum que huele a estado) que hay un patrón conocido y sugerirlo con su porqué, estilo
    «esto suele modelarse así».
    Materia prima que ya existe: los patrones canónicos de `docs/referencia/`, las skills
    `backend-patterns`/`frontend-patterns`/`schema-authoring`, los ADRs y este mismo ROADMAP —
    hoy todo eso lo lee Claude Code en sesión, pero NO viaja al puente del chat del estudio ni
    a los prompts de `fill-flow-slots`. Primer debate a dar: formato (md por patrón con
    «señales → modelado → vocabulario del schema» probablemente baste; RAG solo si el corpus
    crece hasta no caber en contexto — YAGNI) y dónde se inyecta (system prompt del puente,
    fase de la idea 37, o un endpoint de sugerencias del estudio). Se ata con las ideas 33, 34,
    36 y 37: cada patrón nuevo del corpus es un candidato a vocabulario del schema por regla
    de los dos.
