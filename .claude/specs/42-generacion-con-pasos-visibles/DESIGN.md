# Diseño técnico: Generación con pasos visibles

## Disposición

```
┌───────────────────────────────────────────────────────────────────────────────────┐
│ [R] mi-app  GENERANDO · 1 MIN 12 S              [Cancelar] [Seguir en segundo plano] │
├──────────────────────────────────────────────────┬────────────────────────────────┤
│  Construyendo tu aplicación                      │  MIENTRAS TANTO                │
│  ███████████████░░░░░░░░░░  3 de 5 fases         │                                │
│                                                  │  Se está escribiendo           │
│  ✓ Preparando el proyecto              4 s       │   ✓ Prenda      (entidad)      │
│  ✓ Instalando dependencias · 142 paq.  31 s      │   ✓ Proveedor   (entidad)      │
│  ◐ Escribiendo el código               37 s      │   ✓ Prendas     (vista)        │
│  ○ Ajustando la configuración                    │   ◐ Movimientos (vista)        │
│  ○ (omitida) Instalando dependencias             │   ○ Auth        (módulo)       │
│                                                  │                                │
│  ┌ REGISTRO TÉCNICO ─────────── Mostrar ▾ ┐      │  Cuando termine, para verla:   │
│  └─────────────────────────────────────────┘     │   cd apps/mi-app && npm run …  │
└──────────────────────────────────────────────────┴────────────────────────────────┘
```

La cabecera es **propia de la obra**: sin migas ni stepper (ya no hay nada que elegir) y con
las dos salidas a la derecha. El resto de la capa es la misma de la spec 41.

## Qué se sabe y de dónde (la tabla que gobierna la pantalla)

| Dato en pantalla | Origen |
| ---------------- | ------ |
| Lista de fases | constante en el frontend: el generador siempre recorre las mismas |
| Fase en curso | `progress.phase` (clave nueva, ver abajo) |
| Tiempo por fase | reloj del frontend, entre transiciones de fase |
| Tiempo total | reloj, ya existe |
| Nº de paquetes | `added N packages` de la salida de npm |
| Nº de ficheros | contador de líneas `CREATE`, ya existe |
| Entidad/vista/módulo escrito | ruta de la línea `CREATE`, cruzada con el diseño |
| Registro técnico | la salida cruda, que el backend ya acumula en `output` |

Nada más. **No hay porcentaje, ni ETA, ni publicación.**

## Borde: el paso pasa a tener CLAVE (`progress.ts`)

Hoy `describeProgress` devuelve la etiqueta en español (`step: 'Instalando dependencias'`).
La pantalla necesita una **clave estable** para casar el evento con su fila, sin comparar
cadenas traducibles:

```ts
type PhaseKey = 'prepare' | 'write' | 'configure' | 'install'

interface Progress {
  phase: PhaseKey | 'error'
  step: string          // la etiqueta de hoy, que sigue viajando (compatibilidad)
  file?: string
  packages?: number     // solo en la línea `added N packages`
}
```

El controlador reemite `phase` y `packages` en el evento NDJSON. Es aditivo: quien solo mire
`step` sigue funcionando.

## Frontend: `generate-phases.ts` (nuevo, puro)

La lista declarada y el reductor de eventos a estados. Nada de Angular:

```ts
const PHASES = [
  { key: 'prepare',   label: 'Preparando el proyecto',    hint: 'Estructura de carpetas y configuración base' },
  { key: 'write',     label: 'Escribiendo el código',     hint: 'Entidades, vistas y módulos' },
  { key: 'configure', label: 'Ajustando la configuración',hint: 'Nx, rutas y arranque' },
  { key: 'install',   label: 'Instalando dependencias',   hint: 'npm install + Spartan' }
]

applyPhase(state, event, atMs): PhaseState[]   // running | done | pending | skipped | failed
```

Reglas: la fase que llega pasa a `running` y **cierra la anterior** con su duración (el
generador es secuencial); `install` nace `skipped` si se pidió no instalar; un evento de error
marca `failed` la que estuviera en curso. El orden de la lista es el orden real del generador
—escribe primero y instala al final—, no el de la maqueta.

Se prueba con listas de eventos, sin navegador: es donde vive toda la lógica de la pantalla.

## Frontend: `written-items.ts` (nuevo, puro)

Lo que alimenta el raíl. Cruza las rutas de `CREATE` con el diseño:

```ts
writtenItems(design, files): { label: string; kind: 'entity' | 'view' | 'module'; done: boolean }[]
```

Se declara la lista **antes** de empezar (las entidades y vistas del diseño, más los módulos
que las ranuras implican: `auth` si hay autenticación, `email` si está el plugin) y se marca
cada una cuando aparece un fichero cuya ruta la nombra. Es el «3 de 4 vistas» de la maqueta,
pero derivado y sin inventar el total.

## Backend: cancelar de verdad

`POST /studio/generate/stream` gana el cierre que hoy no tiene:

- `res.on('close')` → si la respuesta se cierra sin haber terminado, `child.kill('SIGTERM')`.
- Si el directorio destino **no existía** antes de arrancar, se borra al cancelar. Se decide
  ANTES de lanzar el generador (`existsSync`) y se guarda: después ya es indistinguible.
- El frontend cancela abortando el `fetch` (`AbortController`), que es lo que cierra la
  respuesta. Sin endpoint nuevo.

```
cliente        AbortController.abort()
   │
   ▼
express        res 'close'  →  child.kill()  →  ¿lo creamos?  →  rm -rf destino
```

## Frontend: el runner crece

`GenerateRunner` (spec 41) suma: `phases`, `written`, `packages`, `cancel()`, `outcome`
(`ok | failed | cancelled | null`) y **sobrevive a la capa** — ya es `providedIn: 'root'`, así
que «seguir en segundo plano» es cerrar la capa y no tocar nada. Al terminar, si la capa está
cerrada, avisa por `CanvasNoticeService`.

## Componentes

```
generate-page.component.ts     el paso 2 (nombre y avanzado al raíl) y el cambio de paso
generate-work.component.ts     NUEVO  la obra: cabecera, barra, fases, registro, raíl
generate-phases.ts / .spec     NUEVO  puro
written-items.ts / .spec       NUEVO  puro
generate-runner.ts             + fases, cancelación y desenlace
studio-canvas.component.ts     el botón cuenta que está generando y avisa al terminar
```

`generate-work.component` usa `@Input()`/`@Output()` como el resto de la spec 41: el runner de
tests compila JIT y las señales de entrada no se registran (ver DESIGN de la 41).

## Riesgos

- **`written-items` es heurística**: casa nombres contra rutas. Si no casa, la fila se queda
  sin marcar — nunca al revés. Preferible a inventar un total.
- **Matar el hijo no mata a sus nietos**: `npx nx` lanza a su vez el generador. Si SIGTERM al
  padre deja huérfano el npm install, hay que matar el grupo de procesos (`detached` + kill al
  grupo negativo). Se comprueba de verdad en la validación, no se supone.
- **Borrar un directorio es irreversible**: por eso solo se borra el que creó esta generación,
  la comprobación se hace antes de escribir nada, y nunca se borra una ruta fuera del
  workspace.
