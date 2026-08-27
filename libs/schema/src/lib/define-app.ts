import {
  AppDefinition,
  BRIEF_LIMITS,
  DashboardBlock,
  KpiMeasure,
  KpiOperator,
  KpiWindowPreset,
  PageDefinition
} from './app-types'
import { THEME_IDS } from './themes'
import { validateFlows } from './validate-flows'
import { SchemaValidationError } from './validation-errors'

const KEBAB_CASE = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/

const KPI_OPERATORS: KpiOperator[] = ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'contains', 'starts_with', 'ends_with']
const KPI_WINDOW_PRESETS: KpiWindowPreset[] = ['today', 'week', 'month', 'quarter', 'year', 'days']
const KPI_MEASURES: KpiMeasure[] = ['count', 'sum', 'avg', 'min', 'max', 'distinct']

// Structural validation only (v1): the model registry lives in the generator,
// so resource existence is checked there, not here.
export function defineApp(definition: AppDefinition): AppDefinition {
  const problems = [
    ...validateIdentity(definition),
    ...validateTheme(definition),
    ...validatePages(definition.pages),
    ...validateFlows(definition.flows),
    ...briefProblems(definition.brief)
  ]

  if (problems.length) throw new SchemaValidationError(definition.name, problems)

  return Object.freeze(definition)
}

function validateIdentity(definition: AppDefinition): string[] {
  const problems: string[] = []

  if (definition.schemaVersion !== 1) problems.push('schemaVersion: must be 1')
  if (!KEBAB_CASE.test(definition.name)) problems.push('name: must be non-empty kebab-case')

  return problems
}

/**
 * El catálogo es cerrado (spec 20)… salvo la puerta de la fase 4: `seed` deriva un tema completo
 * del color de marca con la receta del catálogo. Sigue sin haber colores libres por token.
 */
function validateTheme(definition: AppDefinition): string[] {
  const declared = definition.theme?.id ?? definition.theme?.palette
  const seed = definition.theme?.seed

  if (seed !== undefined) {
    const problems: string[] = []
    if (!/^#?[0-9a-fA-F]{6}$/.test(seed)) {
      problems.push(`theme.seed: '${seed}' is not a hex colour (#RRGGBB)`)
    }
    if (declared !== undefined) {
      problems.push('theme.seed: mutually exclusive with theme.id/palette')
    }
    return problems
  }
  if (declared === undefined) return []

  return THEME_IDS.includes(declared)
    ? []
    : [`theme.id: unknown theme '${declared}' (available: ${THEME_IDS.join(', ')})`]
}

function validatePages(pages: PageDefinition[]): string[] {
  const problems: string[] = []

  if (!pages.length) problems.push('pages: at least one page is required')

  const dashboards = pages.filter(p => p.kind === 'dashboard').length
  if (dashboards > 1) problems.push(`pages: at most one dashboard page is allowed (found ${dashboards})`)

  const seenResources = new Set<string>()
  pages.forEach((page, index) => {
    if (page.kind === 'dashboard') {
      problems.push(...validateDashboard(page, index))
      return
    }
    if (!KEBAB_CASE.test(page.resource)) {
      problems.push(`pages[${index}]: resource must be non-empty kebab-case`)
      return
    }
    // la unicidad aplica por (kind, recurso): una entidad puede tener lista Y ficha
    const key = `${page.kind}:${page.resource}`
    if (seenResources.has(key)) problems.push(`pages: duplicated ${page.kind} page '${page.resource}'`)
    seenResources.add(key)
  })

  return problems
}

