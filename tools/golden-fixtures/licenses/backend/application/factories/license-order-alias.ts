// El read model expone `solutionName` como alias de la columna `subSolutionAreaName`; las tablas
// de salud ordenan y filtran por él. Se reescribe aquí para que el frontend no cambie y Criteria
// reciba siempre nombres de columna reales.
const FIELD_ALIASES: Record<string, string> = { solutionName: 'subSolutionAreaName' }

export function resolveLicenseOrderAliases(
  orders: Array<Map<string, string>> | undefined
): Array<Map<string, string>> | undefined {
  return rewriteAliases(orders, 'orderBy')
}

export function resolveLicenseFilterAliases(
  filters: Array<Map<string, string>> | undefined
): Array<Map<string, string>> | undefined {
  return rewriteAliases(filters, 'field')
}

function rewriteAliases(
  entries: Array<Map<string, string>> | undefined,
  fieldKey: string
): Array<Map<string, string>> | undefined {
  if (!entries?.length) {
    return entries
  }
  return entries.map(entry => {
    const field = entry.get(fieldKey)
    const resolved = field ? FIELD_ALIASES[field] : undefined
    if (!resolved) {
      return entry
    }
    const rewritten = new Map(entry)
    rewritten.set(fieldKey, resolved)
    return rewritten
  })
}
