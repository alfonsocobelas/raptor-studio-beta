import { defineApp } from '@raptor/schema'

/**
 * App del almacén (mismo set que la demo boutique verificada en la spec 05):
 * los tres recursos ensamblan y compilan de punta a punta, a diferencia de los
 * de oro, cuyos dialogs de contract/project siguen pendientes (spec 04).
 */
export const boutique = defineApp({
  schemaVersion: 1,
  name: 'boutique',
  pages: [
    {
      kind: 'dashboard',
      blocks: [{ kind: 'metrics', resources: ['garment', 'supplier', 'movement'] }]
    },
    { kind: 'resource', resource: 'garment' },
    { kind: 'resource', resource: 'supplier' },
    { kind: 'resource', resource: 'movement' }
  ]
})
