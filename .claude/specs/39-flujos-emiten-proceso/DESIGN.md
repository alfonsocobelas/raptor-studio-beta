# Diseño técnico: Los flujos emiten proceso

## Decisión de fondo: coreografía documentada, no orquestación (ni eventos)

El flujo dibujado en el estudio («De presupuesto a legalización») no es un proceso síncrono:
dura días o semanas y cada paso lo dispara un actor externo en un momento distinto (el cliente
aprueba o rechaza el presupuesto, el técnico cierra el montaje…). Es una **coreografía**, no una
orquestación. De ahí las tres reglas que gobiernan todo este diseño:

1. **La clase de proceso NO es un runner.** Es un agrupador de pasos: cada método es un punto de
   entrada independiente, invocable en momentos distintos por actores distintos. Nada encadena un
   método con el siguiente; la secuencia vive solo en la documentación (JSDoc). Un relleno de IA
   que llame a otro método de paso desde dentro de un hueco está mal y el prompt lo prohíbe.

2. **Los nodos `decision` no emiten código.** La decisión la toma el mundo exterior (una persona,
   otro sistema), no el proceso. En el código solo existen como documentación: el JSDoc de los
   pasos adyacentes dice «viene de la decisión X por la rama "sí"».

3. **Cada paso es autosuficiente.** El patrón que deben seguir los cuerpos (rellenos por IA o a
   mano) es: cargar la entidad por id → **validar el estado actual como precondición** → actuar →
   dejar el estado siguiente. Las reglas de transición («no se puede aprobar un presupuesto ya
   descartado») nacen del grafo pero se implementan como guardas dentro de cada paso, nunca como
   motor aparte.

```
  el mundo exterior coreografía; el proceso solo agrupa los pasos:

  POST /solicitar-presupuesto ──▶ proceso.presupuesto()     ──▶ instalacion: PENDIENTE
        (cliente aprueba)                                            días después…
  POST /:id/aprobar           ──▶ proceso.planifica(id)     ──▶ guarda: ¿estaba PENDIENTE?
  POST /:id/rechazar          ──▶ (actualiza a DESCARTADA)
        …
```

(Los endpoints del diagrama son el futuro consumidor, fuera de scope aquí — regla de los dos.
El diseño solo garantiza que la forma emitida es compatible con ellos.)

### Por qué NO una arquitectura event-driven (decisión 2026-08-11)

Se consideró y se descarta. Los eventos (broker, outbox, sagas, o siquiera eventos de dominio
in-process) resuelven el desacople **máquina-a-máquina**: que el sistema reaccione a algo sin que
el emisor conozca a los consumidores. Aquí la coordinación entre pasos la hacen **personas a lo
largo de días**: no hay ninguna reacción automática que desacoplar, y por tanto nada que publicar
ni a qué suscribirse. El «log de eventos» suficiente es el campo de estado en la entidad ancla.

- La app emitida es un monolito modular con una base de datos: un broker/outbox añadiría infra,
  consistencia eventual y carga de test para cero consumidores actuales (YAGNI, regla de los dos).
- EDA es *una* implementación de coreografía, no un requisito de ella. Endpoint por paso + guarda
  de estado es la implementación más simple que la resuelve.
- Cuándo sí reabrirlo: si un paso debe disparar reacciones automáticas (email, notificación,
  sincronizar un sistema externo), el borde natural son eventos de dominio in-process
  (EventEmitter2) — candidato a spec futura cuando aparezca el segundo consumidor real.

## Bloque A — capa generador

### Derivación (en `generator.ts`, plantillas tontas — regla 8)

Nuevo helper `flow-process.ts` junto a `brief-doc.ts`, con la misma filosofía: toda la derivación
produce strings/estructuras listas para interpolar.

- **Nombre del proceso**: nombre del flujo en kebab-case → carpeta y fichero
  (`de-presupuesto-a-legalizacion`); en PascalCase + sufijo → clase (`DePresupuestoALegalizacionProcess`).
- **Un método por nodo `step`**: nombre = id del nodo en camelCase. Firma:
  - con `entity`: `async planifica(id: InstalacionId): Promise<void>`
  - sin `entity`: `async cie(): Promise<void>`
  - Las firmas son estables (el harvest no cubre firmas): si un paso necesita más parámetros se
    añaden a mano y queda documentada la limitación.
- **Cuerpo**: hueco `// @ai:begin flow-<nodeId>` … `// @ai:end` vacío.
- **Constructor**: repositorios de las entidades citadas por los nodos, deduplicados, en orden de
  primera aparición BFS (`private readonly instalacionRepository: InstalacionRepository, …`).
