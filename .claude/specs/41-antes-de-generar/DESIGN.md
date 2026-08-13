# Diseño técnico: «Antes de generar»

## Disposición

```
┌───────────────────────────────────────────────────────────────────────────────────┐
│ [R] mi-app / Antes de generar    ✓Vistas ── ②Infraestructura ── ③Generar   Volver al lienzo │
├──────────────────────────────────────────────────┬────────────────────────────────┤
│  ¿Dónde quieres alojarla?                        │  TU APLICACIÓN                 │
│  Puedes cambiar de proveedor más adelante.       │  4 vistas · 9 bloques          │
│  ┌────────┐┌────────┐┌────────┐┌────────┐        │  3 recursos · preset cabina    │
│  │Ninguna ││ Azure  ││  AWS   ││  GCP   │        │                                │
│  │        ││        ││próxim. ││próxim. │        │  ── LA PILA ──                 │
│  └────────┘└────────┘└────────┘└────────┘        │  Alojamiento     Azure         │
│  ┌───────────────────┐┌───────────────────┐      │  Base de datos   PostgreSQL    │
│  │ BASE DE DATOS     ││ AUTENTICACIÓN     │      │  Autenticación   Single-tenant │
│  │ ┌──────┐┌───────┐ ││ ┌────┐┌──────┐    │      │  Complementos    Correo        │
│  │ │Postgr││ Mongo │ ││ │ Sin││Single│…   │      │                                │
│  │ └──────┘└───────┘ ││ └────┘└──────┘    │      │  ┌──────────────────────────┐  │
│  └───────────────────┘└───────────────────┘      │  │       Continuar →        │  │
│  ┌───────────────────┐┌───────────────────┐      │  └──────────────────────────┘  │
│  │☑ Correo saliente  ││☐ Redis  próxim.   │      │                                │
│  └───────────────────┘└───────────────────┘      │                                │
│  ┌───────────────────┐┌───────────────────┐      │                                │
│  │☐ Observab. próxim.││☐ Almacen. próxim. │      │                                │
│  └───────────────────┘└───────────────────┘      │                                │
│  ┌───────────────────┐                           │                                │
│  │☐ Dominio  próxim. │  ← cinco tarjetas: la     │                                │
│  └───────────────────┘     última fila va sola   │                                │
└──────────────────────────────────────────────────┴────────────────────────────────┘
```

El paso 3 conserva cabecera y raíl; cambia solo la columna central (nombre, avanzado,
comando, progreso) y el texto del botón del raíl.

## Ficheros

```
domains/studio/generate/
  generate-catalog.ts          NUEVO  catálogo de redacción + fusión con el manifiesto (puro)
  generate-catalog.spec.ts     NUEVO
  generate-runner.ts           NUEVO  el servicio que habla con /generate/stream (hoy en el componente)
  generate-runner.spec.ts      NUEVO
  wizard-command.ts            +      designSummary()
  wizard-command.spec.ts       +
  generate-page.component.ts   NUEVO  la capa: cabecera, pasos, raíl, estado
  generate-page.component.spec.ts NUEVO
  generate-cards.component.ts  NUEVO  presentacional: fila de tarjetas de elección y de complemento
  generate-wizard.component.ts BORRA
```

## `generate-catalog.ts` — la única pieza nueva de dominio

El catálogo es una **constante declarativa**: por cada tarjeta, la ranura a la que pertenece,
el valor de proveedor que la respalda y su redacción. No dice qué está disponible.

```ts
interface CatalogEntry {
  slot: string          // 'infra' | 'database' | 'auth'
  value: string         // el provider.value que la respalda
  title: string
  hint: string
}

interface Card {
  slot: string
  value: string
  title: string
  hint: string
  available: boolean    // ¿lo publica el manifiesto?
  disabled: boolean     // available === false, o requires incumplido
  reason?: string       // 'Próximamente' | 'Requiere database=postgres'
}

mergeCatalog(manifest: SlotsManifest, selection: Record<string, string>): {
  groups: { slot: string; label: string; cards: Card[] }[]
  addons: Card[]
}
```

Reglas de la fusión, en este orden:

1. Un grupo por **ranura elegible** del manifiesto (`choosableSlots`), **menos `design`**:
   el preset lo manda el lienzo (`PreviewSettings.preset()`) y se enseña en el raíl.
2. Las tarjetas del grupo son las del catálogo para esa ranura, en el orden del catálogo,
   más —al final— cualquier proveedor del manifiesto que el catálogo no conozca, con la
   `label`/`description` que trae el manifiesto. **Nada real se queda sin pintar.**
3. `available` = el manifiesto publica ese `value` en esa ranura.
4. `disabled` = `!available || isDisabled(provider, selection)`; `reason` = «Próximamente» o
   el `requires` traducido (reutiliza la lógica que hoy vive en `requirementOf`).
5. Los complementos son los `plugins` del manifiesto más las cuatro entradas apagadas del
   catálogo (`redis`, `observability`, `object-storage`, `custom-domain`).

Catálogo inicial:

