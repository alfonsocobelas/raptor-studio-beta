import { BRIEF_LIMITS } from './app-types'
import { FieldDefinition, RESERVED_TRANSITION_NAMES, ResourceDefinition, STATE_LIMITS } from './resource-types'
import { SchemaValidationError } from './validation-errors'

const KEBAB_CASE = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/
const SNAKE_CASE = /^[a-z][a-z0-9]*(_[a-z0-9]+)*$/

/** Roles de app además de user/viewer (spec 76); los aporta quien conoce la app entera. */
export interface DefineResourceOptions {
  extraRoles?: string[]
}

// Structural validation only (v1): rules grow with the templates, never ahead of them.
export function defineResource(
  definition: ResourceDefinition,
  options: DefineResourceOptions = {}
): ResourceDefinition {
  const problems = [
    ...validateIdentity(definition),
    ...validateFields(definition),
    ...validateDetail(definition),
    ...validateGallery(definition),
    ...validateGantt(definition),
    ...validateCalendar(definition),
    ...validateKanban(definition),
    ...validateCode(definition),
    ...validateBrief(definition.brief),
    ...validateState(definition),
    ...validateAccess(definition, options.extraRoles ?? [])
  ]

  if (problems.length) throw new SchemaValidationError(definition.name, problems)

  return Object.freeze(definition)
}

function validateIdentity(definition: ResourceDefinition): string[] {
  const problems: string[] = []

  if (definition.schemaVersion !== 1) problems.push('schemaVersion: must be 1')

  for (const key of ['name', 'plural', 'context'] as const) {
    if (!KEBAB_CASE.test(definition[key])) problems.push(`${key}: must be non-empty kebab-case`)
  }
  if (!SNAKE_CASE.test(definition.schemaName)) problems.push('schemaName: must be non-empty snake_case')

  return problems
}

function validateFields(definition: ResourceDefinition): string[] {
  const problems: string[] = []

  const pkCount = Object.values(definition.fields).filter(f => f.pk).length
  if (pkCount !== 1) problems.push(`fields: exactly one field must declare pk (found ${pkCount})`)

  for (const [name, field] of Object.entries(definition.fields)) {
    problems.push(...validateField(name, field))
    problems.push(...validateLookup(name, field, definition.fields))
  }

  return problems
}

/**
 * La ficha se alcanza SOLO desde la acción de ver del listado, así que declararla
 * con esa acción apagada emitiría una pantalla inalcanzable (spec 16).
 */
function validateDetail(definition: ResourceDefinition): string[] {
  const { detail } = definition
  if (!detail) {
    // los adjuntos cuelgan de un registro y solo se ven en su ficha (spec 16)
    return definition.attachments
      ? ['attachments: requires detail (files belong to a record, shown in its detail)']
      : []
  }

  const problems: string[] = []

  if (definition.list?.features?.view === false) {
    problems.push("detail: requires list.features.view (the detail is only reachable from the list's view action)")
  }
  for (const name of [...(detail.title ? [detail.title] : []), ...(detail.fields ?? [])]) {
    if (!definition.fields[name]) problems.push(`detail: unknown field '${name}'`)
  }

  return problems
}

/** La galería también se deriva de los campos: si se fija uno, debe existir (spec 17). */
function validateGallery(definition: ResourceDefinition): string[] {
  const { gallery } = definition
  if (!gallery) return []

  return [gallery.title, gallery.subtitle, gallery.metric]
    .filter((name): name is string => name !== undefined)
    .filter(name => !definition.fields[name])
    .map(name => `gallery: unknown field '${name}'`)
}

/** El cronograma dibuja barras entre las fechas del period: sin period no hay barras (spec 30). */
function validateGantt(definition: ResourceDefinition): string[] {
  const { gantt } = definition
  if (!gantt) return []

  const problems: string[] = []
  if (!definition.period) {
    problems.push('gantt: requires period (start/end dates to draw the bars)')
  }
  if (gantt.title !== undefined && !definition.fields[gantt.title]) {
    problems.push(`gantt: unknown field '${gantt.title}'`)
  }
  return problems
}

/** El calendario coloca cada registro en su día: sin campo fecha no hay día (spec 59). */
function validateCalendar(definition: ResourceDefinition): string[] {
  const { calendar } = definition
  if (!calendar) return []

  const problems: string[] = []

  const dateField = definition.fields[calendar.date]
  if (!dateField) {
    problems.push(`calendar: unknown field '${calendar.date}'`)
  } else if (dateField.type !== 'date' && dateField.type !== 'timestamptz') {
    problems.push(`calendar: field '${calendar.date}' must be date or timestamptz (got '${dateField.type}')`)
  }

  if (calendar.label !== undefined && !definition.fields[calendar.label]) {
    problems.push(`calendar: unknown field '${calendar.label}'`)
  }

  if (calendar.color !== undefined) {
    const colorField = definition.fields[calendar.color]
    if (!colorField) {
      problems.push(`calendar: unknown field '${calendar.color}'`)
    } else if (typeof colorField.vo !== 'object' || !colorField.vo.values?.length) {
      problems.push(`calendar: field '${calendar.color}' must declare enum values (vo.values) to color the strips`)
    }
  }

  return problems
}

