import { names } from '@nx/devkit'
import { FieldDefinition, ResourceDefinition, wantsSoftDelete } from '@raptor/schema'
import { buildDenormalizations, DenormBinding } from './denormalization'

/**
 * Application layer synthesis (use cases + handlers + input DTOs + uniqueness
 * specifications), canonical shape taken from the projects module (the cleanest
 * of the four references). Module idiosyncrasies (derived readers, sync guards,
 * detail DTO reshaping) stay out of the canon: hand edits over the emitted 80%.
 */
export interface UniqueSpecBinding {
  /** with<Cap> factory alias (withSapId) */
  fn: string
  /** <Class>With<Cap>Specification */
  specClass: string
  voName: string
  /** true → VO import from ../value-objects, false → context-shared */
  voLocal: boolean
  /** el getter del agregado es Nullable: el check de unicidad va con guard */
  nullable: boolean
  /** kebab file of the VO ('sap-id') */
  voFileName: string
  /** <fileName>-with-<field-kebab> (no extension) */
  specFileName: string
  /** field name as filter key ('sapId') */
  field: string
  /** campo opcional → semántica ifPresent: el check de unicidad solo aplica si no está vacío */
  optional: boolean
}

export interface ApplicationBindings {
  emit: boolean
  /** register/update emitted (the model declares a form) */
  writes: boolean
  /** remove emitted (list.features.delete) */
  removes: boolean
  /** papelera emitida (spec 29): borrado lógico Y listado con borrado */
  trash: boolean
  /** historial emitido (spec 31): los use cases de escritura registran eventos */
  history: boolean
  /** import CSV validado (spec 33): exige alta (writes) para delegar en su register */
  importCsv: boolean
  uniqueSpecs: UniqueSpecBinding[]
  registerSpecImports: string[]
  registerCheckBlocks: string[]
  updateCheckBlocks: string[]
  /** search/export use cases need AlreadyExistsError only when checks exist */
  hasUniqueChecks: boolean
  /** hay uniques opcionales → el test del register cubre la rama ifPresent */
  hasOptionalUniques: boolean
  /** overrides del mother con los opcionales vacíos: "{ taxId: '' }" */
  optionalUniqueOverrides: string
  /**
   * Código de negocio (spec 19), null si el modelo no lo declara. Todo resuelto aquí —
   * plural para la secuencia, prefijo y relleno ya con sus defaults— para que la plantilla
   * solo interpole (regla 8).
   */
  code: { entity: string; prefix: string; padding: number } | null
  /** checks que corren siempre (uniques requeridos) */
  requiredUniqueCount: number
  /**
   * Campos desnormalizados (spec 60): el use case copia el canon del recurso origen.
   * Todo pre-renderizado aquí — las plantillas solo iteran líneas (regla 8).
   */
  denorms: DenormBinding[]
  /** parámetros extra del constructor: repos de los orígenes, deduplicados */
  denormRepoParams: string[]
  /** nombres para el import de errores del register (null → sin línea) */
  registerErrorImports: string | null
  registerDenormImports: string[]
  registerDenormBlocks: string[]
  /** props extra del X.register: ', customerName: customer.name.value' */
  registerExtraProps: string
  updateDenormImports: string[]
  updateDenormBlocks: string[]
  /** 'updates' con denorms (hay let previo), 'input.updates' sin ellas */
  updatesExpr: string
  /** claves del Omit del input de alta: "'code' | 'customerName'" (vacío → alias directo) */
  registerOmitKeys: string
  /** import CSV: resolución del canon por fila, con caché por FK */
  importDenormImports: string[]
  importDenormMapLines: string[]
  importResolveLines: string[]
  /** llamada del gate de fila: 'row' o '{ ...row, customerName }' */
  importRegisterCall: string
  /** dobles y casos de los tests emitidos */
  testDenormImports: string[]
  testDenormMockDecls: string[]
  testDenormBeforeEachLines: string[]
  testDenormCtorArgs: string
}

