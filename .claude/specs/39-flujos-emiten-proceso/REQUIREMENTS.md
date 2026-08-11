# Spec: Los flujos emiten proceso

## Contexto de negocio

La spec 28 dejó los flujos de negocio como metadatos que solo viajan al `CLAUDE.md`
de la app generada. Revisando la demo solaris quedó claro que la prosa no justifica
el viaje por el generador: el flujo dibujado en el estudio («De presupuesto a
legalización») describe un proceso real que cruza entidades (`instalacion`, `parte`)
y hoy no deja rastro alguno en el código emitido.

Esta spec cierra el círculo del lema del proyecto: el flujo emite **estructura
determinista** (una clase de proceso cableada, un método por paso, huecos
`// @ai:begin flow-<nodo>` vacíos) y la **variabilidad queda en los bordes** (un
comando de relleno donde la IA escribe solo dentro de los huecos), con
**verificación en la frontera** (gate: compila + tests + regeneración sin pérdida).
Es el primer uso real de los huecos @ai como mecanismo de generación asistida,
no solo como punto de extensión manual.

## User stories (formato EARS)

### Bloque A — esqueleto determinista

- WHEN el diseño tiene flujos THEN el generador de app emite, por cada flujo, una
  clase de proceso en `contexts/<ctx>/processes/<flujo-kebab>/<flujo-kebab>.process.ts`.
- WHEN un flujo tiene nodos `step` THEN la clase emite un método `async` por nodo,
  con nombre = id del nodo en camelCase y cuerpo = hueco `// @ai:begin flow-<nodeId>`
  … `// @ai:end` vacío.
- IF un nodo `step` declara `entity` THEN el método recibe `id: <Entity>Id`; si no,
  no recibe parámetros.
- WHEN los nodos del flujo citan entidades THEN el constructor inyecta los
  repositorios de esas entidades, deduplicados y en orden de primera aparición.
- WHEN se emite la clase THEN su JSDoc de cabecera contiene el nombre, la
  descripción y el mapa numerado BFS del flujo (mismo render que `renderFlows`
  de `brief-doc.ts`, reutilizado — no duplicado).
- WHEN se emite un método de paso THEN su JSDoc indica número de paso, texto del
  nodo, de dónde viene (incluidas ramas de decisión con su etiqueta) y a dónde va.
- IF un nodo es `start`, `end` o `decision` THEN NO emite método: vive solo en la
  documentación (mapa de cabecera y JSDoc de los pasos adyacentes).
- WHEN el diseño tiene al menos un flujo THEN se emite `processes/processes.module.ts`
  con los procesos como providers, importando los módulos de las entidades citadas,
  y se registra en el módulo del contexto.
- IF el diseño no tiene flujos THEN no se emite la carpeta `processes/` ni el módulo
  (los golden actuales sin flujos dan diff vacío).
- WHILE se regenera la app THEN el contenido escrito dentro de los huecos `flow-*`
  sobrevive (harvest + reinyección de `ai-slots.ts`, sin cambios en su mecanismo).
- WHEN el diseño tiene flujos THEN el render en `CLAUDE.md` (spec 28) se mantiene
  intacto: prosa para la memoria, proceso para el código.

### Bloque B — relleno IA bajo gate

- WHEN se invoca el comando de relleno sobre una app emitida THEN se recolectan los
  huecos `flow-*` vacíos con `harvestAiSlots` y se construye, por hueco, un prompt
  con contexto acotado: el `CLAUDE.md` del negocio, el mapa del flujo, el JSDoc del
  paso y las firmas de los repositorios inyectados. Nada más.
- WHILE la IA rellena THEN escribe únicamente dentro del hueco (radio acotado por
  `SLOT_REGEX`); cualquier edición fuera del hueco invalida el resultado.
- WHEN un hueco queda relleno THEN el gate determinista decide: `build` + `test` de
  la app emitida en verde Y regeneración + reinyección sin pérdida. Si el gate
  falla, el hueco se vacía y se reporta el motivo — nunca queda código rojo.
