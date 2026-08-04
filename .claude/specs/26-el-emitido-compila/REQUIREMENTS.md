# Spec: El emitido compila — incoherencias del generador y gate de typecheck

---

## Contexto de negocio

Una app generada con las **cuatro entidades de oro** (`customer,contract,license,project`) no compila:
75 errores de TypeScript, medidos el 2026-08-04 generando la app, moviéndola **fuera** del árbol del
acelerador e instalando sus dependencias. Fuera del árbol a propósito: dentro, el `node_modules` del
monorepo tapa por hoisting todo lo que el emitido no declara.

Los 75 errores son **tres defectos distintos**:

```
  A) 49 · VOs COMPARTIDOS que el generador nunca emite (`voShared` del modelo):
         customer-name · contract-number · contract-date · period · sync-timestamp · phone
         + shared/domain/constants
  B) 19 · desajustes optional/nullable en el agregado emitido
  C)  5 · el generador emite imports de ficheros que él mismo decidió NO emitir
```

Esta spec ataca **B y C**, que son bugs con arreglo contenido, y monta el **gate** que los vigila.
**A es una feature** (decidir de dónde salen esos VOs y cómo se declaran) y va en spec propia.

Por qué esto ha durado tanto sin verse: ningún gate compila el código emitido. El golden compara
ficheros — y de hecho las fixturas llegaron a tener imports roteros congelados — y la suite del
plugin no ejecuta ni compila lo que emite. Ya ha morido dos veces: los cinco defectos de `5232994`
y el renombre del logger de la spec 24 (`ea6031d`), que dejó **todas** las apps sin compilar.

Detalle de C, que es el que peor habla de nosotros:

- `skipEmit: ['mapper']` confunde dos cosas distintas: «no compares este fichero en el golden»
  (lo que quiere el canon, porque el mapper de la referencia lleva extensiones a mano) y «no lo
  emitas» (lo que hace). Resultado: `typeorm-customer.repository.ts` importa `./customer.mapper`,
  que no existe. Igual en `license`.
- `seed.ts` importa el seeder, las fixtures y el register use case de **todos** los modelos, aunque
  un modelo no escriba y por tanto no tenga ninguna de esas piezas emitidas (`license`).

Detalle de B: el generador **sabe** poner el fallback y lo pone en los campos con VO
(`description: props.description ?? ''`) o con default de columna, pero **no** en los campos que
pasa crudos (`waveStage: props.waveStage`), donde `PrimitiveProps` los declara opcionales y
`AggregateProps` los exige `Nullable<…>`.

Decisiones cerradas en brainstorming (2026-08-04):

- **Alcance**: B + C + gate. A (VOs compartidos) → spec 27.
- **`skipEmit` pasa a ser cosa del gate, no de la emisión**: el fichero se emite siempre y el
  golden deja de compararlo para los modelos que lo declaran.
- **El gate no entra en el golden de cada commit** (~2 min por app): target aparte, para cerrar
  specs y para CI.
- **El gate arranca midiendo la app de demo** (`--app=boutique`, que compila limpia) y sólo pasará a
  exigir la de oro cuando la spec 27 cierre la familia A. Con B+C hechas, la de oro baja de 75 a 49
  errores, así que exigirla ahora dejaría el gate rojo por diseño.

## User stories (formato EARS)

- **WHEN** un modelo declara `skipEmit: ['mapper']` **THEN** el mapper **se emite** igualmente y el
  gate de oro no compara ese fichero
- **IF** un modelo no emite seeder (no escribe) **THEN** el `seed.ts` emitido no lo importa
- **IF** un campo sin VO es opcional en los primitives y obligatorio-nullable en el agregado
  **THEN** `fromPrimitives` le aplica el mismo fallback que ya aplica a los demás
- **WHEN** se ejecuta el gate de typecheck **THEN** genera una app FUERA del árbol del acelerador,
  instala sus dependencias y le pasa `tsc`, y falla si hay un solo error
- **WHILE** la familia A siga abierta **THEN** el gate mide la app de demo, no la de oro

## Criterios de aceptación

- [ ] La app de las 4 entidades de oro baja de **75 a 49 errores** (desaparecen B y C completos)
- [ ] Los 49 restantes son **todos** de la familia A (VOs compartidos), verificado por clasificación
- [ ] `nx run generators:typecheck-emitted` genera fuera del árbol, instala y compila; verde con la
      app de demo
- [ ] El gate detecta de verdad un import roto: se comprueba introduciendo uno a propósito
- [ ] Los 6 gates de oro siguen en verde (con el mapper emitido y excluido de la comparación)
- [ ] Suite del plugin verde

## Referencias

- Medición: 75 errores clasificados en `docs/` de esta spec (ver DESIGN §1)
- Los dos precedentes del hueco: `5232994` (5 defectos) y `ea6031d` (logger sin compilar)
- ROADMAP obs. 22 (VOs compartidos) y obs. 23 (el gate que falta)

## Reglas de negocio aplicables

- Plantillas tontas, lógica en `generator.ts` (regla 8)
- Gate de oro antes de commit; el gate de typecheck es aparte por lento
- Una tarea = un commit atómico

## Fuera de scope (deliberado)

- **Familia A**: emitir los VOs compartidos → spec 27
- Meter el typecheck en el golden de cada commit (lo hace inviable de tiempo)
- Arreglar el mapper hecho a mano de la referencia (el canon lleva extras que el generador no cubre;
  de eso trata `skipEmit`)

---

> Aprobado en brainstorming 2026-08-04.
