# Diseño técnico: Ranuras de capacidad + proveedor de persistencia

> Diseño aprobado en brainstorming 2026-08-03 (bloques 1 y 2).

---

## 1. Modelo de ranuras (`libs/generators/src/generators/app/plugins/`)

Dos clases de capacidad conviven en el mismo directorio y estilo (manifiesto tipado, sin decoradores):

```
RANURAS EXCLUSIVAS (elige exactamente uno)     PLUGINS ADITIVOS (suma los que quieras)
┌────────────┬──────────────────────────┐      ┌───────────────┐
│ ranura     │ proveedores              │      │ email         │
├────────────┼──────────────────────────┤      │ observability │
│ database   │ postgres* │ mongo        │      └───────────────┘
│ ui         │ spartan*  │ material     │      (hasta la spec de infra,
│ infra      │ none*                    │       que los absorbe)
│ auth       │ none* │ single-tenant    │
└────────────┴──────────────────────────┘      * = default
```

### Tipos (nombres orientativos, en `slots.ts`)

```typescript
interface SlotProvider {
  value: string                       // 'postgres', 'single-tenant'…
  label: string                       // etiqueta del formulario
  description?: string
  /** Restricciones contra otras ranuras: sustituye al requiresDatabase ad-hoc */
  requires?: Record<string, string>   // p.ej. { database: 'postgres' }
  /** Manifiesto de emisión — mismo shape que AppPlugin (deps, assets, apply…) */
  plugin?: AppPlugin
}

interface Slot {
  name: string                        // 'database', 'ui', 'infra', 'auth'
  label: string
  default: string
  providers: SlotProvider[]
}

export const SLOTS: Record<string, Slot>
export function selectProvider(slot: string, value: string | undefined): SlotProvider  // error genérico con lista
export function validateCombination(selection: Record<string, string>): void           // aplica requires
```

- `selectDatabase()` y el guard `requiresDatabase` de `selectPlugins()` desaparecen: los sustituyen
  `selectProvider('database', …)` y `validateCombination(…)`.
- `auth` deja `PLUGINS` y pasa a proveedor `single-tenant` de la ranura `auth` (mismo código emitido;
  su manifiesto `AppPlugin` actual se reutiliza tal cual como `provider.plugin`).
  Compat: `--plugins=auth` → warning + mapeo a `auth=single-tenant`.
- Flags CLI: `--database`, `--ui` sin cambios; `--auth` nuevo en `app/schema.json` (x-prompt list,
  default `none`). `--infra` NO se expone aún (una ranura con un solo proveedor no se pregunta).

## 2. Proveedor de persistencia (dueño de la emisión)

Los proveedores de `database` llevan, además del manifiesto común, los datos que hoy están
desperdigados en `if`s por `kernel.ts`, `resource.ts` y `app.ts`:

```typescript
interface PersistenceProvider extends SlotProvider {
  kernelFiles: string                 // 'files-postgres' | 'files-mongo' (kernel)
  dependencies: Record<string, string> // typeorm+pg | mongoose+@nestjs/mongoose
  composeService(overrides): string    // bloque docker-compose local/test
  patchLocalConfig(tree, path, overrides): void  // sustituye el parche `config.typeorm` (app.ts:307)
  testRepositoryImport(model): string  // sustituye el import TypeOrm hardcodeado (app.ts:201)
  // la selección de árbol por recurso (typeorm/ vs mongoose/) sigue en resource.ts,
  // pero consulta provider.name en UN punto, no en ifs repartidos
}
```

- `kernel.ts`, `resource.ts` y `app.ts` reciben el proveedor resuelto (no el string). Los literales
  `'typeorm'`, `'postgres'`, `'mongo'` quedan confinados a `persistence/postgres.provider.ts` y
  `persistence/mongoose.provider.ts` (más las plantillas, que no cambian).
- Los árboles de plantillas existentes (`files-postgres/`, `files-mongo/`, `persistence/typeorm/`)
  NO se mueven ni se tocan: solo cambia quién decide cuál se copia.
- **Gate de refactor**: golden diff postgres vacío; la salida mongo actual, idéntica salvo la
  eliminación de los dos restos TypeORM (que hoy son bugs en modo mongo, no comportamiento a conservar).

## 3. Manifiesto `slots.json` y estudio

```
libs/generators (la verdad)
  SLOTS + PLUGINS ──(target nx / script)──▶ tools/slots.json  (commiteado)
                                               │
        ┌──────────────────────────────────────┤
        ▼                                      ▼
  studio-api                             wizard (frontend)
  GET /studio/slots lo sirve             lo pide por HTTP y pinta:
  (lee desde ACELERADOR_ROOT)            · un grupo de radios por ranura
  y valida POST /studio/generate         · checkboxes por plugin aditivo
  contra él (borde)                      · deshabilita combinaciones que
                                           violan `requires` (en vivo)
```

- Contenido por ranura: `name`, `label`, `default`, `providers[{value,label,description,requires}]`;
  más `plugins[]` aditivos. Solo datos serializables — los manifiestos de emisión NO viajan.
- **Test de paridad** en la suite del workspace: regenera el manifiesto en memoria y falla si
  difiere del commiteado (mismo espíritu que el golden diff).
- `generator-args.ts`: elimina `UI_VALUES`/`DATABASE_VALUES`/`PLUGIN_VALUES`; valida contra el
  manifiesto cargado (una vez, al arrancar). La validación de forma (kebab, rutas) se queda.
- `wizard-command.ts`: `WizardOptions` pasa a `{ name, slots: Record<string,string>, plugins: string[] }`;
  `buildCommand` emite un flag por ranura + `--plugins`. `UI_OPTIONS` y compañía desaparecen.
- Ranuras con un solo proveedor (p. ej. `infra`=`none`) no se pintan en el wizard ni emiten flag.

## 4. Errores

- Valor desconocido en ranura → `Unknown <slot> '<valor>'. Available: <lista>` (generador y studio-api).
- Combinación inválida → mensaje del `requires` violado, antes de emitir un solo fichero; en el
  wizard la opción aparece deshabilitada con el motivo como tooltip/texto.
- Manifiesto desfasado → test de paridad rojo con instrucción de regenerar (`nx run generators:slots`).

## 5. Testing

- Unit (jest, plugin): `SLOTS`/`selectProvider`/`validateCombination`; mapeo compat `--plugins=auth`;
  manifiestos de proveedor (deps, compose, patch, import de test-repos); emisor de `slots.json`.
- Golden: fixture postgres diff vacío (gate); salida mongo inspeccionada (aún sin fixture golden —
  llegará con la spec 06 re-encajada).
- Studio: unit de `generator-args`/`wizard-command` contra un manifiesto fixture; smoke Playwright
  del wizard (pinta desde endpoint + deshabilita combinación inválida).

## 6. Impacto en specs vecinas

- **Spec 06 (mongo)**: TASK-06..12 se reformulan como «rellenar `mongooseProvider`» — sin cambio de
  alcance funcional.
- **Specs C1–C4 (infra)** y **D (auth multi-tenant)**: consumen el mecanismo; añadir proveedor =
  carpeta assets + manifiesto + entrada en `SLOTS`.
