import { describe, expect, it } from 'vitest'
import type { AppDefinition } from '@acc/schema'
import type { DesignPage } from '@app/shared/domain'
import {
  buildAppFile,
  buildCommand,
  buildDesignRequest,
  defaultSelection,
  hasPublishableDesign,
  isDisabled,
  type SlotsManifest,
  type WizardOptions
} from './wizard-command'

const definition: AppDefinition = {
  schemaVersion: 1,
  name: 'boutique',
  pages: [{ kind: 'resource', resource: 'garment' }]
}

/** El mismo manifiesto que sirve /studio/slots, en pequeño. */
const manifest: SlotsManifest = {
  slots: [
    {
      name: 'database',
      label: 'Base de datos',
      default: 'postgres',
      providers: [
        { value: 'postgres', label: 'PostgreSQL' },
        { value: 'mongo', label: 'MongoDB' }
      ]
    },
    {
      name: 'ui',
      label: 'Componentes',
      default: 'spartan',
      providers: [
        { value: 'spartan', label: 'Spartan' },
        { value: 'alt', label: 'Alternativa' }
      ]
    },
    {
      name: 'infra',
      label: 'Infraestructura',
      default: 'none',
      providers: [{ value: 'none', label: 'Ninguna' }]
    },
    {
      name: 'auth',
      label: 'Autenticación',
      default: 'none',
      providers: [
        { value: 'none', label: 'Ninguna' },
        {
          value: 'single-tenant',
          label: 'Single-tenant',
          requires: { database: 'postgres' }
        }
      ]
    }
  ],
  plugins: [
    { name: 'email', description: 'Emails' },
    { name: 'observability', description: 'Telemetría' }
  ]
}

const options: WizardOptions = {
  name: 'tienda-sur',
  slots: { ui: 'alt', database: 'mongo' },
  plugins: ['email']
}

describe('buildAppFile', () => {
  it('reescribe el name del schema al elegido en el wizard', () => {
    const file = buildAppFile(definition, 'tienda-sur')

    expect(JSON.parse(file.content)).toMatchObject({
      name: 'tienda-sur',
      schemaVersion: 1
    })
    expect(file.filename).toBe('tienda-sur.app.json')
  })
})

describe('defaultSelection', () => {
  it('parte de los defaults que publica el manifiesto', () => {
    expect(defaultSelection(manifest)).toEqual({
      database: 'postgres',
      ui: 'spartan',
      infra: 'none',
      auth: 'none'
    })
  })
})

describe('buildCommand', () => {
  it('monta un flag por ranura elegible, en el orden del manifiesto', () => {
    expect(buildCommand(manifest, options)).toBe(
      'npx nx g @acc/generators:app tienda-sur --appFile=tienda-sur.app.json --database=mongo --ui=alt --auth=none --plugins=email'
    )
  })

  it('no emite flag para una ranura con un solo proveedor', () => {
    expect(buildCommand(manifest, options)).not.toContain('--infra=')
  })

  it('sin plugins emite plugins=none', () => {
    expect(buildCommand(manifest, { ...options, plugins: [] })).toContain('--plugins=none')
  })
})

describe('isDisabled', () => {
  it('deshabilita el proveedor cuyo requires choca con la selección actual', () => {
    const singleTenant = manifest.slots[3].providers[1]

    expect(isDisabled(singleTenant, { database: 'mongo' })).toBe(true)
    expect(isDisabled(singleTenant, { database: 'postgres' })).toBe(false)
  })

  it('un proveedor sin requires nunca se deshabilita', () => {
    expect(isDisabled(manifest.slots[0].providers[1], { auth: 'single-tenant' })).toBe(false)
  })
})

describe('hasPublishableDesign', () => {
  it('un lienzo sin vistas no se puede publicar', () => {
    expect(hasPublishableDesign([])).toBe(false)
  })

  it('una vista sin bloques todavía no es un diseño', () => {
    const pages: DesignPage[] = [{ title: 'Vacía', blocks: [] }]

    expect(hasPublishableDesign(pages)).toBe(false)
  })

  it('basta una vista con un bloque', () => {
    const pages: DesignPage[] = [
      { title: 'Vacía', blocks: [] },
      { title: 'Prendas', blocks: [{ kind: 'table', resource: 'garment' }] }
    ]

    expect(hasPublishableDesign(pages)).toBe(true)
  })
})

/**
 * Lo que el asistente manda a generar. El bug que lo motiva: el cuerpo se construía a
 * mano con appName/resources/pages/palette, así que el BRIEF y los FLUJOS del lienzo no
 * cruzaban la frontera. La app del taller salió sin CLAUDE.md y sin `processes/` aunque
 * su diseño tenía un flujo de seis pasos — dos promesas escritas (specs 22 y 28) rotas
 * en la última milla, y solo se ve generando de verdad.
 */
describe('buildDesignRequest', () => {
  const design = {
    name: 'taller',
    resources: [{ name: 'orden' }] as never,
    pages: [{ title: 'Órdenes', blocks: [{ kind: 'table' as const, resource: 'orden' }] }],
    palette: 'ocean',
    brief: { business: 'Un taller de maquinaria agrícola', rules: [], glossary: [] },
    flows: [
      {
        name: 'De la entrada a la entrega',
        nodes: [
          { id: 'entra', kind: 'start' as const, text: 'entra la máquina' },
          { id: 'abrir', kind: 'step' as const, text: 'se abre la orden', entity: 'orden', status: 'recibida' },
          { id: 'fin', kind: 'end' as const, text: 'cerrada' }
        ],
        edges: [
          { from: 'entra', to: 'abrir' },
          { from: 'abrir', to: 'fin' }
        ]
      }
    ]
  }

  it('lleva el brief y los flujos del lienzo, no solo entidades y vistas', () => {
    const request = buildDesignRequest(design)

    expect(request.brief).toEqual(design.brief)
    expect(request.flows).toEqual(design.flows)
    // y el estado declarado en el paso sobrevive intacto: es lo que emite el proceso
    expect(request.flows?.[0].nodes[1].status).toBe('recibida')
  })

  it('mantiene lo que ya viajaba', () => {
    const request = buildDesignRequest(design)

    expect(request).toMatchObject({ appName: 'taller', resources: design.resources, pages: design.pages, palette: 'ocean' })
  })

  it('un diseño sin brief ni flujos no declara las claves (no las manda vacías)', () => {
    const request = buildDesignRequest({ ...design, brief: undefined, flows: [] })

    expect('brief' in request).toBe(false)
    expect('flows' in request).toBe(false)
  })
})
