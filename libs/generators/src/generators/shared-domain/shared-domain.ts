import { formatFiles, generateFiles, names, type Tree } from '@nx/devkit'
import * as path from 'path'
import { selectModels } from '../resource/models/registry'
import { denormTargets } from '../resource/denormalization'
import { FieldDefinition, ResourceDefinition, RoleDefinition } from '@raptor/schema'
import { roleEnumMembersBlock } from '../app/plugins/role-emission'

export interface SharedDomainGeneratorSchema {
  /** Comma-separated model names to include; defaults to the whole registry */
  models?: string
  directory?: string
  /** Roles personalizados del app-schema (spec 76); amplían UserRoleEnum */
  roles?: RoleDefinition[]
}


interface DtoLine {
  line: string
}

/**
 * Shared DTO lib (frontend ⇄ backend contract): per-resource DTOs derived from
 * the model (list/detail/register/update + composition children) plus the
 * transversal statics (auth enums+dtos, export format). The barrel re-exports
 * everything under the sharedDomainAlias the emitted code imports.
 */
export async function sharedDomainGenerator(tree: Tree, options: SharedDomainGeneratorSchema) {
  const MODEL_LIST = selectModels(options.models)
  const outputDir = options.directory ?? path.join('tmp', 'generated', 'shared-domain')
  const exportLines: string[] = []

  for (const model of MODEL_LIST) {
    const n = names(model.name)
    const bindings = renderDtoBindings(model)

    generateFiles(tree, path.join(__dirname, 'files-resource'), path.join(outputDir, n.fileName), {
      ...bindings,
      className: n.className,
      fileName: n.fileName,
      // el frontend importa el nombre que declara el modelo (canon LicenseWithConsumptionDto)
      dtoInterfaceName: model.dtoName ?? `${n.className}Dto`
    })
    if (!model.composition) {
      tree.delete(path.join(outputDir, n.fileName, `${n.fileName}-detail.dto.ts`))
      tree.delete(path.join(outputDir, n.fileName, 'child.dto.ts'))
    }
    if (!bindings.enums.length) {
      tree.delete(path.join(outputDir, n.fileName, `${n.fileName}-enums.ts`))
    } else {
      exportLines.push(`export * from './${n.fileName}/${n.fileName}-enums'`)
    }
    if (!model.formSections?.length) {
      tree.delete(path.join(outputDir, n.fileName, `register-${n.fileName}.dto.ts`))
      tree.delete(path.join(outputDir, n.fileName, `update-${n.fileName}.dto.ts`))
    }

    exportLines.push(`export * from './${n.fileName}/${n.fileName}.dto'`)
    if (model.formSections?.length) {
      exportLines.push(`export * from './${n.fileName}/register-${n.fileName}.dto'`)
      exportLines.push(`export * from './${n.fileName}/update-${n.fileName}.dto'`)
    }
    if (model.composition) {
      exportLines.push(`export * from './${n.fileName}/${n.fileName}-detail.dto'`)
      exportLines.push(`export * from './${n.fileName}/child.dto'`)
    }
  }

  // el historial (spec 31) es transversal: un DTO, venga de los modelos que venga
  if (MODEL_LIST.some(model => model.history)) {
    generateFiles(tree, path.join(__dirname, 'files-audit'), outputDir, {})
    exportLines.push(`export * from './audit/audit-event.dto'`)
  }

  exportLines.push(`export * from './auth/auth-enums'`)
  for (const dto of [
    'user',
    'current-user',
    'login',
    'invite-user',
    'accept-invitation',
    'change-role',
    'forgot-password',
    'reset-password',
    'change-password'
  ]) {
    exportLines.push(`export * from './auth/${dto}.dto'`)
  }
  exportLines.push(`export * from './export/export-format'`)

  generateFiles(tree, path.join(__dirname, 'files'), outputDir, {
    exportLines,
    roleEnumMembers: roleEnumMembersBlock(options.roles ?? [])
  })

  await formatFiles(tree)
}

interface Ctx {
  name: string
  field: FieldDefinition
  required: boolean
  nullable: boolean
}