function validateDashboard(page: Extract<PageDefinition, { kind: 'dashboard' }>, index: number): string[] {
  const problems: string[] = []

  if (!page.blocks.length) problems.push(`pages[${index}]: dashboard requires at least one block`)

  const seen = new Set<string>()
  page.blocks.forEach((block, blockIndex) => {
    const at = `pages[${index}].blocks[${blockIndex}]`
    // el panel es una vista como las demás: su ancho es dato, y solo hay dos (spec 53)
    if (block.width !== undefined && block.width !== 'full' && block.width !== 'half') {
      problems.push(`${at}: width must be 'full' or 'half'`)
    }

    // la fila de métricas habla de VARIOS recursos; el resto de bloques, de uno
    const resources = block.kind === 'metrics' ? block.resources : [block.resource]
    if (block.kind === 'metrics' && !resources.length) {
      problems.push(`${at}: metrics requires at least one resource`)
      return
    }
    if (resources.some(resource => !KEBAB_CASE.test(resource))) {
      problems.push(`${at}: resource must be non-empty kebab-case`)
      return
    }
    // los analíticos (spec 32) exigen campo; el kpi-count además condición y etiqueta
    if (block.kind === 'count-by' || block.kind === 'series' || block.kind === 'kpi-count') {
      if (!nonEmpty(block.field)) {
        problems.push(`${at}: ${block.kind} requires a field`)
        return
      }
    }
    if (block.kind === 'kpi-count') {
      if (!nonEmpty(block.equals)) problems.push(`${at}: kpi-count requires equals (the counted value)`)
      if (!nonEmpty(block.label)) problems.push(`${at}: kpi-count requires a label`)
    }
    if (block.kind === 'kpi') problems.push(...kpiProblems(block, at))
    if (block.kind === 'count-by' || block.kind === 'series') problems.push(...measuredBarsProblems(block, at))
    if (block.kind === 'top-n') problems.push(...topProblems(block, at))

    // un recurso admite varios bloques; el duplicado EXACTO no. La huella es la CONFIG COMPLETA,
    // no `kind:recurso:campo`: dos KPIs sobre `factura.estado` —pendientes y pagadas— son el caso
    // más normal del panel, y con la huella corta se rechazaban como duplicados.
    for (const resource of resources) {
      const key = `${block.kind}:${resource}:${fingerprintOf(block)}`
      if (seen.has(key)) problems.push(`pages[${index}]: duplicated block '${key}'`)
      seen.add(key)
    }
  })

  return problems
}