- **JSDoc de cabecera**: nombre + descripción + mapa numerado BFS del flujo. Se **reutiliza**
  `renderFlows`/`bfsOrder` de `brief-doc.ts` (exportando lo necesario), no se duplica: mismo
  número de paso en el CLAUDE.md y en el código.
- **JSDoc por método**: `Paso N — <texto>`, de dónde viene (con etiqueta de rama si viene de una
  decisión) y a dónde va. `start`/`end`/`decision` solo existen aquí.

### Ficheros emitidos

```
apps/<app>-api/src/contexts/<ctx>/
  processes/
    processes.module.ts                                  ← solo si hay flujos
    de-presupuesto-a-legalizacion/
      de-presupuesto-a-legalizacion.process.ts
```

- Plantillas nuevas en `files-flow-process/`: `__flowFileName__.process.ts.template` y
  `processes.module.ts.template` — solo interpolan.
- `ProcessesModule`: procesos como providers, `imports` de los módulos de las entidades citadas
  (para poder inyectar sus repositorios). Se registra en el módulo del contexto.
- Dirección de dependencias: `processes/` → `modules/`, nunca al revés (`architecture-guard` gana).
- Sin flujos en el diseño: no se emite `processes/` ni módulo — los golden sin flujos dan diff vacío.
- Supervivencia: los huecos `flow-*` entran por el mecanismo existente de `ai-slots.ts`
  (harvest + reinyección), sin cambios en su código.

## Bloque B — comando de relleno bajo gate

Comando sobre una app ya emitida (ejecutor = Claude Code vía puente, nunca un SDK embebido):

1. `harvestAiSlots` recolecta los huecos `flow-*` vacíos.
2. Por hueco se construye un prompt con contexto acotado: el `CLAUDE.md` del negocio, el mapa del
   flujo, el JSDoc del paso y las firmas de los repositorios inyectados. Nada más. El prompt
   incluye el contrato coreográfico: cuerpo autosuficiente, guarda de estado como precondición,
   prohibido invocar otros métodos de paso, prohibido tocar nada fuera del hueco.
3. La escritura queda acotada por `SLOT_REGEX`: cualquier edición fuera del hueco invalida el
   resultado.
4. **Gate determinista por hueco**: `build` + `test` de la app emitida en verde Y regeneración +
   reinyección sin pérdida. Si falla, el hueco se vacía y se reporta el motivo — nunca queda
   código rojo.
5. Sin ejecutor disponible: se reportan los huecos pendientes y el comando termina sin tocar nada.

## Decisiones técnicas

- **Coreografía documentada, no runner ni máquina de estados**: ver decisión de fondo. Ejecutar el
  grafo sería inner-platform (regla 7).
- **Sin eventos**: ver «Por qué NO event-driven». La coordinación es humana; el estado en BD basta.
- **Una clase por flujo con N métodos** (no un use case por paso): los pasos comparten los repos y
  el mapa del flujo; agruparlos mantiene la coreografía legible de una pieza. Si un paso crece
  hasta merecer use case propio, se extrae a mano sobre el emitido (regla 7).
- **`Promise<void>` como retorno de los pasos**: no hay consumidor que exija otra cosa; firma
  mínima estable.
- **Reutilizar `renderFlows`** en vez de un render nuevo: un solo orden BFS en todo el proyecto;
  divergencia imposible por construcción.
- **Regla de negocio ≠ flujo**: los invariantes estructurales («no hay parte sin instalación»)
  viven en el dominio del recurso y ya los cubre el generador normal; jamás se modela un flujo por
  regla. Del flujo solo nacen reglas de *transición*, y van dentro de los pasos.

## Riesgos identificados

- **La IA encadena pasos dentro de un hueco** (rompe la coreografía): mitigado por el contrato en
  el prompt + revisión; el gate no lo detecta (compila igual), así que el prompt es la barrera.
- **Ids de nodo pobres** (`paso-1`) dan métodos ilegibles: se acepta; el estudio ya genera slugs
  con significado y el JSDoc lleva el texto completo del nodo.
- **Flujo sin nodo `start` o con nodos huérfanos**: `bfsOrder` ya los ordena al final de forma
  determinista; la validación de forma vive en `validate-flows.ts` (frontera), no aquí.
- **Módulo de entidad sin exportar su repositorio**: si el módulo del recurso no exporta el repo,
  `ProcessesModule` no puede inyectarlo — verificar en la fixture con flujos y, si hace falta,
  añadir el export al generador de recurso (cambio con golden-diff).
- **Colisión de nombres** (dos flujos con el mismo nombre kebab): la frontera valida unicidad;
  el generador asume nombres únicos.
