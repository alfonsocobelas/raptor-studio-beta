# Diseño técnico: la capa compartida del contexto

> Diseño aprobado en brainstorming 2026-08-04.

---

## 1. Quién declara, quién emite

```
  models/shared-vos.ts            models/*.model.ts               app.ts (ensamblador)
  ─────────────────────           ─────────────────────           ─────────────────────
  SHARED_VOS = {                  voShared: {                     union de los voShared
    CustomerName: {…},     ◄────    name: 'CustomerName'   ────►   de los modelos elegidos
    ContractDate: {…},            }                                        │
    Period: { kind: 'period' }                                             ▼
  }                                                            emite <contexto>/shared/domain/
                                                                 constants.ts        (derivado)
                                                                 period-error.ts     (si Period)
                                                                 value-objects/*.vo.ts
                                                                 + sus tests
```

El registro vive **junto a los modelos** (`libs/generators/src/generators/resource/models/`) porque es
schema del cliente, no maquinaria del acelerador: quien escribe los modelos escribe sus VOs
compartidos. La emisión la hace el **ensamblador de app**, el único que sabe qué modelos entran.

**El guard que nos habría ahorrado 49 errores**: un test del plugin recorre los modelos registrados,
recoge cada `voShared.name` y exige que exista en `SHARED_VOS`. Un `voShared` sin declaración es hoy
un import roto que sólo aparece compilando el emitido; pasa a ser suite roja.

## 2. La forma de la declaración

```ts
export const SHARED_VOS: Record<string, SharedVoDefinition> = {
  CustomerName: {
    kind: 'string',
    fieldName: 'Customer name',
    constraintKey: 'CUSTOMER_NAME',
    min: 2,
    max: 200,
    ensure: 'string',
    normalize: { rule: 'spanish-legal-name', acronyms: ['SAP', 'AG', 'NTT', 'ELIX', 'IBM', 'ERP'] }
  },
  ContractNumber: {
    kind: 'string',
    fieldName: 'Contract number',
    constraintKey: 'CONTRACT_NUMBER',
    min: 5,
    max: 50,
    ensure: 'string',
    noInnerWhitespace: true
  },
  Phone: {
    kind: 'string',
    fieldName: 'Phone',
    constraintKey: 'PHONE',
    max: 30,
    normalize: { rule: 'collapse-whitespace' },
    charset: {
      pattern: '^[0-9+()\\-/.\\s]+$',
      message: 'Phone may only contain digits and the symbols + ( ) - / . and spaces'
    }
  },
  ContractDate: { kind: 'date', fieldName: 'Contract date', unset: true },
  SyncTimestamp: { kind: 'timestamp', fieldName: 'Sync timestamp', namedNull: 'never' },
  Period: { kind: 'period', of: 'ContractDate' }
}
```

Cuatro `kind`, medidos contra el canon — no hay un quinto caso en las 258 líneas:

| kind        | base                | qué añade                                              | canon           |
| ----------- | ------------------- | ------------------------------------------------------ | --------------- |
| `string`    | `StringValueObject` | min/max, `noInnerWhitespace`, `charset`, `normalize`   | 3 de los 6      |
| `date`      | `DateValueObject`   | `unset()`                                              | `ContractDate`  |
| `timestamp` | `DateValueObject`   | `fromISOString()`, `toISOString()`, null con nombre    | `SyncTimestamp` |
| `period`    | clase propia        | invariante inicio ≤ fin + su error de regla de negocio | `Period`        |

`min`/`max` **no se emiten en el VO**: alimentan `constants.ts` y el VO los referencia por
`constraintKey`, igual que el canon.

## 3. constants.ts, derivado

```
  SHARED_VOS  ─┬─ CustomerName   constraintKey CUSTOMER_NAME   min 2  max 200
               ├─ ContractNumber constraintKey CONTRACT_NUMBER min 5  max 50
               └─ Phone          constraintKey PHONE                  max 30
                                    │
                                    ▼
  export const SHARED_CONSTRAINTS = {
    CUSTOMER_NAME: { MIN: 2, MAX: 200 },
    CONTRACT_NUMBER: { MIN: 5, MAX: 50 },
    PHONE: { MAX: 30 }
  } as const
```

Sólo las claves de los VOs realmente emitidos: una app sin `Phone` no arrastra su constante.

## 4. La normalización española: al kernel

El canon mete 71 líneas de algoritmo dentro de `CustomerName`. Eso no se declara en una spec, y
copiarlo verbatim metería el negocio de un cliente en el acelerador. Se parte en dos:

```
  KERNEL (ya emitido)                       CONTEXTO (esta spec)
  shared/domain/value-objects/              <contexto>/shared/domain/value-objects/
    spanish-title-case.ts        ◄──┐         customer-name.vo.ts
    spanish-legal-name.ts  (nuevo) ─┴──────►    normalize() → normalizeSpanishLegalName(
      formas jurídicas S.L./S.A.…                 value, { acronyms: [...] }  ← dato del modelo
      conectores, title-case                    )
```

El helper es genérico (España, no SAP); las tablas que sí son del cliente (acrónimos) viajan como
argumento. **Divergencia asumida**: el fichero emitido no será igual al del canon. El contrato que se
conserva es el comportamiento, y lo demuestra el test emitido — que es el motivo de emitirlo.

## 5. Los tests emitidos son parte del entregable

516 líneas de test en el canon para 258 de producción, y con razón: la normalización española es la
clase de código que se rompe en silencio. Se emiten con las plantillas y el criterio de aceptación es
**que se ejecuten y pasen en la app generada**, como en la spec 25 con los VOs de adjuntos.

## 6. Efecto en el golden

Ficheros nuevos en las fixtures de `app` y `app-mongo` (el gate ya trata «fichero emitido sin
homólogo en fixture» como fallo, así que el orden es: primero la fixture con el contenido esperado
—RED—, luego la plantilla hasta vaciar el diff).

Para los 5 VOs sin normalización española, el contenido esperado es **el del canon tal cual**: el
gate exige reproducirlo. Para `customer-name.vo.ts`, entrada en `golden-skip.txt` con el motivo.

## 7. Testing

- Unit (plugin): el registro cubre todo `voShared` referenciado; `constants.ts` deriva sólo las claves
  usadas; cada `kind` emite la forma del canon; una app sin VOs compartidos no emite la carpeta.
- Golden: 6 gates vacíos con las fixtures ampliadas.
- Emitido: los 6 tests de VO **pasan** en la app generada.
- Gate de compilación: la app de oro a **0 errores**, y `typecheck-emitted.sh` pasa a medirla por
  defecto.
