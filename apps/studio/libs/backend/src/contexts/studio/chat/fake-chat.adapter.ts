import { newDraftResource, type DraftFieldType } from '@app/shared/domain'
import { ChatPort } from './chat.port'
import type { ChatMessage, ChatProposal, DesignPayload } from './chat.types'

/**
 * Adapter de demostración (sin red, sin clave), determinista a propósito:
 * - «crea una tabla de empleados con nombre, puesto y salario»
 * - «añade un kpi de empleados» · «quita la tabla de empleados»
 * Los tipos de campo se infieren por heurística de nombre (fecha→date, precio→number…).
 */
export class FakeChatAdapter extends ChatPort {
  readonly mode = 'fake'

  async propose(messages: ChatMessage[], current: DesignPayload): Promise<ChatProposal> {
    const last = [...messages].reverse().find(m => m.role === 'user')?.text ?? ''
    const text = normalize(last)
    const design: DesignPayload = JSON.parse(JSON.stringify(current)) as DesignPayload

    const add = /\b(crea|anade|agrega|pon)\b/.test(text)
    const remove = /\b(quita|elimina|borra)\b/.test(text)
    const kpi = /\bkpi\b/.test(text)

    // «... tabla/entidad de <nombre> [con <campo1>, <campo2> y <campo3>]»
    const tableMatch = text.match(/(?:tabla|entidad)\s+(?:de\s+)?([a-z0-9-]+)(?:\s+con\s+(.+))?$/)
    const kpiMatch = text.match(/kpi\s+(?:de\s+)?([a-z0-9-]+)/)

    if (add && !kpi && tableMatch) {
      const label = capitalize(tableMatch[1])
      const draft = newDraftResource(label)
      if (design.resources.some(r => r.name === draft.name)) {
        return { reply: `Ya existe la entidad «${label}».`, design }
      }
      if (tableMatch[2]) {
        draft.fields = tableMatch[2]
          .split(/,|\s+y\s+/)
          .map(s => s.trim())
          .filter(Boolean)
          .map(raw => ({ name: camel(raw), label: capitalize(raw), type: inferType(raw) }))
      }
      design.resources.push(draft)
      design.pages.push({ kind: 'resource', resource: draft.name })
      return { reply: `Creada la tabla de ${label} con ${draft.fields.length} campos.`, design }
    }

    if (add && kpi && kpiMatch) {
      const target = design.resources.find(r => [r.name, r.plural].includes(kpiMatch[1]))
      if (!target) return { reply: `No encuentro la entidad «${kpiMatch[1]}» en el diseño.`, design }
      const widget = { kind: 'kpi-total' as const, resource: target.name }
      const dashboard = design.pages.find(p => p.kind === 'dashboard')
      if (dashboard && dashboard.kind === 'dashboard') dashboard.widgets.push(widget)
      else design.pages.unshift({ kind: 'dashboard', widgets: [widget] })
      return { reply: `Añadido el KPI de ${target.labelPlural}.`, design }
    }

    if (remove && tableMatch) {
      const name = tableMatch[1]
      const target = design.resources.find(r => [r.name, r.plural].includes(name))
      if (!target) return { reply: `No encuentro la entidad «${name}».`, design }
      design.resources = design.resources.filter(r => r.name !== target.name)
      design.pages = design.pages
        .filter(p => !(p.kind === 'resource' && p.resource === target.name))
        .map(p => (p.kind === 'dashboard' ? { ...p, widgets: p.widgets.filter(w => w.resource !== target.name) } : p))
        .filter(p => p.kind !== 'dashboard' || p.widgets.length > 0)
      return { reply: `Eliminada la entidad ${target.labelSingular}.`, design }
    }

    return {
      reply:
        'Modo demo: prueba «crea una tabla de empleados con nombre, puesto y salario», ' +
        '«añade un kpi de empleados» o «quita la tabla de empleados».',
      design
    }
  }
}

function inferType(raw: string): DraftFieldType {
  const s = normalize(raw)
  if (/fecha|dia|caducidad|alta|baja/.test(s)) return 'date'
  if (/precio|importe|salario|coste|total|presupuesto/.test(s)) return 'number'
  if (/numero|cantidad|unidades|edad|anos|plazas|stock/.test(s)) return 'integer'
  if (/activo|disponible|habilitado|flag/.test(s)) return 'boolean'
  if (/descripcion|notas|observaciones|comentario/.test(s)) return 'text'
  return 'string'
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

function capitalize(s: string): string {
  const clean = s.trim()
  return clean.charAt(0).toUpperCase() + clean.slice(1)
}

function camel(raw: string): string {
  const parts = normalize(raw)
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(' ')
  return parts[0] + parts.slice(1).map(capitalize).join('')
}
