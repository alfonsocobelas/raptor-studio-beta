import { AppDefinition, PageDefinition } from './app-types'
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
    ...validateFlows(definition.flows)
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
