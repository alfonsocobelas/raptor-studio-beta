import { formatFiles, generateFiles, names, type Tree } from '@nx/devkit'
import * as path from 'path'
import { selectModels } from '../resource/models/registry'
import { FieldDefinition, ResourceDefinition } from '@acc/schema'

export interface SharedDomainGeneratorSchema {
  /** Comma-separated model names to include; defaults to the whole registry */
  models?: string
  directory?: string
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

  exportLines.push(`export * from './auth/auth-enums'`)
  for (const dto of [
    'user',
    'current-user',
    'login',
    'invite-user',
    'accept-invitation',
    'change-role',
    'forgot-password',
    'reset-password'
  ]) {
    exportLines.push(`export * from './auth/${dto}.dto'`)
  }
  exportLines.push(`export * from './export/export-format'`)

  generateFiles(tree, path.join(__dirname, 'files'), outputDir, { exportLines })

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

  const writable = all.filter(c => !c.field.syncManaged && !(c.field.optionalPrimitive && !c.field.updatable))

  const comp = model.composition
  const childCtxs: Ctx[] = comp
    ? Object.entries(comp.fields)
        .filter(([name]) => name !== 'id' && name !== comp.parentField)
        .map(([name, f]) => ({ name, field: f, required: f.required ?? false, nullable: false }))
    : []

  return {
    unions,
    enums,
    dtoLines: ['id: string', ...all.map(c => `${c.name}: ${dtoType(c)}`)],
    registerLines: ['id: string', ...writable.map(c => writableLine(c, false))],
    updateLines: writable.map(c => writableLine(c, true)),
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
