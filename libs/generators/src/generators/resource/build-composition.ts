import { names } from '@nx/devkit'
import { FieldDefinition, ResourceDefinition } from '@acc/schema'

/**
 * Composition (B3): child entity owned by the aggregate (e.g. customer contacts).
 * The child lives in the parent's domain folder, its types in the parent's types file,
 * and the parent gains add/update/remove + primary-flag semantics. All rendering
 * happens here on purpose — templates only interpolate (rule #8).
 */
export interface CompositionBindings {
  childClass: string
  childFileName: string
  childProp: string
  childrenProp: string
  parentField: string
  primaryFlag?: string
  childImports: string[]
  childCtorParams: string[]
  childGetters: string[]
  childCreateArgs: string
  childFromPrimitivesArgs: string[]
  childToPrimitivesLines: string[]
  childUpdateGuards: string[]
  childPrimaryMethods: string[]
  parentCtorParam: string
  parentGetter: string
  parentCreateParam: string
  parentCreateArg: string
  parentFromPrimitivesParam: string
  parentFromPrimitivesArg: string
  parentMethods: string[]
  parentExtraImports: string[]
  parentExtraTypeNames: string[]
  childAggregatePropsLines: string[]
  childPrimitivePropsLines: string[]
  typeAliasLines: string[]
  typesExtraImports: string[]
  childEntityColumns: { decorator: string; declaration: string }[]
}

interface ChildField {
  name: string
  field: FieldDefinition
  voName: string
}