function renderDtoBindings(model: ResourceDefinition) {
  const n = names(model.name)
  const all: Ctx[] = Object.entries(model.fields)
    .filter(([name]) => name !== 'id')
    .map(([name, f]) => ({ name, field: f, required: f.required ?? false, nullable: f.nullable ?? false }))

  // tipos nombrados solo cuando el formulario declara optionsType. El canon tiene DOS formas:
  // '<X>Enum' es un enum REAL en <entity>-enums.ts (el dialog usa sus miembros como valores;
  // un type union revienta al servir — TS2693) y sin sufijo queda el union inline
  // (canon CustomerClassification). El sufijo del nombre decide.
  const optionTypes = all
    .filter(c => typeof c.field.vo === 'object' && c.field.vo.values?.length && c.field.form?.optionsType)
    .map(c => ({
      name: c.field.form?.optionsType ?? '',
      values: typeof c.field.vo === 'object' ? (c.field.vo.values ?? []) : []
    }))

  const unions = optionTypes
    .filter(t => !t.name.endsWith('Enum'))
    .map(t => ({ name: t.name, values: t.values.map(v => `'${v}'`).join(' | ') }))

  const enums = optionTypes.filter(t => t.name.endsWith('Enum')).map(t => ({
    name: t.name,
    members: t.values.map(value => ({ key: value.toUpperCase().replace(/[^A-Z0-9]/g, '_'), value }))
  }))

  // spec 43: el campo de la máquina de estados no se pide al alta (la entidad nace en
  // `initial`) ni se edita (solo cambia por transición), igual que ya hace el DTO de
  // entrypoints del backend. Dejarlo aquí deja el formulario emitido sin compilar.
  const stateField = model.state?.field
  // spec 60: los destinos de denormalización tampoco viajan en escritura — los copia el
  // use case desde el canon; siguen en el DTO de lectura (dtoLines) para listar y filtrar.
  const denormalized = denormTargets(model)
  const writable = all.filter(
    c =>
      c.name !== stateField &&
      !c.field.syncManaged &&
      !(c.field.optionalPrimitive && !c.field.updatable) &&
      !denormalized.has(c.name)
  )

  const comp = model.composition
  const childCtxs: Ctx[] = comp
    ? Object.entries(comp.fields)
        .filter(([name]) => name !== 'id' && name !== comp.parentField)
        .map(([name, f]) => ({ name, field: f, required: f.required ?? false, nullable: false }))
    : []

  // `serverAssigned` (spec 19): opcional al ALTA — el backend lo pone si no viene, pero una
  // importación puede traerlo (§2.bis) — y fuera del UPDATE, donde no se toca nunca.
  const registerLines = ['id: string', ...writable.map(c => writableLine(c, c.field.serverAssigned === true))]
  const updateLines = [
    ...writable.filter(c => !c.field.serverAssigned).map(c => writableLine(c, true)),
    // spec 78: la edición reenvía la versión leída; el use case choca con 409 si ya no es la actual
    'version: number'
  ]

  return {
    unions,
    enums,
    dtoLines: ['id: string', ...all.map(c => `${c.name}: ${dtoType(c)}`), 'version: number'],
    registerLines,
    updateLines,
    registerUnions: namedTypesUsedIn(registerLines, unions),
    registerEnums: namedTypesUsedIn(registerLines, enums),
    updateUnions: namedTypesUsedIn(updateLines, unions),
    updateEnums: namedTypesUsedIn(updateLines, enums),
    comp: comp
      ? {
          childClass: names(comp.name).className,
          childrenProp: comp.plural,
          parentField: comp.parentField,
          childDtoLines: ['id: string', `${comp.parentField}: string`, ...childCtxs.map(c => `${c.name}: ${dtoType(c)}`)],
          addChildLines: ['id: string', ...childCtxs.map(c => writableLine(c, false))],
          updateChildLines: childCtxs.map(c => writableLine(c, true))
        }
      : null
  }
}

/**
 * Los tipos nombrados que USAN estas líneas. Register y update ya no llevan todos los
 * campos (el estado sale, spec 43), y un import de un tipo que nadie usa es código
 * muerto en la app emitida.
 */
function namedTypesUsedIn<T extends { name: string }>(lines: string[], types: T[]): T[] {
  return types.filter(type => lines.some(line => line.endsWith(`: ${type.name}`) || line.endsWith(`: ${type.name} | null`)))
}

function dtoType(c: Ctx): string {
  const vo = typeof c.field.vo === 'object' ? c.field.vo : undefined
  if (vo?.values?.length && c.field.form?.optionsType) return c.field.form.optionsType
  if (c.field.type === 'boolean') return 'boolean'
  if (c.field.type === 'number' || c.field.type === 'integer') return c.nullable ? 'number | null' : 'number'
  if (c.field.column?.array) return 'string[]'
  if (c.nullable) return 'string | null'
  return 'string'
}

function writableLine(c: Ctx, forceOptional: boolean): string {
  const optional = forceOptional || !c.required
  const base = dtoType(c)
  const type = optional && c.nullable && !c.required && !base.endsWith('| null') ? `${base} | null` : base
  return `${c.name}${optional ? '?' : ''}: ${type}`
}

export default sharedDomainGenerator