/** El kanban dibuja una columna por valor del enum: sin valores no hay columnas (spec 61). */
function validateKanban(definition: ResourceDefinition): string[] {
  const { kanban } = definition
  if (!kanban) return []

  const problems: string[] = []

  const columnsField = definition.fields[kanban.field]
  if (!columnsField) {
    problems.push(`kanban: unknown field '${kanban.field}'`)
  } else if (typeof columnsField.vo !== 'object' || !columnsField.vo.values?.length) {
    problems.push(`kanban: field '${kanban.field}' must declare enum values (vo.values) to draw the columns`)
  }

  if (kanban.label !== undefined && !definition.fields[kanban.label]) {
    problems.push(`kanban: unknown field '${kanban.label}'`)
  }

  return problems
}

const CODE_PREFIX = /^[A-Z][A-Z0-9]{1,5}$/

/** El código es corto y legible: un prefijo largo o un relleno absurdo no lo son (spec 19). */
function validateCode(definition: ResourceDefinition): string[] {
  const { code } = definition
  if (!code) return []

  const problems: string[] = []

  if (code.prefix !== undefined && !CODE_PREFIX.test(code.prefix)) {
    problems.push(`code.prefix: must be 2-6 uppercase characters (got '${code.prefix}')`)
  }
  if (code.padding !== undefined && (code.padding < 2 || code.padding > 10)) {
    problems.push(`code.padding: must be between 2 and 10 (got ${code.padding})`)
  }
  if (definition.fields['code']) {
    problems.push("code: the resource already declares a 'code' field")
  }

  return problems
}

/**
 * La máquina de estados (spec 43): toda flecha habla de valores REALES del enum ancla, los
 * nombres emiten rutas (kebab, sin pisar las del CRUD) y el no-op de re-aplicar no se
 * declara (to dentro de su from sería ruido). La alcanzabilidad NO se exige aquí: un
 * diseño a medias es legal y solo la frontera lo avisa como warning.
 */
function validateState(definition: ResourceDefinition): string[] {
  const { state } = definition
  if (!state) return []

  const problems: string[] = []
  const field = definition.fields[state.field]
  const values = field && typeof field.vo === 'object' ? (field.vo.values ?? []) : []

  if (!field) {
    problems.push(`state.field: field '${state.field}' does not exist`)
  } else if (!values.length) {
    problems.push(`state.field: field '${state.field}' is not an enum (vo.values)`)
  }

  if (values.length && !values.includes(state.initial)) {
    problems.push(`state.initial: '${state.initial}' is not a value of '${state.field}'`)
  }

  if (state.transitions.length > STATE_LIMITS.transitions) {
    problems.push(
      `state.transitions: at most ${STATE_LIMITS.transitions} transitions are allowed (found ${state.transitions.length})`
    )
  }

  const seen = new Set<string>()
  state.transitions.forEach((transition, index) => {
    const at = `state.transitions[${index}]`

    if (!KEBAB_CASE.test(transition.name) || transition.name.length > STATE_LIMITS.name) {
      problems.push(`${at}: name must be non-empty kebab-case`)
    } else if ((RESERVED_TRANSITION_NAMES as readonly string[]).includes(transition.name)) {
      problems.push(`${at}: name '${transition.name}' collides with an emitted route`)
    }
    if (seen.has(transition.name)) {
      problems.push(`state.transitions: duplicated name '${transition.name}'`)
    }
    seen.add(transition.name)

    if (!transition.label.length || transition.label.length > STATE_LIMITS.label) {
      problems.push(`${at}: label must be 1-${STATE_LIMITS.label} characters`)
    }

    if (!transition.from.length) {
      problems.push(`${at}: from must have at least one value`)
    }
    if (values.length) {
      for (const origin of transition.from) {
        if (!values.includes(origin)) problems.push(`${at}: from '${origin}' is not a value of '${state.field}'`)
      }
      if (!values.includes(transition.to)) {
        problems.push(`${at}: to '${transition.to}' is not a value of '${state.field}'`)
      }
    }
    if (transition.from.includes(transition.to)) {
      problems.push(`${at}: to '${transition.to}' cannot be inside its own from (re-applying is already a no-op)`)
    }
  })

  return problems
}

const GRANTABLE_ROLES = ['user', 'viewer'] as const

