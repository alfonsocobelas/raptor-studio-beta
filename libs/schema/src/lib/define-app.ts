import { AppDefinition, BRIEF_LIMITS, PageDefinition } from './app-types'
import { THEME_IDS } from './themes'
import { validateFlows } from './validate-flows'
import { SchemaValidationError } from './validation-errors'

const KEBAB_CASE = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/

// Structural validation only (v1): the model registry lives in the generator,
// so resource existence is checked there, not here.
export function defineApp(definition: AppDefinition): AppDefinition {
  const problems = [
    ...validateIdentity(definition),
    ...validateTheme(definition),
    ...validatePages(definition.pages),
    ...validateFlows(definition.flows),
    ...validateBrief(definition.brief)
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

/** El catálogo es cerrado a propósito: sin colores libres (spec 20). */
function validateTheme(definition: AppDefinition): string[] {
  const declared = definition.theme?.id ?? definition.theme?.palette
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

  if (!page.widgets.length) problems.push(`pages[${index}]: dashboard requires at least one widget`)

  const seen = new Set<string>()
  page.widgets.forEach((widget, widgetIndex) => {
    if (!KEBAB_CASE.test(widget.resource)) {
      problems.push(`pages[${index}].widgets[${widgetIndex}]: resource must be non-empty kebab-case`)
      return
    }
    if (seen.has(widget.resource)) problems.push(`pages[${index}]: duplicated widget for resource '${widget.resource}'`)
    seen.add(widget.resource)
  })

  return problems
}

/** Topes del brief (spec 22): se reenvía en cada turno del chat; sin tope degrada el prompt. */
function validateBrief(brief: AppDefinition['brief']): string[] {
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
