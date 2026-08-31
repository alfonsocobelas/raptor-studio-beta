# Diseño técnico: el emitido testea también lo que tiene guardas

## Forma general

Tres plantillas nuevas, ninguna lógica nueva en el emitido. El generador ya sabe emitir tests
(`files-tests`, `files-tests-application`, `files-tests-integration*`); esto añade las carpetas
que faltaban y las cablea con el idioma que ya usa `resource.ts`:

```
  resource/
    files-transition/                    (ya existe: use case + handler por verbo)
    files-tests-transition/              ← NUEVA: un test por verbo
      __transitionFile__-usecase.test.ts.template
    files-composition-app/               (ya existe: add/update/remove de la hija)
    files-tests-composition/             ← NUEVA
      add-__childFileName__-usecase.test.ts.template
      update-__childFileName__-usecase.test.ts.template
      remove-__childFileName__-usecase.test.ts.template
    files-tests/                         (ya existe: mother, builder, mock, VOs)
      __fileName__.aggregate.test.ts.template   ← NUEVA (podada si no aporta)
```

## Cableado en `resource.ts`

Las transiciones ya se emiten en bucle (línea 78), así que el test viaja en el MISMO bucle con
las mismas substituciones — no hay que recalcular nada:

```ts
for (const transition of substitutions.entry.transitions) {
  generateFiles(tree, …'files-transition', …'backend/application', { …substitutions, transition, transitionFile: transition.file })
  generateFiles(tree, …'files-tests-transition', …'backend-tests-application', { …substitutions, transition, transitionFile: transition.file })
}
```

Los tests solo existen en la rama `else` (la que emite artefactos de test) y bajo
`substitutions.app.emit`, igual que los de use case actuales. La composición sigue el patrón de
poda por bandera; el test del agregado se poda cuando el recurso no tiene nada que afirmar.

## Lo que calcula `generator.ts` (regla 8: plantillas tontas)

`TransitionBinding` gana tres campos derivados, en `build-entrypoints.ts` donde ya se construye:

| Campo         | Qué es                                                        | Para qué en el test                    |
| ------------- | ------------------------------------------------------------- | -------------------------------------- |
| `from`        | `t.from` (estados de origen legales)                          | el caso feliz arranca en `from[0]`     |
| `to`          | `t.to` (estado destino)                                       | afirmar que el agregado se movió       |
| `illegalFrom` | un estado de la máquina que NO está en `t.from`, o `null`      | el caso del error de dominio           |
| `stateField`  | `definition.state.field`                                      | montar la mother en el estado correcto |

`illegalFrom` es `null` cuando la transición admite todos los estados: entonces la plantilla
omite ese `describe` (no se inventa un estado que el dominio aceptaría). El cálculo vive en el
generador; la plantilla solo pregunta `<%_ if (transition.illegalFrom) { _%>`.

## Qué fija cada test emitido

### Test de transición (uno por verbo)

```
describe('<Verbo><Entidad>UseCase')
  given the <entidad> does not exist        → EntityNotFoundError, save no se llama
  given a stale version (spec 78)           → ConcurrencyConflictError, save no se llama
  given a legal source state                → el método del agregado corre, save una vez,
                                              el estado queda en `to`
  given an illegal source state             → error de dominio, save no se llama   [si illegalFrom]
```

### Test de composición (add / update / remove)

```
describe('Add<Hija>UseCase')
  given the parent does not exist           → EntityNotFoundError, save no se llama
  given a valid child                       → la colección del padre crece, save una vez
```
(`update` y `remove` afirman sobre el elemento concreto y el tamaño de la colección.)

### Test del agregado

```
describe('<Entidad>')
  create() → toPrimitives() redondea sin perder campos
  cada transición mueve al estado destino                     [si hay máquina]
  cada transición rechaza desde un estado ilegal              [si hay illegalFrom]
```

## Decisiones técnicas

- **Reusar el repository mock y las Object Mothers ya emitidos** en vez de inventar dobles: son
  los que usan los ocho tests de use case actuales, y así el test nuevo se lee igual que sus
  vecinos.
- **Un fichero por transición**, no un fichero con todas: es lo que ya hace el use case, y
  mantiene la correspondencia 1:1 entre fichero de producción y fichero de test.
- **Podar en vez de condicionar la emisión**: `generateFiles` + `tree.delete` de lo que no
  aplica, que es el idioma de `resource.ts` (líneas 95-110 y 279-290).
- **El estado ilegal se elige, no se inventa**: sale de la propia máquina del modelo.

## Riesgos identificados

- **Re-baseline del oro obligatorio**: aparecen ficheros nuevos en las seis fixtures. Mitigación:
  comprobar que el diff SOLO añade ficheros y no cambia ni una línea de los existentes.
- **Un test emitido rojo es peor que ningún test** (defecto 28: una app entregada con la suite en
  rojo es lo primero que ve el cliente). Mitigación: `typecheck:emitted --suite` como gate de
  cierre, no solo la suite del generador.
- **La composición en Mongoose no está portada** (hueco de la spec 76). Mitigación: el test de
  composición es unitario sobre el mock del repositorio, así que no toca persistencia.
- **Modelos sin `to` explícito o con máquinas raras**: si `illegalFrom` sale `null` el caso se
  omite; el test sigue siendo válido, solo más corto.
