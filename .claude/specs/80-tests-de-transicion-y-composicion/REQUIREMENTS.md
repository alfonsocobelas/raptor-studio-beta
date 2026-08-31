# Spec 80: el emitido testea también lo que tiene guardas

> Origen: petición de Alfonso el 2026-08-31 («puedes arreglar la emisión de test de los vo y
> use cases»), sobre un diagnóstico mío equivocado. La auditoría previa corrigió la premisa y
> acotó el trabajo real; ver la corrección en el ROADMAP (Fase 2, fila 14).

## Contexto de negocio

El generador **ya emite tests de backend**: quince plantillas (ocho de casos de uso, dos de VOs,
mother, builder, repository mock, integración TypeORM y Mongoose), y la fixture de oro `app/`
trae treinta y siete tests. Lo que NO cubre son las dos familias de casos de uso que no nacieron
del CRUD, más el agregado:

- **Transiciones de la máquina de estados** (spec 43): `expire-contract`, `terminate-contract`.
- **Composición** (hija no-agregado): `add-contact`, `update-contact`, `remove-contact`.
- **El agregado** en sí: no hay `contract.test.ts` de dominio.

La ironía es exacta: el CRUD, que apenas tiene reglas, está bien cubierto; **la lógica con
guardas de negocio va sin red**. Una transición emitida decide si un cambio de estado es legal
(estado de origen válido, si no error de dominio → 409) y si la versión del cliente está vieja
(`ConcurrencyConflictError`, spec 78). Eso es lo que un cliente rompe primero y lo único que hoy
nadie verifica al entregar.

## User stories (formato EARS)

- WHEN un modelo declara una máquina de estados THEN cada transición emitida trae SU test, que
  fija las cuatro decisiones del caso de uso: no existe → `EntityNotFoundError`; versión vieja →
  `ConcurrencyConflictError`; estado de origen legal → llama al método del agregado y guarda;
  estado de origen ilegal → error de dominio y NO guarda.
- IF una transición admite TODOS los estados de la máquina como origen THEN su test omite el caso
  del estado ilegal, porque no existe tal estado (no se inventa uno que el dominio aceptaría).
- WHEN un modelo declara una composición THEN los tres casos de uso de la hija (`add`, `update`,
  `remove`) traen test: padre inexistente → `EntityNotFoundError` y no guarda; camino feliz →
  la colección del padre cambia y se guarda una sola vez.
- WHEN se genera cualquier recurso THEN su agregado trae un test que fija el redondeo
  `create() → toPrimitives()` y, si hay máquina de estados, que cada método de transición mueve
  al estado destino y rechaza desde un estado ilegal.
- IF el recurso no tiene transiciones (o no tiene composición) THEN no se emite el fichero de
  test correspondiente — una suite sin tests es un fallo para jest, y el generador ya poda así
  los tests de VOs cuando el modelo no tiene VOs de un grupo.

## Criterios de aceptación

- [ ] `contracts` emite `expire-contract-usecase.test.ts` y `terminate-contract-usecase.test.ts`.
- [ ] `customers` emite los tests de `add/update/remove-contact`.
- [ ] Los cuatro recursos de oro emiten el test de su agregado.
- [ ] Un recurso sin máquina de estados no emite ningún fichero de test de transición.
- [ ] La suite del generador sigue verde y el diff de oro solo crece por los ficheros nuevos
      (re-baseline deliberado, ninguna línea cambiada en lo que ya existía).
- [ ] **La suite emitida pasa de verdad**: `typecheck:emitted --suite`. Un test emitido que no
      compila o va rojo es peor que no emitirlo (defecto 28 del ROADMAP: una app entregada que
      nace con la suite en rojo es lo primero que ve el cliente).

## Referencias del proyecto de referencia

- **No hay canon del que copiar**: `docs/referencia` no tiene ni un test de backend (50 specs de
  frontend, 3 e2e, cero de dominio). El canon es el propio emitido.
- Patrón a seguir: `tools/golden-fixtures/app/libs/backend/tests/modules/contracts/application/
  use-cases/update-contract-usecase.test.ts` — estructura `describe('given …') / it('…')`, con
  el repository mock y las Object Mothers ya emitidas.
- Plantilla que hay que acompañar: `resource/files-transition/use-cases/
  __transitionFile__-usecase.service.ts.template`.

## Reglas de negocio aplicables

- Regla 8: **plantillas tontas**. El estado ilegal para el caso del 409 se calcula en
  `generator.ts` (los estados de la máquina menos los `from` de la transición), no en EJS.
- Regla 1: TDD. Para plantillas, el test es el **diff de oro**, y aquí además la suite emitida.
- «Las demos detectan, no se parchean»: si el test emitido caza un defecto del código emitido,
  se arregla en el generador, nunca en la app generada.

## Fuera de scope (deliberado)

- Tests de handlers, controladores y DTOs (la frontera HTTP ya la cubre el e2e cuando existe).
- Tests e2e nuevos.
- Tests de la persistencia de la hija de composición en Mongoose (hueco declarado de la spec 76,
  y la 79 lo toca antes).
- Subir la cobertura del CRUD ya cubierto: esta spec solo tapa los huecos.
