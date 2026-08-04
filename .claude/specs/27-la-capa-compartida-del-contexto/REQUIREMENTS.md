# Spec: La capa compartida del contexto — los VOs que ningún módulo posee

---

## Contexto de negocio

Cerrada la spec 26, la app de las **cuatro entidades de oro** baja de 75 a **49 errores**, y los 49
son el mismo agujero: el emitido importa una capa que nadie emite. Los modelos declaran
`voShared: { name: 'CustomerName' }` — «este VO no es mío, vive en la capa compartida del contexto» —
y el generador se lo cree: usa el tipo, lo importa… y nunca lo escribe.

```
  libs/backend/src/contexts/<contexto>/
    modules/customers/domain/customer.ts   ← lo EMITE el generador de recurso
    modules/contracts/domain/contract.ts   ← lo EMITE el generador de recurso
    shared/domain/                         ← NADIE lo emite  ◄── esta spec
      constants.ts
      period-error.ts
      value-objects/{customer-name,contract-number,contract-date,period,sync-timestamp,phone}.vo.ts
```

Medición del 2026-08-04 (`bash tools/typecheck-emitted.sh --models=customer,contract,license,project`):

| módulo que falta   | sitios que lo importan | canon | test del canon |
| ------------------ | ---------------------: | ----: | -------------: |
| `customer-name.vo` |                     12 |   111 |            216 |
| `contract-number`  |                     11 |    31 |             89 |
| `contract-date`    |                      9 |    19 |             33 |
| `period.vo`        |                      6 |    25 |             44 |
| `sync-timestamp`   |                      4 |    28 |             34 |
| `phone.vo`         |                      4 |    32 |            100 |
| `constants`        |                      3 |     5 |              — |
| `period-error`     |          (sólo Period) |     7 |              — |

Total: **8 ficheros, 258 líneas de producción y 516 de test** en el canon.

Dos hallazgos que acortan el trabajo:

- el kernel **ya emite** todo lo que estas piezas necesitan por debajo: `StringValueObject`,
  `DateValueObject`, `spanish-title-case`, `errors`, `types`. Falta sólo la capa de contexto.
- `period-error.ts` no aparece en el recuento de errores porque sólo lo importa `Period`.

## Por qué esto no lo resuelve el generador de recurso

Porque **ningún módulo es dueño** de estas piezas: `CustomerName` lo usan customers, contracts,
licenses y projects; `ContractDate` lo usan contracts y projects. Si lo emitiera el generador de
recurso, cuatro módulos escribirían el mismo fichero y el último ganaría. Es una decisión del
**ensamblador de app**, que es quien sabe qué modelos entran.

## Decisión de diseño (brainstorming 2026-08-04)

**Híbrido: declaradas en el modelo, con un helper de catálogo para lo que no es expresable.**

- Las piezas se declaran como **datos** (un registro de VOs compartidos junto a los modelos), con la
  misma forma de spec que ya usan los VOs de módulo. Nada de nombres de sap-licenses cableados
  dentro del acelerador: otro cliente declara `SupplierName` y funciona.
- `constants.ts` **deja de escribirse**: se deriva de las declaraciones (la unión de sus
  `constraintKey` con su MIN/MAX).
- La única pieza no expresable es la normalización española de razones sociales de `CustomerName`
  (71 de sus 111 líneas: formas jurídicas `S.L.`/`S.A.`, conectores, acrónimos, title-case). Va a un
  **helper del kernel** (donde ya vive `spanish-title-case`), activado por
  `normalize: { rule: 'spanish-legal-name', acronyms: [...] }`, con las tablas propias del cliente
  como dato del modelo.

Consecuencia asumida: `customer-name.vo.ts` **no** saldrá byte a byte igual que el canon — el
algoritmo se muda al helper y el VO queda fino. Lo que se conserva es el **comportamiento**, y quien
lo demuestra es el test emitido (216 líneas del canon, ejecutables). Se declara en `golden-skip.txt`
con el motivo escrito.

## User stories (formato EARS)

- **WHEN** un modelo declara `voShared: { name: 'X' }` **THEN** el ensamblador emite la clase `X` en
  la capa compartida del contexto, y sólo si algún modelo seleccionado la referencia
- **IF** un modelo referencia un `voShared` que no está declarado en el registro **THEN** falla la
  suite del plugin con el nombre que falta (no un import roto en el emitido dos horas después)
- **WHEN** se declara un VO compartido con `constraintKey` + MIN/MAX **THEN** `constants.ts` se
  emite derivado, sin escribirlo a mano
- **WHEN** un VO compartido declara `normalize: 'spanish-legal-name'` **THEN** el emitido normaliza
  formas jurídicas, conectores y acrónimos, y el test emitido lo ejercita
- **IF** el contexto usa `Period` **THEN** se emiten también `period-error.ts` y su test
- **WHILE** la app no referencie ningún VO compartido **THEN** no se emite la carpeta

## Criterios de aceptación

- [ ] La app de las 4 entidades de oro compila con **0 errores** fuera del árbol del acelerador
- [ ] `tools/typecheck-emitted.sh` pasa a medir **la app de oro** por defecto (era la de demo por
      estar la familia A abierta: criterio de cierre heredado de la spec 26)
- [ ] Los tests emitidos de los 6 VOs compartidos **se ejecutan y pasan** en la app generada
      (no basta con que compilen: la normalización española sólo se demuestra ejercitándola)
- [ ] Referenciar un `voShared` no declarado pone la suite del plugin en rojo
- [ ] Los 6 gates de oro en verde, con las fixtures de app y app-mongo ampliadas con las piezas nuevas
- [ ] `customer-name.vo.ts` declarado en `golden-skip.txt` con el motivo (algoritmo movido al kernel)

## Referencias

- Canon: `docs/referencia/libs/backend/src/contexts/sap-licensing/shared/domain/`
- Tests del canon: `docs/referencia/libs/backend/tests/modules/sap-licensing/shared/domain/value-objects/`
- Medición y clasificación: spec 26, TASK-05
- ROADMAP obs. 22 (VOs compartidos)

## Reglas de negocio aplicables

- **Generar, no interpretar** (regla 7): el registro cubre el caso canónico; lo exótico se edita a
  mano sobre lo generado
- Plantillas tontas, lógica en `generator.ts` (regla 8)
- Gate de oro antes de commit; una tarea = un commit atómico

## Fuera de scope (deliberado)

- Extraer a la capa compartida VOs que hoy son de módulo (nadie lo ha pedido; el modelo lo decide)
- Un catálogo de normalizaciones más allá de la española (regla de los dos: se abstrae en la 2ª)
- Tocar el mapper hecho a mano de la referencia

---

> Aprobado en brainstorming 2026-08-04.
