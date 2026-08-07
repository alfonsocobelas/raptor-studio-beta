# Tareas atómicas: proveedor `infra=azure`

> Cada tarea = un commit atómico en develop. Implementar UNA, commitear, informar, siguiente.
> Gate permanente: los 6 golden en verde antes de cada commit (el re-baseline de `app` es TASK-07).

---

## Base honesta (el bug primero)

- [x] **TASK-01+02** (juntas: el candado es lo que las hace una unidad) — `de04f3f` + re-baseline
      `9b98898`. El logger pasa a `logger/app-logger.service.ts` (winston, sin OTel) con una costura
      `EXTRA_LOG_TRANSPORTS` para que un proveedor añada transportes sin tocar el fichero. Salen del
      kernel base los loaders de Azure y el adapter de Blob (a `files-infra-azure`, dormidos hasta
      TASK-04), y `AzureKeyVaultError` se generaliza a `SecretResolutionError` (todo proveedor de
      secretos lo necesitará). Nuevo `config-loader.ts` base.
      · **alcance recortado y declarado**: TASK-02 decía «JSON por entorno + variables de entorno».
      El overlay por variables de entorno exige inventar una sintaxis de marcadores, así que NO se
      hizo: el loader base valida el JSON y **falla con mensaje claro** si encuentra `vault.*` sin
      proveedor de secretos, en vez de arrancar con la cadena literal. El overlay queda para C2,
      que lo necesita de verdad (lowcost con Bitwarden/env).
      · **cambio de plan sobre el re-baseline**: el cambio es de la BASE, así que afecta a las dos
      fixturas de app (la spec sólo preveía `app`). Y en vez de arrastrar el gate rojo hasta
      TASK-07, se re-baselinea aquí el cambio de base (19 ficheros, diff pequeño y revisable) y en
      TASK-07 se re-baselineará la vuelta de Azure como proveedor. Dos re-baselines pequeños en vez
      de uno grande y mezclado; el gate nunca queda rojo.
      · candado nuevo (`infra-free.spec.ts`): una app sin infra no nombra ninguna clase, ruta ni
      dependencia de Azure

## Ranura y proveedor

- [x] **TASK-03**: Tests + tipo `InfraProvider` y proveedor `none`; la ranura `infra` pasa a
      resolverse por manifiesto (hoy sólo declara el valor). Sin cambio de salida.
- [x] **TASK-04**: Proveedor `azure`: subárbol `files-infra-azure` con los loaders de Key Vault +
      las cuatro dependencias `@azure/*` declaradas + secciones de config (`vault`, `storage.azure`,
      `applicationInsights`). `--infra` aparece en `schema.json` (su test de paridad lo exige) y en
      `slots.json`.
- [x] **TASK-05**: Telemetría en el proveedor: `instrument.ts`/`init-telemetry.ts` y el `apply()` que
      los pone como primer import de `main.ts`. `observability` sale de `PLUGINS` y
      `--plugins=observability` mapea a `--infra=azure` con aviso de deprecación.
- [x] **TASK-06**: Storage: el proveedor emite `azure-blob-file-storage.ts` y su `apply()` enlaza el
      adapter en el `StorageModule` **por sección de config** (`storage.azure` presente → Blob; si no,
      disco local), igual que ya hace el plugin de email.

## Cierre

- [x] **TASK-07**: Re-baseline de la fixture de app como "todo encendido"
      (`--plugins=auth,email --infra=azure`), revisión del diff a mano, y commit propio
      `chore(golden): …`. Los 6 gates en verde.
      · **hecha de facto en `47aa445`** (TASK-05/06): el gate `app` de `golden-diff.sh` corre desde
        entonces con `--plugins=auth,email --infra=azure --dashboard` y la fixture lleva las piezas
        azure (logger, storage, config loaders). Verificado hoy (2026-08-07): 6 gates en verde con
        635 ficheros en `app`. Sólo faltaba cerrar esta casilla
- [x] **TASK-08**: Verificación fuera del árbol del acelerador. **Hecha 2026-08-04**: las dos apps
      (`--app=boutique` sin infra y con `--infra=azure`) se generaron, se movieron FUERA del
      monorepo, y allí `npm install` + `tsc` dan **0 errores** en ambas. La azure instala y usa sus
      4 dependencias `@azure/*` declaradas.
      · **y encontró un bug real que ningún otro gate veía**: al renombrar el logger en TASK-01, sus
      tres imports del dominio quedaron un nivel demasiado arriba y **ninguna app emitida compilaba**.
      No lo cazó el golden (compara ficheros, y la fixture se congeló con los imports roteros), ni la
      suite del plugin (no compila lo emitido), ni un typecheck previo (el último fue anterior al
      renombre). Arreglado en `ea6031d` + re-baseline `a296f65`.
      · conclusión para el ROADMAP: este typecheck **debería ser un gate**, no una verificación
      manual. Es el único que ve esta clase de fallo (imports roteros, deps no declaradas).
