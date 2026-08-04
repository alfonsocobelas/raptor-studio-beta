# Diseño técnico: proveedor `infra=azure`

> Diseño aprobado en brainstorming 2026-08-04.

---

## 1. Reparto: qué es base y qué es del proveedor

```
  kernel/files (SIEMPRE emitido)                      files-infra-azure (sólo con --infra=azure)
  ─────────────────────────────────                   ──────────────────────────────────────────
  logger/app-logger.service.ts    winston →stdout     logger/azure-otel.transport.ts
    JSON en dev/prod, legible en local/test             el transporte OTel que hoy vive DENTRO
                                                        del logger
  config/loaders/config-sources.ts                    config/loaders/azure/
    JSON por entorno + variables de entorno             azure-config-loader.ts
                                                        azure-secret-resolver.ts  (vault.* → Key Vault)
  storage/  (sólo con adjuntos)                       storage/azure-blob-file-storage.ts
    file-storage.port.ts                              telemetry/instrument.ts
    local-file-storage.ts                             telemetry/init-telemetry.ts
    storage.module.ts
```

El renombre `azure-logger.service.ts` → `app-logger.service.ts` no es cosmético: hoy el nombre miente
(es winston) y ese nombre es la razón por la que el acoplamiento pasó inadvertido.

## 2. Manifiesto del proveedor de infra

Mismo patrón que `PersistenceProvider` (spec 23): datos y funciones, sin decoradores.

```typescript
export interface InfraProvider {
  value: string // 'none' | 'azure'
  label: string
  /** Subárbol de plantillas que añade al emitido (vacío en 'none') */
  files?: string
  dependencies?: Record<string, string>
  /** Secciones de config que el proveedor añade a config-types/config-validation */
  configSections?: string[]
  /** Cableado libre: primer import de main.ts, binding del StorageModule… */
  apply?(tree: Tree, context: PluginContext): void
}
```

Se registra como proveedor de la ranura `infra` en `plugins/slots.ts`, así que aparece solo en el
CLI (`schema.json` + su test de paridad) y en `slots.json` → wizard.

## 3. Selección de storage: por sección de config, no por flag

Igual que el plugin de email ya decide su adapter por la sección presente:

```
  config trae `storage.azure`  →  StorageModule enlaza AzureBlobFileStorage
  no la trae                   →  StorageModule enlaza LocalFileStorage
```

Así `make local-setup` funciona sin cuenta de Azure y el mismo binario sirve para local y para
producción. El binding lo escribe `apply()` del proveedor sobre el `StorageModule` ya emitido.

## 4. Telemetría

`instrument.ts` debe ser el **primer** import del bundle: el SDK de Azure Monitor parchea `http`,
`pg`… antes de que la app los cargue. Es exactamente lo que hoy hace el plugin `observability`, así
que su `apply()` se mueve tal cual al proveedor. `observability` desaparece de `PLUGINS` y
`--plugins=observability` se traduce a `--infra=azure` con aviso, reutilizando el mecanismo de
`normalizeLegacyPlugins` que ya existe para `--plugins=auth`.

## 5. El candado

Un test sobre el árbol emitido sin infra: ningún fichero importa `@azure/*` ni el `package.json`
declara dependencias de Azure. Es el gate que faltaba — el bug actual sobrevivió al golden (que
compara ficheros, y los ficheros de Azure estaban congelados en la fixture) y a la suite del plugin
(que no compila lo emitido).

Complemento: el criterio de aceptación de compilar **fuera del árbol del acelerador**. Dentro del
monorepo el hoisting tapa el problema, así que el typecheck debe correr en un directorio ajeno.

## 6. Fixtures y gates

```
  app        postgres · auth,email · infra=azure   ← "todo encendido"; re-baseline deliberado
  app-mongo  mongo    · sin plugins · infra=none   ← cubre la ausencia de infra
```

Sin tercera fixture: con esas dos quedan cubiertas las dos dimensiones. El re-baseline de `app` va en
commit propio (`chore(golden): …`), como manda la skill.

## 7. Testing

- Unit (plugin): registro de la ranura con el proveedor nuevo, manifiesto (deps, ficheros, secciones
  de config), mapeo de compatibilidad de `--plugins=observability`, binding del StorageModule por
  sección de config, `instrument` como primer import.
- Candado: sin `@azure/*` en el emitido sin infra.
- Golden: 6 gates vacíos tras el re-baseline.
- Verificación manual (una vez): app azure y app sin infra, `npm install` + `tsc` **fuera** del
  monorepo. Es la única forma de ver el fallo que motiva la spec.