| ranura   | valor           | título                    | pista                                     |
| -------- | --------------- | ------------------------- | ----------------------------------------- |
| infra    | `none`          | Sin nube                  | Solo el código; despliegas tú             |
| infra    | `azure`         | Azure                     | Key Vault, Blob Storage, App Insights     |
| infra    | `aws`           | AWS                       | *(próximamente)*                          |
| infra    | `gcp`           | Google Cloud              | *(próximamente)*                          |
| database | `postgres`      | PostgreSQL                | Tus tablas tienen relaciones              |
| database | `mongo`         | MongoDB                   | Documentos sin esquema fijo               |
| auth     | `none`          | Sin autenticación         | Aplicación abierta                        |
| auth     | `single-tenant` | Single-tenant             | Sesión por cookie, invitaciones y roles   |
| auth     | `multi-tenant`  | Multi-tenant              | *(próximamente)*                          |

Complementos: `email` → «Correo saliente / avisos y recuperación de contraseña» (real);
`redis`, `observability`, `object-storage`, `custom-domain` → próximamente.

**Sin `raptor-cloud`**: es marca de la maqueta, no un adapter previsto. Si algún día existe,
se añade una fila al catálogo.

## `wizard-command.ts` — `designSummary`

```ts
designSummary(pages, resources): { views: number; blocks: number; resources: number }
```

Puro y trivial, pero con test: el raíl es lo que le dice al usuario qué va a obtener, y
contar bloques a ojo en la plantilla es cómo se cuelan los off-by-one.

## `generate-runner.ts` — el stream, fuera del componente

Servicio `@Injectable()` con las señales que hoy son campos del componente (`generating`,
`step`, `filesWritten`, `lastFile`, `seconds`, `output`, `ok`, `elapsed`) y un método
`run(body)`. Se extrae **sin cambiar comportamiento**: mismo `fetch`, mismo troceado NDJSON,
mismo ticker. Motivo: el botón que lanza vive en el raíl y el progreso se pinta en el centro,
así que dejarlo en un componente obliga a cablear entradas y salidas entre hermanos. De
paso se puede testear con un `fetch` falso, cosa que hoy no se hace.

## `generate-page.component.ts` — la capa

- `fixed inset-0 z-50 bg-background`, con `(document:keydown.escape)` para cerrar. No es
  ruta: el estudio no tiene router (la navegación de primer nivel es `mode()` en
  `studio-canvas.component.ts`).
- Estado propio con señales: `step: 'infra' | 'generate'`, `selection`, `plugins`, `name`
  (sembrado de `store.appName()`), `install`, `directory`, `manifest`, `manifestError`.
- Carga el manifiesto igual que hoy y siembra `design` con `preview.preset()`.
- `choose()` conserva la corrección de ranuras incompatibles que ya existe.
- Cabecera: marca, `store.appName()`, migas, el indicador de pasos y «Volver al lienzo».
- Raíl: resumen, la pila y el botón primario (`Continuar` / `Generar aplicación`).

## `generate-cards.component.ts` — presentacional

Dos selectores, sin estado y sin inyecciones:

- `<studio-choice-cards [group] (choose)>` — tarjeta con radio a la derecha, título, pista y
  pastilla de próximamente; la elegida lleva borde de acento.
- `<studio-addon-cards [cards] [active] (toggle)>` — lo mismo con casilla a la izquierda.

Ambas usan `.studio-ui`, `.studio-eyebrow` y `.studio-box` para no reinventar la tipografía
del estudio.

### Entradas con decorador, no con `input()` (restricción del runner)

El runner de tests es vitest **sin plugin de Angular**: compila en **JIT**, y en JIT las
entradas y salidas de señal **no se registran**. Comprobado con una sonda:

```
@Component({ template: '{{ label() }}' })  class A { label = input('vacío') }
@Component({ template: '{{ label }}' })    class B { @Input() label = 'vacío' }

setInput('label', 'puesto') →  A: NG0303, no se puede montar
                               B: pinta «puesto»
```

Por eso estos dos componentes usan `@Input()`/`@Output()`. No es preferencia de estilo: con
`input()` no habría manera de montarlos en un test, y arreglarlo de verdad es cambiar el
runner (plugin AOT), que es otra tarea. Lo mismo vale para cualquier componente nuevo de esta
spec que haya que montar. El resto del estudio sigue con señales porque **no tiene tests de
componente con entradas** — nadie se había topado con esto todavía.

## Compatibilidad con los smoke tools

Se conservan los `data-testid`: `open-wizard`, `wizard-name`, `wizard-install`,
`wizard-directory`, `wizard-command`, `wizard-copy`, `wizard-download`, `wizard-generate`,
`wizard-cancel`, `slot-<ranura>-<valor>`, `plugin-<nombre>`, `wizard-slots`,
`wizard-slots-error`, `generate-progress`, `generate-ok`, `generate-error`,
`generate-elapsed`. `wizard-dialog` pasa a nombrar la capa. Nuevos: `generate-step-infra`,
`generate-step-generate`, `generate-summary`, `generate-stack`, `generate-primary`,
`generate-back`, `soon-<clave>`.

## Riesgos

- **La pantalla crece**: si `generate-page.component.ts` pasa de ~350 líneas, la columna del
  paso 3 se saca a su propio componente. No se parte antes de que duela.
- **`design` fuera de las tarjetas**: hoy el preset se puede cambiar en el modal. Al quitarlo
  de aquí, el único sitio para cambiarlo es el lienzo. Es lo correcto (lo que ves es lo que
  se genera) pero es una capacidad que se mueve, no que se pierde.
