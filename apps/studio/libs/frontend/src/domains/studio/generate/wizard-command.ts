import type { AppDefinition, BusinessBrief, BusinessFlow, PortsDefinition } from '@raptor/schema'
import type { DesignPage, DraftResource } from '@app/shared/domain'

/**
 * El wizard no sabe qué opciones existen: se las dice el MANIFIESTO que sirve
 * `GET /studio/slots`, generado desde el registro de ranuras del acelerador (spec 23).
 * Antes estas listas estaban copiadas a mano aquí, en el borde del studio-api y en el
 * `schema.json` del generador — tres sitios que había que tocar por cada proveedor nuevo.
 */
export interface ManifestProvider {
  value: string
  label: string
  description?: string
  /** Restricciones contra otras ranuras: el wizard deshabilita lo que las viola */
  requires?: Record<string, string>
}

export interface ManifestSlot {
  name: string
  label: string
  default: string
  providers: ManifestProvider[]
}

export interface SlotsManifest {
  slots: ManifestSlot[]
  plugins: { name: string; description: string }[]
}

export interface WizardOptions {
  name: string
  /** Ranura → proveedor elegido */
  slots: Record<string, string>
  plugins: string[]
}

/** El artefacto que consume `--appFile`: el schema vivo con el nombre elegido. */
export function buildAppFile(definition: AppDefinition, name: string): { filename: string; content: string } {
  return {
    filename: `${name}.app.json`,
    content: JSON.stringify({ ...definition, name }, null, 2)
  }
}

export function defaultSelection(manifest: SlotsManifest): Record<string, string> {
  return Object.fromEntries(manifest.slots.map(slot => [slot.name, slot.default]))
}

/** Una ranura con un solo proveedor no se pregunta: no hay nada que elegir. */
export function choosableSlots(manifest: SlotsManifest): ManifestSlot[] {
  return manifest.slots.filter(slot => slot.providers.length > 1)
}

/** ¿Choca este proveedor con la selección actual? Mismo criterio que el gate del generador. */
export function isDisabled(provider: ManifestProvider, selection: Record<string, string>): boolean {
  return Object.entries(provider.requires ?? {}).some(([slot, required]) => selection[slot] !== required)
}

/**
 * ¿Hay algo que generar? Una vista sin bloques no emite nada, así que el botón
 * de generar se queda apagado hasta que exista al menos una vista con un bloque.
 */
/** «45 s» o «1 min 32 s»: la ortografía única del segundero (obra, recibo y botón del lienzo). */
export function spelled(seconds: number): string {
  return seconds < 60 ? `${seconds} s` : `${Math.floor(seconds / 60)} min ${seconds % 60} s`
}

export function hasPublishableDesign(pages: readonly DesignPage[]): boolean {
  return pages.some(page => page.blocks.length > 0)
}

export interface DesignSummary {
  views: number
  blocks: number
  resources: number
}

/**
 * Lo que el raíl de «Antes de generar» resume: qué va a salir de aquí. Vive con el resto de
 * la lógica del asistente y no en la plantilla porque es un número que el usuario usa para
 * decidir, no un adorno.
 */
export function designSummary(pages: readonly DesignPage[], resources: readonly DraftResource[]): DesignSummary {
  return {
    views: pages.length,
    blocks: pages.reduce((total, page) => total + page.blocks.length, 0),
    resources: resources.length
  }
}

export interface DesignRequestInput {
  name: string
  resources: readonly DraftResource[]
  pages: readonly DesignPage[]
  palette: string
  brief?: BusinessBrief
  flows?: readonly BusinessFlow[]
  ports?: PortsDefinition
}

/**
 * El diseño que viaja a generar. Se construye AQUÍ y no a mano en el componente porque
 * a mano se olvidaron dos campos: el brief (spec 22) y los flujos (spec 28) se quedaban
 * en el lienzo, y la app salía sin CLAUDE.md y sin `processes/` — con el diseño intacto
 * en el estudio, así que nada delataba la pérdida hasta abrir lo generado.
 *
 * Lo vacío no viaja: un diseño sin brief no declara la clave, para que el app-file
 * emitido sea el mismo que antes de que existieran estas ranuras.
 */
export function buildDesignRequest(input: DesignRequestInput): {
  appName: string
  resources: readonly DraftResource[]
  pages: readonly DesignPage[]
  palette: string
  brief?: BusinessBrief
  flows?: readonly BusinessFlow[]
  ports?: PortsDefinition
} {
  return {
    appName: input.name,
    resources: input.resources,
    pages: input.pages,
    palette: input.palette,
    ...(input.brief ? { brief: input.brief } : {}),
    ...(input.flows?.length ? { flows: input.flows } : {}),
    ...(input.ports ? { ports: input.ports } : {})
  }
}

export function buildCommand(manifest: SlotsManifest, options: WizardOptions): string {
  const plugins = options.plugins.length ? options.plugins.join(',') : 'none'
  return [
    `npx nx g @raptor/generators:app ${options.name}`,
    `--appFile=${options.name}.app.json`,
    ...choosableSlots(manifest).map(slot => `--${slot.name}=${options.slots[slot.name] ?? slot.default}`),
    `--plugins=${plugins}`
  ].join(' ')
}