/** «'user' or 'viewer'» / «'user', 'viewer' or 'perito'»: lista legible para el mensaje de error. */
function readableRoleList(roles: string[]): string {
  const quoted = roles.map(role => `'${role}'`)
  return quoted.length > 1 ? `${quoted.slice(0, -1).join(', ')} or ${quoted.at(-1)}` : (quoted[0] ?? '')
}

/**
 * La matriz de accesos (spec 46): admin es implícito y no se declara; la matriz reparte
 * entre user, viewer y los roles de la app (spec 76). Un array vacío es LEGAL («solo
 * admin» es una decisión). Las claves de transitions hablan de verbos REALES de la
 * máquina — ambos viven en el recurso, así que se valida aquí y no en la frontera.
 */
function validateAccess(definition: ResourceDefinition, extraRoles: string[]): string[] {
  const { access } = definition
  if (!access) return []

  const problems: string[] = []
  const grantable = [...GRANTABLE_ROLES, ...extraRoles]

  const checkRoles = (at: string, roles: string[]) => {
    const seen = new Set<string>()
    for (const role of roles) {
      if (!grantable.includes(role)) {
        problems.push(`${at}: '${role}' is not a grantable role (use ${readableRoleList(grantable)}; admin is implicit)`)
      }
      if (seen.has(role)) problems.push(`${at}: duplicated role '${role}'`)
      seen.add(role)
    }
  }

  if (access.view) checkRoles('access.view', access.view)
  if (access.create) checkRoles('access.create', access.create)
  if (access.edit) checkRoles('access.edit', access.edit)
  if (access.delete) checkRoles('access.delete', access.delete)
  if (access.manage) checkRoles('access.manage', access.manage)

  if (access.transitions) {
    if (!definition.state) {
      problems.push('access.transitions: the resource has no state machine')
    } else {
      const verbs = definition.state.transitions.map(t => t.name)
      for (const [verb, roles] of Object.entries(access.transitions)) {
        if (!verbs.includes(verb)) {
          problems.push(`access.transitions: '${verb}' is not a transition of the state machine (has: ${verbs.join(', ')})`)
        }
        checkRoles(`access.transitions.${verb}`, roles)
      }
    }
  }

  return problems
}

function validateField(name: string, field: FieldDefinition): string[] {
  const problems: string[] = []
  const at = `fields.${name}`

  if (field.table?.show && !field.table.label) {
    problems.push(`${at}: table.show requires table.label`)
  }
  if (field.form && field.form.control !== 'none' && !field.form.label) {
    problems.push(`${at}: form.control '${field.form.control}' requires form.label`)
  }
  if (field.relation) {
    if (!field.relation.to) problems.push(`${at}: relation.to must be non-empty`)
    if (!['reference', 'composition'].includes(field.relation.kind)) {
      problems.push(`${at}: relation.kind must be 'reference' or 'composition'`)
    }
  }
  if (field.column?.length !== undefined && field.column.lengthConst !== undefined) {
    problems.push(`${at}: column.length and column.lengthConst are mutually exclusive`)
  }
  if (field.column?.transformer === 'nullableNumeric' && !field.nullable) {
    problems.push(`${at}: column.transformer nullableNumeric requires nullable: true`)
  }
  if (field.min !== undefined && field.max !== undefined && field.min > field.max) {
    problems.push(`${at}: min (${field.min}) must be <= max (${field.max})`)
  }

  return problems
}

/**
 * El lookup denormaliza en OTRO campo del recurso (spec 60): el destino debe existir y no
 * puede tener form propio — su valor lo copia el use case desde el recurso origen, nunca
 * el usuario ni el navegador.
 */
function validateLookup(name: string, field: FieldDefinition, fields: ResourceDefinition['fields']): string[] {
  const lookup = field.form?.lookup
  if (!lookup) return []

  const problems: string[] = []
  const at = `fields.${name}`

  if (!lookup.resource) problems.push(`${at}: form.lookup.resource must be non-empty`)
  if (!lookup.labelField) problems.push(`${at}: form.lookup.labelField must be non-empty`)

  if (lookup.denormalizes !== undefined) {
    const target = fields[lookup.denormalizes]
    if (!target) {
      problems.push(`${at}: form.lookup.denormalizes '${lookup.denormalizes}' is not a field of the resource`)
    } else if (target.form) {
      problems.push(
        `${at}: form.lookup.denormalizes target '${lookup.denormalizes}' must not declare form (spec 60: the use case fills it)`
      )
    }
  }

  return problems
}

/** El brief de entidad es una frase (spec 22): tope corto, se reenvía en cada turno del chat. */
function validateBrief(brief: ResourceDefinition['brief']): string[] {
  if (brief === undefined) return []
  if (typeof brief !== 'string' || !brief.trim()) return ['brief: must be a non-empty string']
  if (brief.length > BRIEF_LIMITS.entity) return [`brief: exceeds ${BRIEF_LIMITS.entity} characters`]
  return []
}
