import { names } from '@nx/devkit'
import { FieldDefinition, ResourceDefinition } from '@acc/schema'

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
  /** kebab file of the VO ('sap-id') */
  voFileName: string
  /** <fileName>-with-<field-kebab> (no extension) */
  specFileName: string
  /** field name as filter key ('sapId') */
  field: string
}

export interface ApplicationBindings {
  emit: boolean
  /** register/update emitted (the model declares a form) */
  writes: boolean
  /** remove emitted (list.features.delete) */
  removes: boolean
  uniqueSpecs: UniqueSpecBinding[]
  registerSpecImports: string[]
  registerCheckBlocks: string[]
  updateCheckBlocks: string[]
  /** search/export use cases need AlreadyExistsError only when checks exist */
  hasUniqueChecks: boolean
}

export function renderApplication(definition: ResourceDefinition, emitAggregate: boolean): ApplicationBindings {
  const n = names(definition.name)
  const className = n.className

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
      voFileName: names(voNameOf(field)).fileName,
      specFileName: `${n.fileName}-with-${names(name).fileName}`,
      field: name
    }
  })

  const registerSpecImports = uniqueSpecs.map(
    s => `import { ${s.fn} } from '../../domain/specifications/${s.specFileName}.specification'`
  )

  const prop = n.propertyName
  const registerCheckBlocks = uniqueSpecs.map(s =>
    [
      `    const ${s.field}Exists = await this.${prop}Repository.exists(${s.fn}(${prop}.${s.field}))`,
      ``,
      `    if (${s.field}Exists) {`,
      `      throw new AlreadyExistsError('${className}', '${s.field}', ${prop}.${s.field}.value)`,
      `    }`
    ].join('\n')
  )

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

  return {
    emit: emitAggregate,
    writes: (definition.formSections?.length ?? 0) > 0,
    removes: definition.list?.features?.delete === true,
    uniqueSpecs,
    registerSpecImports,
    registerCheckBlocks,
    updateCheckBlocks,
    hasUniqueChecks: uniqueSpecs.length > 0
  }
}

function voNameOf(field: FieldDefinition): string {
  if (typeof field.vo === 'object') return field.vo.name
  if (typeof field.vo === 'string') return field.vo
  if (field.voRef) return field.voRef.name
  if (field.voShared) return field.voShared.name
  return ''
}
