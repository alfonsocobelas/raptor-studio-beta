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
| 04  | 🔄 `plantillas-frontend` — list ✅ en customer+contract (diff vacío, canon C2). **list ✅ 4/4** · **dialog ✅ customer** (bloque form completo: secciones, selects tipados con enums, ids, patch fallbacks). Pendiente dialogs contract/project — exige 4 conceptos nuevos medidos en el código real: (1) select de lookup por relación (`relation.kind reference` → inyectar servicio del recurso destino + opciones dinámicas `@for cust of customers()`), (2) controles `date` y `checkbox`, (3) validadores cross-field a nivel de grupo (endDate>startDate, `AbstractControl/ValidationErrors`), (4) normalizar helpers `xToLabel` (naming inconsistente C2). Después: detail y service (core/services, congelar fixture nueva) | Vista completa (list + dialog + detail + service + rutas) con diff vacío                                      | Pendiente     |
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

## Observaciones abiertas (2026-08-01, sesión del estudio) — atajar más adelante

1. **Adapter de Azure emitido siempre y sin dependencia** (⚠️ bug latente, mismo patrón que el de
   winston): el kernel copia `azure-blob-file-storage.ts` en TODAS las apps, nadie lo referencia y
   `@azure/storage-blob` NO está en el `package.json` emitido — compila aquí solo por hoisting del
   monorepo; en máquina de cliente reventaría. Arreglo: sacarlo del kernel siempre-emitido (plugin
   de storage) → **exige re-baseline deliberado del golden de app; requiere OK de Alfonso**.
2. **Adjuntos: alcance por página, no por registro.** Hoy `attachments: true` da un área de
   documentos de la entidad (albaranes, catálogos). Los adjuntos POR FILA necesitan el arquetipo
   `detail` (spec 15) — se añadirá allí.
3. **Sin fixture de oro para `attachments`** (TASK-05 de la spec 14): cubierto por 8 tests unitarios
   - compilación e2e real, pero no por el gate de oro. Congelar un modelo con adjuntos.
4. **La tabla del lienzo es una réplica controlada**, no el DataTable emitido (hacía falta para
   editar cabeceras). WYSIWYG estricto exigiría un «modo diseño» en el DataTable emitido.
5. **Puerto 3000 ocupado** por sap-licences en el entorno de Alfonso: el estudio arranca con
   `PORT=3400 npm run studio:api` (documentar en el README del estudio).
6. **Vista de generación con animación** (petición de Alfonso, 2026-08-01): al pulsar «Generar
   aquí» el diálogo debería dar paso a una **pantalla de progreso animada** (spinner/pasos con
   estados: validando diseño → generando módulos → instalando dependencias → listo), no al
   estado «Generando…» de un botón. La generación puede tardar minutos con instalación, así que
   necesita feedback de progreso real (idealmente streaming del log del generador, hoy se
   devuelve entero al terminar).
7. **Pluralización naïf** en el lienzo (`newDraftResource`): «Vehículo» → vehiculos. Suficiente para
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

11. **Booleanos en la tabla emitida se ven como `true`/`false`** (visto en la
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
  database    postgres ✅ | mongo 🚧          spec 06 (rellenar mongo.provider.ts)
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
20. **`build-mongo.spec.ts` sin `build-mongo.ts`**: la suite de `generators` tiene
    una suite que no compila desde antes de la spec 23 (TASK-06 de la spec 06 a medias).
21. **Los 2 tests rojos de `TenantScopedSessionStore`** (ver spec D arriba).
