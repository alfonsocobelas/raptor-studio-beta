/**
 * Ranuras de capacidad (spec 22): una ranura es una decisión excluyente de la app
 * generada — se elige exactamente UN proveedor entre los registrados. Complementa
 * a los plugins aditivos de `registry.ts`; mismo estilo: manifiesto tipado, sin
 * decoradores. Añadir un proveedor aquí basta para que aparezca en el formulario
 * del generador, en slots.json y en el wizard del estudio.
 */

export interface SlotProvider {
  /** Valor del flag CLI ('postgres', 'material'…) */
  value: string
  /** Etiqueta que ve el usuario en el formulario */
  label: string
  description?: string
}

export interface Slot {
  /** Nombre de la ranura y del flag CLI ('database', 'ui'…) */
  name: string
  /** Etiqueta del grupo en el formulario */
  label: string
  /** Proveedor elegido cuando no se pasa el flag */
  default: string
  providers: SlotProvider[]
}

export const SLOTS: Record<string, Slot> = {
  database: {
    name: 'database',
    label: 'Base de datos',
    default: 'postgres',
    providers: [
      { value: 'postgres', label: 'PostgreSQL (TypeORM)' },
      { value: 'mongo', label: 'MongoDB (Mongoose)' }
    ]
  },
  ui: {
    name: 'ui',
    label: 'Componentes',
    default: 'spartan',
    providers: [
      { value: 'spartan', label: 'Spartan NG (shadcn para Angular)' },
      { value: 'material', label: 'Angular Material' }
    ]
  }
}

export function selectProvider(slotName: string, value: string | undefined): SlotProvider {
  const slot = SLOTS[slotName]
  if (!slot) {
    throw new Error(`Unknown slot '${slotName}'. Registered slots: ${Object.keys(SLOTS).join(', ')}`)
  }
  const chosen = value ?? slot.default
  const provider = slot.providers.find(p => p.value === chosen)
  if (!provider) {
    throw new Error(
      `Unknown ${slot.name} '${chosen}'. Available: ${slot.providers.map(p => p.value).join(', ')}`
    )
  }
  return provider
}
