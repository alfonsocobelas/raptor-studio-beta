import { ResourceDefinition, SharedVoDefinition } from '@acc/schema'

/**
 * Registro de los VOs de la capa COMPARTIDA del contexto (spec 27).
 *
 * Van aquí, junto a los modelos, porque son schema del cliente y no maquinaria del acelerador: quien
 * escribe los modelos escribe sus VOs compartidos. No los emite el generador de recurso porque
 * ningún módulo es su dueño — `CustomerName` la usan customers, contracts, licenses y projects, y el
 * último en generar ganaría. Los emite el ensamblador de app, que es quien sabe qué modelos entran.
 *
 * Cada campo está MEDIDO contra el canon (`docs/referencia/libs/backend/src/contexts/sap-licensing/
 * shared/domain/`), con la línea que lo justifica al lado. Nada inventado: la spec 26 demostró lo que
 * cuesta una regla deducida a ojo.
 */
export const SHARED_VOS: Record<string, SharedVoDefinition> = {
  // customer-name.vo.ts — ensureIsString + normalize + MIN/MAX; las 71 líneas de normalización
  // española se mudan al helper del kernel y sus tablas viajan como dato (spec 27, DESIGN §4)
  CustomerName: {
    kind: 'string',
    fieldName: 'Customer name',
    constraintKey: 'CUSTOMER_NAME',
    min: 2,
    max: 200,
    ensure: 'string',
    normalize: { rule: 'spanish-legal-name', acronyms: ['SAP', 'AG', 'NTT', 'ELIX', 'IBM', 'ERP'] }
  },
  // contract-number.vo.ts — ensureIsString + normalize + ensureHasNoInnerWhitespace + MIN/MAX
  ContractNumber: {
    kind: 'string',
    fieldName: 'Contract number',
    constraintKey: 'CONTRACT_NUMBER',
    min: 5,
    max: 50,
    ensure: 'string',
    noInnerWhitespace: true
  },
  // phone.vo.ts — ensureIsDefined, MAX, juego de caracteres y su propio normalize
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
  // contract-date.vo.ts — DateValueObject + `static unset(): Nullable<ContractDate>`
  ContractDate: { kind: 'date', fieldName: 'Contract date', unset: true },
  // sync-timestamp.vo.ts — DateValueObject + fromISOString/toISOString + `static never()`
  SyncTimestamp: { kind: 'timestamp', fieldName: 'Sync timestamp', namedNull: 'never' },
  // period.vo.ts — clase propia (no extiende ValueObject) + period-error.ts
  Period: { kind: 'period', of: 'ContractDate' }
}

/**
 * Los VOs compartidos que necesita una app concreta: la unión de lo que referencian sus modelos.
 * `Period` no se declara por campo (el modelo lo declara con `period: { start, end }`), así que se
 * deduce de ahí. El orden lo fija el registro, no los modelos: la emisión debe ser determinista.
 */
export function sharedVosOf(models: ResourceDefinition[]): string[] {
  const referenced = new Set<string>()

  for (const model of models) {
    for (const field of Object.values(model.fields)) {
      if (field.voShared) referenced.add(field.voShared.name)
    }
    if (model.period) referenced.add('Period')
  }

  // un VO compuesto arrastra el VO del que se construye: `Period` se hace con
  // `ContractDate`, y emitir uno sin el otro deja una referencia colgando. Colaba
  // mientras los modelos con período declaraban además ese VO en algún campo.
  for (const name of [...referenced]) {
    const dependency = SHARED_VOS[name]?.of
    if (dependency) referenced.add(dependency)
  }

  return Object.keys(SHARED_VOS).filter(name => referenced.has(name))
}
