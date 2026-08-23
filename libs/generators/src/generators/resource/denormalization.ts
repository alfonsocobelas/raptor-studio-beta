import { names } from '@nx/devkit'
import { ResourceDefinition } from '@raptor/schema'

/**
 * Campos desnormalizados (spec 60): un FK con form.lookup.denormalizes copia un campo del
 * recurso origen. La copia la hace el USE CASE con un lookup del canon — nunca el DTO ni
 * el navegador — y falla con EntityNotFoundError si el FK no apunta a nada.
 */
export interface DenormBinding {
  /** campo copiado en este recurso ('customerName') */
  targetField: string
  /** FK que declara el lookup ('customerId') */
  fkField: string
  /** variable local del lookup en el use case ('customer'): el FK sin el sufijo Id */
  varName: string
  /** clase del agregado origen ('Customer') */
  originClass: string
  originPlural: string
  originFile: string
  /** campo del origen que se copia ('name') */
  labelField: string
  /** expresión que extrae el valor canónico ('customer.name.value') */
  valueExpr: string
  /** VO de identidad del origen ('CustomerId') y su fichero ('customer-id') */
  idVoClass: string
  idVoFile: string
  repoClass: string
  repoProp: string
}

/** Campos de este recurso que son destino de una denormalización (no viajan en escritura). */
export function denormTargets(definition: ResourceDefinition): Set<string> {
  const targets = new Set<string>()
  for (const field of Object.values(definition.fields)) {
    const denormalizes = field.form?.lookup?.denormalizes
    if (denormalizes) targets.add(denormalizes)
  }
  return targets
}

export function buildDenormalizations(definition: ResourceDefinition, others: ResourceDefinition[]): DenormBinding[] {
  const bindings: DenormBinding[] = []

  for (const [fkField, field] of Object.entries(definition.fields)) {
    const lookup = field.form?.lookup
    if (!lookup?.denormalizes) continue

    const origin = others.find(other => other.name === lookup.resource)
    if (!origin) {
      throw new Error(
        `${definition.name}.fields.${fkField}: lookup resource '${lookup.resource}' is not a registered model`
      )
    }

    const originNames = names(origin.name)
    const varName = fkField.endsWith('Id') ? fkField.slice(0, -2) : `${fkField}Origin`

    bindings.push({
      targetField: lookup.denormalizes,
      fkField,
      varName,
      originClass: originNames.className,
      originPlural: origin.plural,
      originFile: originNames.fileName,
      labelField: lookup.labelField,
      valueExpr: `${varName}.${lookup.labelField}.value`,
      idVoClass: `${originNames.className}Id`,
      idVoFile: `${originNames.fileName}-id`,
      repoClass: `${originNames.className}Repository`,
      repoProp: `${names(origin.name).propertyName}Repository`
    })
  }

  return bindings
}
