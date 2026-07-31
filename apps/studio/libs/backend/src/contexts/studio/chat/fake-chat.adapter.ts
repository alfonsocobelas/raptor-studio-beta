import type { AppDefinition, DashboardPage, ResourceDefinition } from '@acc/schema'
import { ChatPort } from './chat.port'
import type { ChatMessage, ChatProposal } from './chat.types'

/**
 * Adapter de demostración (sin red, sin clave): entiende «añade/quita la
 * página/el kpi de <recurso>» contra el catálogo real. Determinista a
 * propósito — es el que corren los tests y el smoke de Playwright.
 */
export class FakeChatAdapter extends ChatPort {
  readonly mode = 'fake'

  constructor(private readonly registry: Record<string, ResourceDefinition>) {
    super()
  }

  async propose(messages: ChatMessage[], currentSchema: AppDefinition): Promise<ChatProposal> {
    const last = [...messages].reverse().find(m => m.role === 'user')?.text ?? ''
    const text = normalize(last)

    const action: 'add' | 'remove' | null = /\b(anade|agrega|pon|crea)\b/.test(text)
      ? 'add'
      : /\b(quita|elimina|borra)\b/.test(text)
        ? 'remove'
        : null
    const target: 'kpi' | 'page' = /\bkpi\b/.test(text) ? 'kpi' : 'page'
    const model = Object.values(this.registry).find(m =>
      [m.name, m.plural, m.labels?.plural, m.labels?.singular]
        .filter((s): s is string => Boolean(s))
        .some(s => text.includes(normalize(s)))
    )

    if (!action || !model) {
      return {
        reply:
          'Modo demo: entiendo «añade/quita la página de <recurso>» y «añade/quita el kpi de <recurso>». ' +
          `Recursos del catálogo: ${Object.values(this.registry)
            .map(m => m.labels?.plural ?? m.plural)
            .join(', ')}.`,
        schema: currentSchema
      }
    }

    const label = model.labels?.plural ?? model.plural
    if (target === 'kpi') {
      return { reply: `${action === 'add' ? 'Añadido' : 'Quitado'} el KPI de ${label}.`, schema: this.mutateKpi(currentSchema, model.name, action) }
    }
    return { reply: `${action === 'add' ? 'Añadida' : 'Quitada'} la página de ${label}.`, schema: this.mutatePage(currentSchema, model.name, action) }
  }

  private mutatePage(schema: AppDefinition, resource: string, action: 'add' | 'remove'): AppDefinition {
    const pages =
      action === 'add'
        ? [...schema.pages, { kind: 'resource' as const, resource }]
        : schema.pages.filter(p => !(p.kind === 'resource' && p.resource === resource))
    return { ...schema, pages }
  }

  private mutateKpi(schema: AppDefinition, resource: string, action: 'add' | 'remove'): AppDefinition {
    const widget = { kind: 'kpi-total' as const, resource }
    const dashboardIndex = schema.pages.findIndex(p => p.kind === 'dashboard')
    if (dashboardIndex === -1) {
      return action === 'add'
        ? { ...schema, pages: [{ kind: 'dashboard', widgets: [widget] }, ...schema.pages] }
        : schema
    }
    const dashboard = schema.pages[dashboardIndex] as DashboardPage
    const widgets =
      action === 'add'
        ? [...dashboard.widgets, widget]
        : dashboard.widgets.filter(w => w.resource !== resource)
    return {
      ...schema,
      pages: schema.pages.map((p, i) => (i === dashboardIndex ? { ...dashboard, widgets } : p))
    }
  }
}

/** minúsculas y sin acentos, para casar «Añade» con «anade» */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}
