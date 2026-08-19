import { defineApp } from '@raptor/schema'

/**
 * App canónica de demostración: dashboard de KPIs + los cuatro recursos de oro.
 * Es la misma composición que producen las opciones planas equivalentes
 * (`models=customer,contract,license,project --dashboard`), y el fixture del
 * gate de equivalencia plano ≡ app-schema.
 */
export const demo = defineApp({
  schemaVersion: 1,
  name: 'demo',
  pages: [
    {
      kind: 'dashboard',
      blocks: [{ kind: 'metrics', resources: ['customer', 'contract', 'license', 'project'] }]
    },
    { kind: 'resource', resource: 'customer' },
    { kind: 'resource', resource: 'contract' },
    { kind: 'gantt', resource: 'contract' },
    { kind: 'resource', resource: 'license' },
    { kind: 'resource', resource: 'project' }
  ]
})
