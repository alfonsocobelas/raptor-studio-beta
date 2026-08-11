# Tareas atómicas: Los flujos emiten proceso

> Cada tarea = un commit. Implementar UNA, hacer commit, esperar revisión.
> Orden TDD obligatorio: derivación (helper) → emisión (plantillas) → golden → comando de relleno.
> Toda tarea que toque plantillas o `generator.ts` pasa por `/golden-diff` antes del commit.

## Bloque A — esqueleto determinista

- [x] TASK-01: Exportar de `brief-doc.ts` lo que la derivación reutiliza (`bfsOrder`,
      numeración y render del mapa) sin cambiar su salida — tests actuales en verde
      y golden intacto (refactor puro).
- [x] TASK-02: Tests + helper `flow-process.ts` — derivación de nombres: carpeta/fichero
      kebab del flujo, clase PascalCase + sufijo `Process`, método camelCase por nodo `step`
      (los nodos `start`/`end`/`decision` no derivan método).
- [x] TASK-03: Tests + derivación de firmas y constructor: parámetro `id: <Entity>Id` solo
      si el nodo declara `entity`; repos de las entidades citadas, deduplicados, en orden
      de primera aparición BFS.
- [x] TASK-04: Tests + derivación de JSDoc: cabecera de clase (nombre + descripción + mapa
      numerado BFS reutilizando TASK-01) y JSDoc por método (número de paso, texto, de dónde
      viene —con etiqueta de rama— y a dónde va).
- [x] TASK-05: Tests + plantillas `files-flow-process/` (`__flowFileName__.process.ts.template`
      con huecos `// @ai:begin flow-<nodeId>` vacíos, `processes.module.ts.template`) y emisión
      desde el generador de app: carpeta `processes/` solo si hay flujos.
- [x] TASK-06: Tests + cableado de módulos: `ProcessesModule` con procesos como providers e
      imports de los módulos de las entidades citadas (verificar que exportan su repositorio;
      si no, añadir el export al generador de recurso), registro en el módulo del contexto.
- [x] TASK-07: Test de supervivencia: texto escrito a mano dentro de un hueco `flow-*`
      sobrevive a la regeneración (harvest + reinyección de `ai-slots.ts` sin cambios).
- [x] TASK-08: Fixture de oro con flujos (diseño solaris): re-baseline, diff vacío, y
      comprobación de que las fixtures SIN flujos siguen dando diff vacío (no emiten `processes/`).
      **Desviación 2026-08-11**: los flujos se congelan en el diseño `golden` (la app «todo
      encendido» que ya cubre el gate), no en solaris — una tercera fixture de ~800 ficheros
      no añadía cobertura. `app-mongo` queda como control sin flujos. El criterio de solaris
      (5 métodos, 2 repos) se verifica en TASK-09.
- [x] TASK-09: Gate de app real: la app emitida con procesos compila y su suite pasa
      (gate de spec 26 intacto); criterio de los 5 métodos y 2 repos de solaris verificado.
      **Medición 2026-08-11**: `typecheck-emitted.sh --app=golden …` → **0 errores** de TS
      (backend+shared y frontend) y la suite del emitido **332/332** en 33 suites, con la
      app generada e instalada FUERA del monorepo. El criterio de solaris queda fijado como
      test (`flow-process.spec.ts`), no como comprobación manual.

## Bloque B — relleno IA bajo gate

- [x] TASK-10: Tests + recolección: el comando de relleno lista los huecos `flow-*` vacíos
      de una app emitida con `harvestAiSlots`; sin ejecutor disponible, reporta y termina
      sin tocar nada. **Corrección 2026-08-11**: `harvestAiSlots` recoge los huecos CON
      cuerpo (es lo que salva de la regeneración), así que listar los vacíos pedía su
      inverso: `listEmptyAiSlots(tree, dir, prefix)`, misma `SLOT_REGEX`. El comando es el
      generador `fill-flow-slots`; el informe va en función pura porque Nx invoca como
      callback lo que devuelve un generador.
- [x] TASK-11: Tests + constructor de prompt por hueco: contexto acotado (CLAUDE.md del
      negocio, mapa del flujo, JSDoc del paso, firmas de los repos inyectados) + contrato
      coreográfico (cuerpo autosuficiente, guarda de estado, prohibido llamar a otros pasos,
      prohibido escribir fuera del hueco). Nada más entra en el prompt.
      **Nota 2026-08-11**: el CLAUDE.md entra sin su sección «Procesos de negocio» (el mapa
      llega acotado al flujo del paso por el JSDoc de la clase; con varios flujos, meterlos
      todos ensanchaba justo lo que se pide estrecho). Las firmas de los repos se leen del
      puerto REAL resolviendo el import del proceso, no de una suposición. Bug cazado
      inspeccionando un prompt real, no por los tests: la línea `Firma:` arrastraba desde el
      primer `async` del fichero — los `toContain` pasaban porque la firma buena era su cola.
- [x] TASK-12: Tests + escritura acotada y gate determinista: escritura validada por
      `SLOT_REGEX` (edición fuera del hueco invalida); gate por hueco = build + test de la
      app emitida en verde Y regeneración + reinyección sin pérdida; si falla, el hueco se
      vacía y se reporta el motivo. Partida en dos commits (frontera de escritura /
      orquestación + gate). **Decisión 2026-08-11**: la pata «regeneración + reinyección sin
      pérdida» NO se comprueba en ejecución porque se cumple por construcción — el cuerpo
      entra siempre por `replaceSlotBody` y la frontera ya rechaza lo único que rompería la
      cosecha (un cuerpo con su propio `// @ai:end`). Escribí el verificador, no conseguí
      hacerlo fallar con ninguna entrada realista y lo borré en vez de dejar un sello verde;
      la evidencia de que el relleno sobrevive a una regeneración real es el test de TASK-07.
      El gate real usa los scripts de la propia app emitida (`npm run typecheck`, `npm test`)
      y falla al primero.
- [ ] TASK-13: Prueba real sobre la demo solaris: rellenar al menos un hueco vía ejecutor
      (Claude Code por puente) con el gate aceptando, y comprobar que un relleno que rompe
      la compilación es rechazado (hueco vaciado + motivo reportado).

## Validación

- [ ] TASK-14: `/golden-diff` completo + suite completa del workspace en verde.

---

## Regla del juego

Implementar **UNA** tarea, commit en `develop` (Conventional Commits), esperar aprobación
antes de seguir. Si una tarea parece > 1h de trabajo o > ~150 líneas, **partirla en subtareas**
antes de empezar.
