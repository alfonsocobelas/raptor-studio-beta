# ROADMAP — Acelerador de Dashboards

> Mapa de specs del proyecto, derivado de la secuencia por riesgo del documento maestro (§9).
> Regla: **profundidad antes que anchura** — un recurso perfecto antes que muchos a medias.
> Las specs se crean con `/spec-new` cuando llega su turno; este mapa solo ordena la intención.

## Fase 1 — Núcleo del generador (el 70-80% de probabilidad de éxito)

| Nº  | Spec                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Objetivo                                                                                                      | Estado        |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- | ------------- |
| 00  | ✅ `generador-recurso` [DONE]                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Workspace Nx + plugin `@acc/generators` + primera plantilla (entidad TypeORM de `contract`) validada por diff | ✅ Completada |
| 01  | ✅ `schema-lib` [DONE]                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | `libs/schema`: `defineResource`, tipos, validación del modelo (cerrando las 5 decisiones §5)                  | Pendiente     |
| 02  | ✅ `golden-fixtures`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Congelar los 4 módulos de oro desde `docs/referencia` + comando/target de diff                                | Pendiente     |
| 03  | ✅ `plantillas-backend` (corte canónico)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Módulo backend completo (domain + application + infrastructure) con diff vacío para `contract`                | Pendiente     |
| 04  | ✅ `plantillas-frontend` — cerrada de facto el 2026-08-08: la app de oro entera SE SIRVE por primera vez con 0 errores (ng serve/esbuild). Los cuatro huecos que la mantenían abierta cayeron esa sesión: enums reales en `<entity>-enums.ts` (los dialogs los usan como valores), DTO con el `dtoName` del modelo (LicenseWithConsumptionDto), módulo `<entity>-labels` emitido desde el propio modelo (badgeMap→options→capitalizado) y mocks con literales para las unions. Evidencia: e2e-18-dialog-contrato.png (dialog con lookup de cliente, dates, selects tipados y labels en español) | Vista completa (list + dialog + detail + service + rutas) con diff vacío | ✅ 2026-08-08 |
| 05  | `validacion-4-entidades`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Las 4 referencias de oro generan con diff vacío (gate completo)                                               | Pendiente     |

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

Orden acordado: **tanda A (latente) → tanda C (analítica) → tanda B (import)**, siempre por
detrás del trabajo activo (spec 15). Una spec por componente, cada una con su gate de oro.

| Nº  | Spec                 | Objetivo                                                                                                                                                              | Estado    |
| --- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| A1  | ✅ `vista-papelera` (spec 29) | `softDelete + delete` habilita papelera completa: GET /deleted + restore (404 si no hay borrado), vista con restaurar, tests emitidos y e2e (e2e-10..13). De propina: 4 defectos latentes de migraciones arreglados al correr por 1ª vez la integración del oro | ✅ 2026-08-08 |
| A2  | ✅ `vista-gantt` (spec 30) | Schema `gantt` (exige period), página/ruta/nav `· cronograma`, barras con eje mensual y seed de intervalos escalonados; contract lo estrena. E2E con captura (e2e-17/18) tras desbloquear la spec 04 en la misma sesión | ✅ 2026-08-08 |
| A3  | ✅ `historial-cambios` (spec 31) | Flag `history` (no derivado de audit): tabla global `shared.audit_events`, AuditTrailPort mejor-esfuerzo en ambos motores, eventos en los 4 use cases de escritura (update con diff), `GET /:id/history` y timeline en la ficha (e2e-19). Actor pendiente de la ranura auth | ✅ 2026-08-08 |
| C1v | `widgets-analiticos` | Dashboard: conteo por enum (donut/barras), conteo filtrado, suma/media de campo numérico, serie temporal por mes. Pide agregaciones nuevas en el Criteria del backend | Pendiente |
| B1v | `import-csv-validado`| Wizard de import: cada fila construye el agregado con los VOs generados → errores de negocio por celda → alta en lote. La vertical más diferencial; spec grande       | Pendiente |

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