function nonEmpty(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

/**
 * Topes del brief (spec 22): se reenvía en cada turno del chat; sin tope degrada el prompt.
 * Exportada para que el gate del estudio aplique EXACTAMENTE los mismos topes que el schema.
 */
export function briefProblems(brief: AppDefinition['brief']): string[] {
  if (brief === undefined) return []
  const problems: string[] = []

  if (typeof brief.business !== 'string' || !brief.business.trim()) {
    problems.push('brief.business: must be a non-empty string')
  } else if (brief.business.length > BRIEF_LIMITS.business) {
    problems.push(`brief.business: exceeds ${BRIEF_LIMITS.business} characters`)
  }

  const rules = brief.rules ?? []
  if (rules.length > BRIEF_LIMITS.rules) problems.push(`brief.rules: at most ${BRIEF_LIMITS.rules} rules`)
  rules.forEach((rule, i) => {
    if (typeof rule !== 'string' || !rule.trim()) problems.push(`brief.rules[${i}]: must be a non-empty string`)
    else if (rule.length > BRIEF_LIMITS.ruleLength)
      problems.push(`brief.rules[${i}]: exceeds ${BRIEF_LIMITS.ruleLength} characters`)
  })

  const glossary = brief.glossary ?? []
  if (glossary.length > BRIEF_LIMITS.glossary) problems.push(`brief.glossary: at most ${BRIEF_LIMITS.glossary} entries`)
  glossary.forEach((entry, i) => {
    if (typeof entry.term !== 'string' || !entry.term.trim()) {
      problems.push(`brief.glossary[${i}].term: must be a non-empty string`)
    } else if (entry.term.length > BRIEF_LIMITS.termLength) {
      problems.push(`brief.glossary[${i}].term: exceeds ${BRIEF_LIMITS.termLength} characters`)
    }
    if (typeof entry.means !== 'string' || !entry.means.trim()) {
      problems.push(`brief.glossary[${i}].means: must be a non-empty string`)
    }
  })

  return problems
}

/** Reglas del bloque KPI (spec 70). El campo y su tipo los valida la composición, que sí conoce
 *  el modelo; aquí solo la forma: qué combinaciones de modificadores tienen sentido. */
function kpiProblems(block: Extract<DashboardBlock, { kind: 'kpi' }>, at: string): string[] {
  const problems: string[] = []

  if (!nonEmpty(block.label)) problems.push(`${at}: kpi requires a label`)

  // la medida distinta de conteo mide UN CAMPO, y el porcentaje deja de tener sentido: un tanto por
  // ciento de una suma sobre otra suma es otra pregunta (spec 71)
  const measure = block.measure ?? 'count'
  if (!KPI_MEASURES.includes(measure)) {
    problems.push(`${at}: unknown kpi measure '${measure}'`)
  } else if (measure === 'count') {
    if (block.field !== undefined) problems.push(`${at}: kpi with measure 'count' takes no field`)
  } else {
    if (!nonEmpty(block.field)) problems.push(`${at}: kpi with measure '${measure}' requires a field`)
    if (block.ratio === true) problems.push(`${at}: kpi ratio only applies to measure 'count'`)
  }

  const condition = block.condition
  if (condition !== undefined) {
    if (!nonEmpty(condition.field)) problems.push(`${at}: kpi condition requires a field`)
    if (!nonEmpty(condition.value)) problems.push(`${at}: kpi condition requires a value`)
    if (!KPI_OPERATORS.includes(condition.operator)) {
      problems.push(`${at}: unknown kpi condition operator '${condition.operator}'`)
    }
  }

  const window = block.window
  if (window !== undefined) {
    if (!nonEmpty(window.field)) problems.push(`${at}: kpi window.field is required (the date it narrows)`)
    if (!KPI_WINDOW_PRESETS.includes(window.preset)) {
      problems.push(`${at}: unknown kpi window preset '${window.preset}'`)
    }
    // `days` y el preset van juntos o no van: un 'este mes' con longitud es una contradicción
    if (window.preset === 'days' && !isCount(window.days, 1, 3650)) {
      problems.push(`${at}: kpi window.days must be an integer between 1 and 3650`)
    }
    if (window.preset !== 'days' && window.days !== undefined) {
      problems.push(`${at}: kpi window.days only applies to the 'days' preset`)
    }
  }

  // no hay «periodo anterior» de «siempre»
  if (block.compare === true && window === undefined) {
    problems.push(`${at}: kpi compare requires a window`)
  }
  // la mini-serie necesita saber sobre qué fecha se hacen los meses, y eso lo dice la ventana
  if (block.sparkline === true && block.window === undefined) {
    problems.push(`${at}: kpi sparkline requires a window (its date field)`)
  }
  // dos lecturas del mismo número y un solo sitio para la barra
  if (block.ratio === true && block.target !== undefined) {
    problems.push(`${at}: kpi ratio and target are mutually exclusive`)
  }
  if (block.target !== undefined && !(typeof block.target === 'number' && block.target > 0)) {
    problems.push(`${at}: kpi target must be a positive number`)
  }

  return problems
}


/**
 * Las barras y la serie pueden enseñar una MEDIDA en vez de un conteo (spec 72). Misma regla que
 * en la tarjeta: la medida distinta de `count` mide un campo, y el conteo no mide ninguno.
 */
function measuredBarsProblems(
  block: Extract<DashboardBlock, { kind: 'count-by' | 'series' }>,
  at: string
): string[] {
  const problems: string[] = []
  const measure = block.measure ?? 'count'

  if (!KPI_MEASURES.includes(measure)) {
    problems.push(`${at}: unknown measure '${measure}'`)
    return problems
  }
  if (measure === 'count') {
    if (block.measureField !== undefined) problems.push(`${at}: measure 'count' takes no measureField`)
  } else if (!nonEmpty(block.measureField)) {
    problems.push(`${at}: measure '${measure}' requires a measureField`)
  }

  return problems
}

function topProblems(block: Extract<DashboardBlock, { kind: 'top-n' }>, at: string): string[] {
  const problems: string[] = []

  if (!nonEmpty(block.field)) problems.push(`${at}: top-n requires a field to sort by`)
  if (!isCount(block.n, 1, 20)) problems.push(`${at}: top-n n must be an integer between 1 and 20`)
  if (block.dir !== undefined && block.dir !== 'asc' && block.dir !== 'desc') {
    problems.push(`${at}: top-n dir must be 'asc' or 'desc'`)
  }

  return problems
}

function isCount(value: number | undefined, min: number, max: number): boolean {
  return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max
}

/**
 * Huella de un bloque: lo que lo hace distinto de otro del mismo kind y recurso. La ETIQUETA no
 * entra —dos etiquetas para el mismo número siguen siendo el mismo número, y ese duplicado sí se
 * quiere cazar—; sí entran la condición, la ventana y los modificadores.
 */
function fingerprintOf(block: DashboardBlock): string {
  if (block.kind === 'kpi') {
    const condition = block.condition
    const window = block.window
    return [
      condition ? `${condition.field}${condition.operator}${condition.value}` : '',
      window ? `${window.field}${window.preset}${window.days ?? ''}` : '',
      block.ratio === true ? 'ratio' : '',
      block.compare === true ? 'compare' : '',
      block.target ?? ''
    ].join('|')
  }
  if (block.kind === 'top-n') return `${block.field}|${block.n}|${block.dir ?? 'desc'}`
  // un conteo y una suma del MISMO eje son dos bloques distintos (spec 72), igual que dos KPIs del
  // mismo campo con valores distintos lo eran en la 70
  if (block.kind === 'count-by' || block.kind === 'series') {
    return `${block.field}|${block.measure ?? 'count'}|${block.measureField ?? ''}`
  }

  return 'field' in block ? block.field : ''
}