export function renderComposition(definition: ResourceDefinition, parentClass: string): CompositionBindings | null {
  const comp = definition.composition
  if (!comp) return null

  const parentFile = names(definition.name).fileName
  const cn = names(comp.name)
  const childClass = cn.className
  const parentIdClass = `${parentClass}Id`
  const childIdClass = `${childClass}Id`
  const constraintsConst = definition.constraintsConst ?? `${names(definition.name).constantName}_CONSTRAINTS`

  const fields: ChildField[] = Object.entries(comp.fields)
    .filter(([name]) => name !== 'id' && name !== comp.parentField)
    .map(([name, field]) => ({ name, field, voName: voNameOf(field) }))

  const primary = comp.primaryFlag
  // 'isPrimary' → markAsPrimary/unmarkAsPrimary
  const primaryMethod = primary ? names(primary.replace(/^is/, '')).className : ''
  const primaryVo = primary ? (fields.find(f => f.name === primary)?.voName ?? '') : ''
  const editable = fields.filter(f => f.name !== primary)

  const localVos = fields.filter(f => typeof f.field.vo === 'object').map(f => f.voName)
  const sharedVos = fields.filter(f => f.field.voShared).map(f => f.voName)

  // el hijo importa todos sus VOs ordenados por nombre de clase (canon contact.ts)
  const voImports = [
    ...[...new Set([childIdClass, ...localVos])].map(vo => ({
      vo,
      path: `./value-objects/${names(vo).fileName}.vo`
    })),
    { vo: parentIdClass, path: `../../../../shared/domain/value-objects/${definition.plural}/${parentFile}-id.vo` },
    ...[...new Set(sharedVos)].map(vo => ({
      vo,
      path: `../../../shared/domain/value-objects/${names(vo).fileName}.vo`
    }))
  ].sort((a, b) => a.vo.localeCompare(b.vo))

  const childImports = [
    `import { ${childClass}AggregateProps, ${childClass}PrimitiveProps, ${childClass}UpdateProps } from './${parentFile}-types'`,
    ...voImports.map(({ vo, path }) => `import { ${vo} } from '${path}'`)
  ]

  const parentMethods = [
    [
      `  add${childClass}(props: New${childClass}Props): ${childClass} {`,
      ...(comp.maxConst
        ? [
            `    if (this._${comp.plural}.length >= ${constraintsConst}.${comp.maxConst}) {`,
            `      throw new ${parentClass}Error(\`A ${names(definition.name).fileName} can have at most \${${constraintsConst}.${comp.maxConst}} ${comp.plural}\`)`,
            `    }`,
            ``
          ]
        : []),
      `    const ${cn.propertyName} = ${childClass}.fromPrimitives({ ...props, ${comp.parentField}: this._id.value })`,
      ``,
      ...(primary
        ? [
            `    if (${cn.propertyName}.${primary}) {`,
            `      this.demoteCurrentPrimary(${cn.propertyName}.id)`,
            `    }`
          ]
        : []),
      `    this._${comp.plural}.push(${cn.propertyName})`,
      ``,
      `    return ${cn.propertyName}`,
      `  }`
    ].join('\n'),
    [
      `  update${childClass}(${cn.propertyName}Id: ${childIdClass}, updates: ${parentClass}${childClass}UpdateProps): ${childClass} {`,
      `    const ${cn.propertyName} = this.find${childClass}OrThrow(${cn.propertyName}Id)`,
      ``,
      `    ${cn.propertyName}.updateDetails(updates)`,
      ``,
      ...(primary
        ? [
            `    if (updates.${primary} === true) {`,
            `      this.demoteCurrentPrimary(${cn.propertyName}Id)`,
            `      ${cn.propertyName}.markAs${primaryMethod}()`,
            `    }`,
            `    if (updates.${primary} === false) {`,
            `      ${cn.propertyName}.unmarkAs${primaryMethod}()`,
            `    }`,
            ``
          ]
        : []),
      `    return ${cn.propertyName}`,
      `  }`
    ].join('\n'),
    [
      `  remove${childClass}(${cn.propertyName}Id: ${childIdClass}): ${childClass} {`,
      `    const ${cn.propertyName} = this.find${childClass}OrThrow(${cn.propertyName}Id)`,
      `    this._${comp.plural}.splice(this._${comp.plural}.indexOf(${cn.propertyName}), 1)`,
      ``,
      `    return ${cn.propertyName}`,
      `  }`
    ].join('\n'),
    ...(primary
      ? [
          [
            `  private demoteCurrentPrimary(promotedId: ${childIdClass}): void {`,
            `    const current = this._${comp.plural}.find(${cn.propertyName} => ${cn.propertyName}.${primary} && !${cn.propertyName}.id.equals(promotedId))`,
            `    current?.unmarkAs${primaryMethod}()`,
            `  }`
          ].join('\n')
        ]
      : []),
    [
      `  private find${childClass}OrThrow(${cn.propertyName}Id: ${childIdClass}): ${childClass} {`,
      `    const ${cn.propertyName} = this._${comp.plural}.find(candidate => candidate.id.equals(${cn.propertyName}Id))`,
      ``,
      `    if (!${cn.propertyName}) {`,
      `      throw new EntityNotFoundError('${childClass}', ${cn.propertyName}Id.value)`,
      `    }`,
      ``,
      `    return ${cn.propertyName}`,
      `  }`
    ].join('\n')
  ]

  return {
    childClass,
    childFileName: cn.fileName,
    childProp: cn.propertyName,
    childrenProp: comp.plural,
    parentField: comp.parentField,
    primaryFlag: primary,
    childImports,
    childCtorParams: [
      `private readonly _id: ${childIdClass}`,
      `private readonly _${comp.parentField}: ${parentIdClass}`,
      ...fields.map(f => `private _${f.name}: ${f.voName}`)
    ],
    childGetters: [
      `  get id(): ${childIdClass} {\n    return this._id\n  }`,
      `  get ${comp.parentField}(): ${parentIdClass} {\n    return this._${comp.parentField}\n  }`,
      ...fields.map(f =>
        f.name === primary
          ? `  get ${f.name}(): boolean {\n    return this._${f.name}.value\n  }`
          : `  get ${f.name}(): ${f.voName} {\n    return this._${f.name}\n  }`
      )
    ],
    childCreateArgs: ['props.id', `props.${comp.parentField}`, ...fields.map(f => `props.${f.name}`)].join(', '),
    childFromPrimitivesArgs: [
      `${childIdClass}.create(props.id)`,
      `${parentIdClass}.create(props.${comp.parentField})`,
      ...fields.map(f => `${f.voName}.create(props.${f.name})`)
    ],
    childToPrimitivesLines: [
      'id: this._id.value',
      `${comp.parentField}: this._${comp.parentField}.value`,
      ...fields.map(f => `${f.name}: this._${f.name}.value`)
    ],
    childUpdateGuards: editable.map(
      f =>
        `    if (updates.${f.name} !== undefined) {\n      this._${f.name} = ${f.voName}.create(updates.${f.name})\n    }`
    ),
    childPrimaryMethods: primary
      ? [
          `  markAs${primaryMethod}(): void {\n    this._${primary} = ${primaryVo}.create(true)\n  }`,
          `  unmarkAs${primaryMethod}(): void {\n    this._${primary} = ${primaryVo}.create(false)\n  }`
        ]
      : [],
    parentCtorParam: `private readonly _${comp.plural}: ${childClass}[]`,
    parentGetter: `  get ${comp.plural}(): readonly ${childClass}[] {\n    return this._${comp.plural}\n  }`,
    parentCreateParam: `${comp.plural}: ${childClass}[] = []`,
    parentCreateArg: comp.plural,
    parentFromPrimitivesParam: `${comp.plural}: ${childClass}PrimitiveProps[] = []`,
    parentFromPrimitivesArg: `${comp.plural}.map(${childClass}.fromPrimitives)`,
    parentMethods,
    parentExtraImports: [
      `import { EntityNotFoundError } from '../../../../shared/domain/errors'`,
      `import { ${childClass} } from './${cn.fileName}'`,
      `import { ${childIdClass} } from './value-objects/${names(childIdClass).fileName}.vo'`,
      ...(comp.maxConst
        ? [
            `import { ${constraintsConst} } from './${parentFile}-constants'`,
            `import { ${parentClass}Error } from './${parentFile}-errors'`
          ]
        : [])
    ],
    parentExtraTypeNames: [
      `${childClass}PrimitiveProps`,
      `${parentClass}${childClass}UpdateProps`,
      `New${childClass}Props`
    ],
    childAggregatePropsLines: [
      `id: ${childIdClass}`,
      `${comp.parentField}: ${parentIdClass}`,
      ...fields.map(f => `${f.name}: ${f.voName}`)
    ],
    childPrimitivePropsLines: [
      'id: string',
      `${comp.parentField}: string`,
      ...fields.map(f => `${f.name}: ${f.field.type === 'boolean' ? 'boolean' : 'string'}`)
    ],
    typeAliasLines: [
      `export type ${childClass}UpdateProps = Partial<Omit<${childClass}PrimitiveProps, 'id' | '${comp.parentField}'${primary ? ` | '${primary}'` : ''}>>`,
      `export type New${childClass}Props = Omit<${childClass}PrimitiveProps, '${comp.parentField}'>`,
      `export type ${parentClass}${childClass}UpdateProps = Partial<Omit<${childClass}PrimitiveProps, 'id' | '${comp.parentField}'>>`
    ],
    childEntityColumns: [
      { decorator: "@PrimaryColumn('uuid')", declaration: 'id!: string' },
      { decorator: "@Column('uuid')", declaration: `${comp.parentField}!: string` },
      ...fields.map(f => childEntityColumn(f, constraintsConst)),
      { decorator: "@DeleteDateColumn({ type: 'timestamptz', nullable: true })", declaration: 'deletedAt?: Date' }
    ],
    typesExtraImports: [
      ...[...new Set([childIdClass, ...localVos])].map(
        vo => `import { ${vo} } from './value-objects/${names(vo).fileName}.vo'`
      ),
      ...[...new Set(sharedVos)].map(
        vo => `import { ${vo} } from '../../../shared/domain/value-objects/${names(vo).fileName}.vo'`
      )
    ]
  }
}

function childEntityColumn(f: ChildField, constraintsConst: string): { decorator: string; declaration: string } {
  if (f.field.type === 'boolean') {
    return { decorator: "@Column('boolean', { default: false })", declaration: `${f.name}!: boolean` }
  }
  const vo = typeof f.field.vo === 'object' ? f.field.vo : undefined
  const key = vo?.constraintKey ?? names(f.name).constantName
  const length = `${constraintsConst.endsWith('_CONSTRAINTS') ? 'LIMITS' : 'LIMITS'}.${key}.MAX`
  const withDefault = f.field.required ? '' : ", default: ''"
  return {
    decorator: `@Column('varchar', { length: ${length}${withDefault} })`,
    declaration: `${f.name}!: string`
  }
}

function voNameOf(field: FieldDefinition): string {
  if (typeof field.vo === 'object') return field.vo.name
  if (typeof field.vo === 'string') return field.vo
  if (field.voRef) return field.voRef.name
  if (field.voShared) return field.voShared.name
  return ''
}