- IF el ejecutor de IA no está disponible THEN el comando reporta los huecos
  pendientes y termina sin tocar nada (el generador sigue sin IA en el núcleo:
  el ejecutor es Claude Code vía puente, no un SDK embebido).

## Criterios de aceptación

- [x] `nx g @acc/generators:app` con el diseño solaris emite
      `contexts/solaris/processes/de-presupuesto-a-legalizacion/` con la clase
      cableada: 5 métodos (`presupuesto`, `planifica`, `montaje`, `averia`, `cie`),
      repos `InstalacionRepository` y `ParteRepository` inyectados, huecos vacíos.
      · Los repos reales son `InstallationRepository` y `WorklogRepository`: los modelos
      registrados son `installation`/`worklog`, no los nombres españoles de esta prosa.
- [x] La app emitida con procesos compila y su suite pasa (gate de spec 26 intacto).
      · 0 errores de TS y 332/332 tests, medido fuera del monorepo (TASK-09).
- [x] Un diseño sin flujos no emite `processes/` y `/golden-diff` da diff vacío
      sobre las fixtures que no tengan flujos. · `app-mongo`, 596 ficheros sin cambio.
- [x] La fixture de oro con flujos queda re-baselineada y el diff es vacío.
      · Congelada en el diseño `golden`, no en solaris (ver desviación en TASK-08).
- [x] Texto escrito a mano dentro de un hueco `flow-*` sobrevive a la regeneración.
- [x] El comando de relleno rellena al menos un hueco de la demo solaris y el gate
      lo acepta (build + test en verde). · Demostrado sobre la composición `golden`:
      la app solaris no compila por un defecto ajeno (ver TASKS.md).
- [x] Un relleno que rompe la compilación es rechazado: el hueco vuelve a quedar
      vacío y se reporta. · TS2339 + TS2304 reportados, hueco vaciado, nada en disco.

## Referencias del proyecto de referencia

- `libs/generators/src/generators/resource/ai-slots.ts` — harvest/reinyección (mecanismo existente, no se toca).
- `libs/generators/src/generators/app/brief-doc.ts` — `renderFlows` (render BFS a reutilizar).
- `libs/schema/src/lib/validate-flows.ts` y `app-types.ts` — tipos `BusinessFlow`, `FlowNode`.
- `.claude/specs/28-flujos-de-negocio/` — spec previa; su «fuera de alcance» (generar
  código desde el flujo) se reabre aquí con decisión nueva del 2026-08-11.
- `docs/ACELERADOR-arquitectura-consolidada.md` §7 — huecos @ai y gate determinista.

## Reglas de negocio aplicables

- Regla 7 (generar, no interpretar): el flujo NO se ejecuta — ni runner, ni máquina
  de estados. Las decisiones y ciclos son documentación; el cuerpo es de la IA/mano.
- Regla 8 (plantillas tontas): toda la derivación (camelCase, dedup de repos,
  numeración BFS, JSDoc) vive en `generator.ts`; la plantilla
  `__flowFileName__.process.ts.template` solo interpola.
- Dirección de dependencias: `processes/` depende de `modules/`, nunca al revés.
  `architecture-guard` gana esta regla.
- Las firmas de los métodos son estables (el harvest no cubre firmas): si un paso
  necesita más parámetros, se añaden a mano y se documenta la limitación.

## Fuera de scope (deliberado)

- Ejecutar el grafo (runner, máquina de estados, orquestación de aristas): inner-platform.
- Enum de estado en la entidad ancla derivado del flujo: candidato a spec futura.
- Controller/endpoint HTTP para los procesos: no hay consumidor aún (regla de los dos).
- Editar flujos desde el proceso emitido hacia el diseño (ida y vuelta): solo ida.
- Frontend: esta spec es 100 % backend + generador.
- SDK de LLM embebido en el generador: el ejecutor es externo (Claude Code).
