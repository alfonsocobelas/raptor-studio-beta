import type { DesignPage, DraftResource } from '@app/shared/domain'

/**
 * Lo que el raíl «Mientras tanto» enseña mientras el generador trabaja (spec 42): las piezas
 * del diseño, marcándose a medida que salen. Es el «3 de 4 vistas» de la maqueta 7C, pero
 * DERIVADO: la lista se declara antes de empezar con lo que el diseño y las ranuras ya dicen,
 * y cada línea se marca cuando aparece un fichero cuya ruta la nombra.
 *
 * Regla dura: **quedarse corto es aceptable, marcar de más es mentir**. De ahí tres cosas:
 * una ruta que no casa con nada no marca nada; el cruce compara SEGMENTOS de ruta y no
 * subcadenas (`ordenante` no marca a `orden`); y una línea que depende de varias entidades
 * —un panel de KPIs de dos— no se marca hasta que han salido TODAS.
 */
export interface WrittenItem {
  label: string
  kind: 'entity' | 'view' | 'module'
  done: boolean
  /**
   * Lo que falta por ver para darla por escrita: un grupo por pieza necesaria, y dentro del
   * grupo los alias de esa pieza (singular y plural), de los que basta uno.
   */
  pending: string[][]
}

export interface PlannedInput {
  resources: readonly DraftResource[]
  pages: readonly DesignPage[]
  slots: Record<string, string>
  plugins: readonly string[]
}

export function plannedItems(input: PlannedInput): WrittenItem[] {
  const entities: WrittenItem[] = input.resources.map(resource => ({
    label: resource.labelPlural,
    kind: 'entity',
    done: false,
    pending: [[resource.name, resource.plural]]
  }))

  // la vista se reconoce por las entidades de sus bloques: el generador emite POR RECURSO,
  // así que el título («Panel») no aparece en ninguna ruta
  const views: WrittenItem[] = input.pages.map(page => ({
    label: page.title,
    kind: 'view',
    done: false,
    pending: neededBy(page, input.resources)
  }))

  const modules: WrittenItem[] = []
  if (input.slots['auth'] && input.slots['auth'] !== 'none') {
    modules.push({ label: 'Autenticación', kind: 'module', done: false, pending: [['iam', 'auth']] })
  }
  if (input.slots['infra'] && input.slots['infra'] !== 'none') {
    const provider = input.slots['infra']
    modules.push({
      label: `Infraestructura ${provider.charAt(0).toUpperCase()}${provider.slice(1)}`,
      kind: 'module',
      done: false,
      pending: [[provider]]
    })
  }
  if (input.plugins.includes('email')) {
    modules.push({ label: 'Correo saliente', kind: 'module', done: false, pending: [['email']] })
  }

  return [...entities, ...views, ...modules]
}

/** Marca lo que esta ruta delata. Lo ya marcado se queda marcado. */
export function markWritten(items: readonly WrittenItem[], file: string): WrittenItem[] {
  if (!file.trim()) {
    return items as WrittenItem[]
  }
  const segments = new Set(file.split(/[/\\.]/).filter(Boolean))
  return items.map(item => {
    if (item.done) {
      return item
    }
    const pending = item.pending.filter(aliases => !aliases.some(alias => segments.has(alias)))
    return pending.length === item.pending.length ? item : { ...item, pending, done: pending.length === 0 }
  })
}

/** Un grupo por entidad que alimenta la vista: la vista no está hasta que están todas. */
function neededBy(page: DesignPage, resources: readonly DraftResource[]): string[][] {
  const names = page.blocks.flatMap(block => [block.resource, ...(block.resources ?? [])].filter(Boolean) as string[])
  return [...new Set(names)].map(name => {
    const resource = resources.find(candidate => candidate.name === name)
    return resource ? [resource.name, resource.plural] : [name]
  })
}