Del README del starter (2026-07-12): ~~ADR-008 distribución del kernel (B1)~~ → **RESUELTO 2026-07-30** (docs/ADR-008: paquetes npm @acc/*, instalabilidad verificada por smoke; pipeline de publicación pendiente), selección de adapter en
generación (A3), propagación de denormalización (B2), scoping en Criteria (B4), constante compartida
de campos (C1), uniformización de los 4 módulos de oro (C2), anotar ADR-001 (A1).

✅ Las 5 decisiones del resource-schema fueron **ratificadas el 2026-07-30** (ver skill `schema-authoring`) —
el starter original las tenía cerradas pero no llegó a este repo.

## Observaciones abiertas (cont.)

8. **Piel Material del lienzo es una aproximación**, no la librería real: se
   simula con radios, mayúsculas y peso de fuente. Para fidelidad habría que
   montar la piel material congelada dentro del estudio (coste alto, valor
   dudoso antes de generar).
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
  ui          spartan ✅ | material ✅         —
  infra       none ✅                          C1 azure · C2 lowcost · C3 aws · C4 gcp
  auth        none ✅ | single-tenant ✅       D multi-tenant (¡ojo: ya hay código, ver abajo)

  PLUGINS ADITIVOS: email, observability  → los absorbe el proveedor de infra en C1
```

| Nº    | Spec                    | Objetivo                                                                                                                                                                                                                                  | Estado        |
| ----- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| ✅ 23 | `ranuras-de-capacidad`  | Ranuras + proveedor de persistencia dueño de su emisión + `tools/slots.json` + wizard derivado                                                                                                                                            | ✅ 2026-08-04 |
| C1    | `infra-azure`           | Empaquetar lo de la referencia como proveedor `infra=azure`: config+Key Vault, App Insights (absorbe `observability`), Blob, ACS (absorbe la pata azure de `email`), Terraform. Aquí se arregla la obs. 1 (adapter Azure siempre emitido) | Siguiente     |
| C2    | `infra-lowcost`         | `infra=lowcost`: R2 (S3-compatible), Prometheus/Grafana o Sentry (**a estudiar**, Alfonso 2026-08-04), Bitwarden/Infisical para secretos                                                                                                  | Pendiente     |
| C3/C4 | `infra-aws`/`infra-gcp` | S3+CloudWatch+Secrets Manager+SES / GCS+Cloud Monitoring+Secret Manager                                                                                                                                                                   | Pendiente     |
| D     | `auth-multi-tenant`     | `auth=multi-tenant`. **No parte de cero**: `libs/infra/auth` ya tiene tenant resolvers y `TenantScopedSessionStore` (commit c33ac61, 2026-07-30) con **2 tests en rojo en develop**                                                       | Pendiente     |

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
21. **Los 2 tests rojos de `TenantScopedSessionStore`** (ver spec D arriba).
22. **El generador NO emite los VOs compartidos que sus modelos referencian** (⚠️ el emitido no
    compila con esos modelos): `voShared` apunta a `phone.vo`, `customer-name.vo`,
    `sync-timestamp.vo` y `shared/domain/constants`, y esos ficheros no se emiten ni están en la
    fixture golden. Medido con el typecheck de la app emitida (2026-08-04): app `customer`
    postgres 11 errores, mongo 9 — todos de este hueco. Con los modelos de demo (boutique) la app
    compila limpia en los DOS motores (0 errores), así que el hueco es de los modelos
    heredados de sap-licenses, no del pipeline.
23. **El typecheck de la app emitida no está en ningún gate** (⚠️ ya ha mordido DOS veces). El golden
    compara ficheros y la suite del plugin no compila lo emitido: así pasaron los 5 defectos de
    `5232994` y, peor, el renombre del logger de la spec 24, que dejó **todas** las apps emitidas sin
    compilar y se congeló en las fixturas sin que nadie lo notara (`ea6031d`). Hace falta un gate que
    genere una app FUERA del árbol, instale y le pase `tsc`: fuera, porque dentro del monorepo el
    hoisting tapa las dependencias no declaradas. Es lento (~2 min por app), así que probablemente
    va en un target aparte del golden, no en cada commit.

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

