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

    // «añade subida de ficheros/adjuntos a <entidad>» (o quita)
    if (/fichero|adjunto|archivo|documento/.test(text)) {
      const target =
        design.resources.find(r => text.includes(r.name) || text.includes(normalize(r.plural))) ??
        (design.resources.length === 1 ? design.resources[0] : undefined)
      if (!target) {
        return { reply: 'Dime a qué entidad añado la subida de ficheros (o créala primero).', design }
      }
      target.attachments = !remove
      return {
        reply: remove
          ? `Quitada la subida de ficheros de ${target.labelPlural}.`
          : `Añadida la subida de ficheros a la vista de ${target.labelPlural}.`,
        design
      }
    }

    // «cada pedido es de un cliente» / «los pedidos pertenecen a un cliente»
    const relationMatch = text.match(
      /(?:cada|los|las)?\s*([a-z0-9-]+?)s?\s+(?:es|son|pertenece|pertenecen)\s+(?:de|a)\s+(?:un|una|el|la)?\s*([a-z0-9-]+)/
    )
    if (relationMatch) {
      const child = findResource(design, relationMatch[1])
      const parent = findResource(design, relationMatch[2])
      if (!child || !parent) {
        return { reply: 'Para relacionarlas necesito las dos entidades creadas antes.', design }
      }
      if (child.name === parent.name) {
        return { reply: 'Una entidad no puede referenciarse a si misma.', design }
      }
      if (!child.fields.some(f => f.type === 'ref' && f.refTo === parent.name)) {
        child.fields.push({
          name: parent.name,
          label: parent.labelSingular,
          type: 'ref',
          refTo: parent.name,
          samples: parent.fields.find(f => f.type === 'string')?.samples
        })
      }
      child.detail = true
      return {
        reply: `Cada ${child.labelSingular.toLowerCase()} queda ligado a un ${parent.labelSingular.toLowerCase()}: la ficha del ${parent.labelSingular.toLowerCase()} listara los suyos.`,
        design
      }
    }

    // «anade estado a pedidos con valores abierto, enviado y entregado»
    const enumMatch = text.match(/([a-z0-9-]+)\s+a\s+([a-z0-9-]+)\s+con\s+valores?\s+(.+)$/)
    if (add && enumMatch) {
      const target = findResource(design, enumMatch[2])
      if (!target) {
        return { reply: `No encuentro la entidad «${enumMatch[2]}»; creala primero.`, design }
      }
      const labels = splitList(enumMatch[3])
      if (labels.length < 2) {
        return { reply: 'Un conjunto de valores necesita al menos dos opciones.', design }
      }
      const fieldName = camel(enumMatch[1])
      target.fields = target.fields.filter(f => f.name !== fieldName)
      target.fields.push({
        name: fieldName,
        label: capitalize(enumMatch[1]),
        type: 'enum',
        values: labels.map(label => ({ value: slug(label), label: capitalize(label) }))
      })
      return {
        reply: `«${capitalize(enumMatch[1])}» de ${target.labelPlural} pasa a ser una lista de ${labels.length} valores, con etiquetas de color.`,
        design
      }
    }

    // «muestra los pedidos en galeria»
    if (/galeria|tarjetas/.test(text) && !remove) {
      const target = design.resources.find(r => text.includes(r.name) || text.includes(normalize(r.plural)))
      if (!target) {
        return { reply: 'Dime que entidad quieres ver en galeria.', design }
      }
      target.gallery = true
      if (!design.pages.some(p => p.blocks.some(b => b.kind === 'cards' && b.resource === target.name))) {
        design.pages.push({
          title: `${target.labelPlural} en galeria`,
          blocks: [{ kind: 'cards', resource: target.name, width: 'full' }]
        })
      }
      return { reply: `${target.labelPlural} se muestran tambien como galeria de tarjetas.`, design }
    }

    // «anade la ficha de pedidos»
    if (add && /\bficha\b/.test(text)) {
      const target = design.resources.find(r => text.includes(r.name) || text.includes(normalize(r.plural)))
      if (!target) {
        return { reply: 'Dime de que entidad quieres la ficha.', design }
      }
      target.detail = true
      if (!design.pages.some(p => p.drillDown && p.blocks.some(b => b.resource === target.name))) {
        design.pages.push({
          title: `Ficha de ${target.labelSingular.toLowerCase()}`,
          drillDown: true,
          blocks: [{ kind: 'fields', resource: target.name, width: 'full' }]
        })
      }
      return {
        reply: `Anadida la ficha de ${target.labelSingular.toLowerCase()}: se abre desde el listado, no desde el menu.`,
        design
      }
    }

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
      design.pages.push({ title: draft.labelPlural, blocks: [{ kind: 'table', resource: draft.name, width: 'full' }] })
      return { reply: `Creada la tabla de ${label} con ${draft.fields.length} campos.`, design }
    }

    if (add && kpi && kpiMatch) {
      const target = design.resources.find(r => [r.name, r.plural].includes(kpiMatch[1]))
      if (!target) return { reply: `No encuentro la entidad «${kpiMatch[1]}» en el diseño.`, design }
      const dashboard = design.pages.find(p => p.blocks.some(b => b.kind === 'kpis'))
      const kpiBlock = dashboard?.blocks.find(b => b.kind === 'kpis')
      if (kpiBlock) kpiBlock.resources = [...new Set([...(kpiBlock.resources ?? []), target.name])]
      else
        design.pages.unshift({
          title: 'Dashboard',
          blocks: [{ kind: 'kpis', resources: [target.name], width: 'full' }]
        })
      return { reply: `Añadido el KPI de ${target.labelPlural}.`, design }
    }

    if (remove && tableMatch) {
      const name = tableMatch[1]
      const target = design.resources.find(r => [r.name, r.plural].includes(name))
      if (!target) return { reply: `No encuentro la entidad «${name}».`, design }
      design.resources = design.resources.filter(r => r.name !== target.name)
      design.pages = design.pages
        .map(p => ({
          ...p,
          blocks: p.blocks
            .filter(b => b.resource !== target.name)
            .map(b => (b.resources ? { ...b, resources: b.resources.filter(r => r !== target.name) } : b))
            .filter(b => !b.resources || b.resources.length > 0)
        }))
        .filter(p => p.blocks.length > 0)
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
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
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

/** Entidad por nombre o plural, tolerando lo que escriba el usuario. */
function findResource(design: DesignPayload, term: string): DesignPayload['resources'][number] | undefined {
  const wanted = normalize(term)
  return design.resources.find(r => r.name === wanted || normalize(r.plural) === wanted || wanted.startsWith(r.name))
}

/** «abierto, enviado y entregado» -> ['abierto','enviado','entregado'] */
function splitList(raw: string): string[] {
  return raw
    .split(/,| y /)
    .map(part => part.trim())
    .filter(part => part.length > 0)
}

function slug(label: string): string {
  return normalize(label)
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
}
