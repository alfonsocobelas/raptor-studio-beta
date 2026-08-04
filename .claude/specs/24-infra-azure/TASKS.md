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
- [ ] **TASK-04**: Proveedor `azure`: subárbol `files-infra-azure` con los loaders de Key Vault +
      las cuatro dependencias `@azure/*` declaradas + secciones de config (`vault`, `storage.azure`,
      `applicationInsights`). `--infra` aparece en `schema.json` (su test de paridad lo exige) y en
      `slots.json`.
- [ ] **TASK-05**: Telemetría en el proveedor: `instrument.ts`/`init-telemetry.ts` y el `apply()` que
      los pone como primer import de `main.ts`. `observability` sale de `PLUGINS` y
      `--plugins=observability` mapea a `--infra=azure` con aviso de deprecación.
- [ ] **TASK-06**: Storage: el proveedor emite `azure-blob-file-storage.ts` y su `apply()` enlaza el
      adapter en el `StorageModule` **por sección de config** (`storage.azure` presente → Blob; si no,
      disco local), igual que ya hace el plugin de email.

## Cierre

- [ ] **TASK-07**: Re-baseline de la fixture de app como "todo encendido"
      (`--plugins=auth,email --infra=azure`), revisión del diff a mano, y commit propio
      `chore(golden): …`. Los 6 gates en verde.
- [ ] **TASK-08**: Verificación que el golden NO puede dar: generar una app sin infra y una app azure
      **fuera del árbol del acelerador**, `npm install` + `tsc` en ambas. Es el único sitio donde se
      ve el fallo que motiva la spec (dentro del monorepo el hoisting lo tapa). Anotar el resultado
      en esta spec y, si procede, proponer el gate automatizado en el ROADMAP.