export function renderApplication(
  definition: ResourceDefinition,
  emitAggregate: boolean,
  others: ResourceDefinition[] = []
): ApplicationBindings {
  const n = names(definition.name)
  const className = n.className
  const denorms = buildDenormalizations(definition, others)

  const uniques = Object.entries(definition.fields)
    .filter(([name, field]) => name !== 'id' && field.unique)
    .map(([name, field]) => ({ name, field }))

  const uniqueSpecs: UniqueSpecBinding[] = uniques.map(({ name, field }) => {
    const cap = name.charAt(0).toUpperCase() + name.slice(1)
    return {
      fn: `with${cap}`,
      specClass: `${className}With${cap}Specification`,
      voName: voNameOf(field),
      voLocal: !field.voShared,
      nullable: field.nullable ?? false,
      voFileName: names(voNameOf(field)).fileName,
      specFileName: `${n.fileName}-with-${names(name).fileName}`,
      field: name,
      optional: field.required !== true && !(field.nullable ?? false) && field.type === 'string'
    }
  })

  const registerSpecImports = uniqueSpecs.map(
    s => `import { ${s.fn} } from '../../domain/specifications/${s.specFileName}.specification'`
  )

  const prop = n.propertyName
  // unicidad ifPresent (decisión ratificada 2026-07-30): en campos opcionales el check
  // solo corre si el valor no está vacío — canon hasTaxId() del register de customers.
  const registerCheckBlocks = uniqueSpecs.map(s => {
    const cap = s.field.charAt(0).toUpperCase() + s.field.slice(1)
    const check = [
      `const ${s.field}Exists = await this.${prop}Repository.exists(${s.fn}(${prop}.${s.field}))`,
      ``,
      `if (${s.field}Exists) {`,
      `  throw new AlreadyExistsError('${className}', '${s.field}', ${prop}.${s.field}.value)`,
      `}`
    ]
    // el unique NULLABLE va con guard de nulidad (canon: register-contract-usecase.service.ts:15);
    // el OPCIONAL con su ifPresent (hasTaxId). Son dos semánticas distintas y no se mezclan.
    const wrap = s.optional ? `${prop}.has${cap}()` : s.nullable ? `${prop}.${s.field}` : null
    if (!wrap) {
      return check.map(line => (line ? `    ${line}` : line)).join('\n')
    }
    return [`    if (${wrap}) {`, ...check.map(line => (line ? `      ${line}` : line)), `    }`].join('\n')
  })

  const updateCheckBlocks = uniqueSpecs.map(s => {
    const cap = s.field.charAt(0).toUpperCase() + s.field.slice(1)
    return [
      `    const new${cap} = ${prop}.new${cap}IfChanged(input.updates)`,
      ``,
      `    if (new${cap}) {`,
      `      const ${s.field}Exists = await this.${prop}Repository.exists(${s.fn}(new${cap}))`,
      ``,
      `      if (${s.field}Exists) {`,
      `        throw new AlreadyExistsError('${className}', '${s.field}', new${cap}.value)`,
      `      }`,
      `    }`
    ].join('\n')
  })

  // Denormalización (spec 60): el register copia el canon del origen; el update lo
  // refresca cuando cambia el FK. Repos e imports deduplicados por origen.
  const uniqueOriginRepos = [...new Map(denorms.map(d => [d.repoClass, d])).values()]
  const denormRepoParams = uniqueOriginRepos.map(d => `private readonly ${d.repoProp}: ${d.repoClass}`)
  const denormRepoImports = uniqueOriginRepos.map(
    d => `import { ${d.repoClass} } from '../../../${d.originPlural}/domain/${d.originFile}-repository'`
  )
  const denormIdVoImports = [...new Map(denorms.map(d => [d.idVoClass, d])).values()].map(
    d => `import { ${d.idVoClass} } from '../../../../../shared/domain/value-objects/${d.originPlural}/${d.idVoFile}.vo'`
  )

  const registerDenormBlocks = denorms.map((d, i) =>
    [
      ...(i === 0 ? ['    // El valor desnormalizado se copia del canon, nunca del DTO (spec 60).'] : []),
      `    const ${d.varName} = await this.${d.repoProp}.get(${d.idVoClass}.create(input.${d.fkField}))`,
      ``,
      `    if (!${d.varName}) {`,
      `      throw new EntityNotFoundError('${d.originClass}', input.${d.fkField})`,
      `    }`
    ].join('\n')
  )

  const updateDenormBlocks = denorms.length
    ? [
        `    let updates = input.updates`,
        ...denorms.map(d =>
          [
            `    // La copia desnormalizada se refresca del canon cuando cambia el FK (spec 60).`,
            `    if (updates.${d.fkField} !== undefined) {`,
            `      const ${d.varName} = await this.${d.repoProp}.get(${d.idVoClass}.create(updates.${d.fkField}))`,
            ``,
            `      if (!${d.varName}) {`,
            `        throw new EntityNotFoundError('${d.originClass}', updates.${d.fkField})`,
            `      }`,
            ``,
            `      updates = { ...updates, ${d.targetField}: ${d.valueExpr} }`,
            `    }`
          ].join('\n')
        )
      ]
    : []

  const registerErrorNames = [
    ...(uniqueSpecs.length > 0 ? ['AlreadyExistsError'] : []),
    ...(denorms.length > 0 ? ['EntityNotFoundError'] : [])
  ]

  const omitKeys = [...(definition.code ? ['code'] : []), ...denorms.map(d => d.targetField)]

  // Import CSV (spec 33 + 60): el gate por fila resuelve el canon con caché por FK; los
  // fallos de lookup se acumulan como cualquier error de dominio de la fila.
  const importDenormMapLines = denorms.map(d => {
    const fkPascal = d.fkField.charAt(0).toUpperCase() + d.fkField.slice(1)
    return `    const ${d.targetField}By${fkPascal} = new Map<string, string>()`
  })
  const importResolveLines = denorms.flatMap(d => {
    const fkPascal = d.fkField.charAt(0).toUpperCase() + d.fkField.slice(1)
    const map = `${d.targetField}By${fkPascal}`
    return [
      `        let ${d.targetField} = ${map}.get(row.${d.fkField})`,
      `        if (${d.targetField} === undefined) {`,
      `          const ${d.varName} = await this.${d.repoProp}.get(${d.idVoClass}.create(row.${d.fkField}))`,
      `          if (!${d.varName}) {`,
      `            throw new EntityNotFoundError('${d.originClass}', row.${d.fkField})`,
      `          }`,
      `          ${d.targetField} = ${d.valueExpr}`,
      `          ${map}.set(row.${d.fkField}, ${d.targetField})`,
      `        }`
    ]
  })
  const importRegisterCall = denorms.length ? `{ ...row${denorms.map(d => `, ${d.targetField}`).join('')} }` : 'row'

  // Dobles de los tests emitidos: el canon estubado sale de la mother (valor válido para el VO).
  const testDenormImports = uniqueOriginRepos.map(
    d =>
      `import { ${d.repoClass} } from '../../../../../src/contexts/${definition.context}/modules/${d.originPlural}/domain/${d.originFile}-repository'`
  )
  const testDenormMockDecls = uniqueOriginRepos.map(
    d => `  const ${d.repoProp} = { get: jest.fn() } as unknown as ${d.repoClass}`
  )
  const testDenormBeforeEachLines = denorms.flatMap(d => [
    `    ;(${d.repoProp}.get as jest.Mock).mockReset()`,
    `    ;(${d.repoProp}.get as jest.Mock).mockResolvedValue({ ${d.labelField}: { value: ${className}Mother.primitives().${d.targetField} } })`
  ])
  const testDenormCtorArgs = uniqueOriginRepos.map(d => `, ${d.repoProp}`).join('')

  return {
    emit: emitAggregate,
    writes: (definition.formSections?.length ?? 0) > 0,
    removes: definition.list?.features?.delete === true,
    trash: definition.list?.features?.delete === true && wantsSoftDelete(definition),
    history: definition.history === true,
    importCsv: definition.list?.features?.import === true && (definition.formSections?.length ?? 0) > 0,
    uniqueSpecs,
    registerSpecImports,
    registerCheckBlocks,
    updateCheckBlocks,
    hasUniqueChecks: uniqueSpecs.length > 0,
    hasOptionalUniques: uniqueSpecs.some(s => s.optional),
    optionalUniqueOverrides: `{ ${uniqueSpecs
      .filter(s => s.optional)
      .map(s => `${s.field}: ''`)
      .join(', ')} }`,
    requiredUniqueCount: uniqueSpecs.filter(s => !s.optional).length,
    // Código de negocio (spec 19). Todo calculado aquí: la plantilla solo interpola (regla 8).
    code: definition.code
      ? {
          entity: definition.plural,
          prefix: definition.code.prefix ?? definition.name.slice(0, 3).toUpperCase(),
          padding: definition.code.padding ?? 4
        }
      : null,
    denorms,
    denormRepoParams,
    registerErrorImports: registerErrorNames.length ? registerErrorNames.join(', ') : null,
    registerDenormImports: [...denormRepoImports, ...denormIdVoImports],
    registerDenormBlocks,
    registerExtraProps: denorms.map(d => `, ${d.targetField}: ${d.valueExpr}`).join(''),
    updateDenormImports: [...denormRepoImports, ...denormIdVoImports],
    updateDenormBlocks,
    updatesExpr: denorms.length ? 'updates' : 'input.updates',
    registerOmitKeys: omitKeys.map(k => `'${k}'`).join(' | '),
    importDenormImports: [...denormRepoImports, ...denormIdVoImports],
    importDenormMapLines,
    importResolveLines,
    importRegisterCall,
    testDenormImports,
    testDenormMockDecls,
    testDenormBeforeEachLines,
    testDenormCtorArgs
  }
}

function voNameOf(field: FieldDefinition): string {
  if (typeof field.vo === 'object') return field.vo.name
  if (typeof field.vo === 'string') return field.vo
  if (field.voRef) return field.voRef.name
  if (field.voShared) return field.voShared.name
  return ''
}
