import { describe, expect, it } from 'vitest'
import { mergeCatalog } from './generate-catalog'
import type { SlotsManifest } from './wizard-command'

/**
 * El manifiesto real (tools/slots.json) en pequeño: infra sin AWS ni Google, auth sin
 * multi-tenant y un solo plugin. Justo el hueco que la pantalla tiene que enseñar apagado.
 */
const manifest: SlotsManifest = {
  slots: [
    {
      name: 'database',
      label: 'Base de datos',
      default: 'postgres',
      providers: [
        { value: 'postgres', label: 'PostgreSQL (TypeORM)' },
        { value: 'mongo', label: 'MongoDB (Mongoose)' }
      ]
    },
    {
      name: 'ui',
      label: 'Componentes',
      default: 'spartan',
      providers: [{ value: 'spartan', label: 'Spartan NG' }]
    },
    {
      name: 'design',
      label: 'Preset visual',
      default: 'actual',
      providers: [
        { value: 'actual', label: 'Actual' },
        { value: 'cabina', label: 'Cabina' }
      ]
    },
    {
      name: 'infra',
      label: 'Infraestructura',
      default: 'none',
      providers: [
        { value: 'none', label: 'Ninguna' },
        { value: 'azure', label: 'Azure (Key Vault, Blob Storage)' }
      ]
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
          description: 'Sesión por cookie, invitaciones y roles',
          requires: { database: 'postgres' }
        }
      ]
    }
  ],
  plugins: [{ name: 'email', description: 'Adaptadores de email: Azure ACS, SES y Brevo' }]
}

const defaults = { database: 'postgres', ui: 'spartan', design: 'actual', infra: 'none', auth: 'none' }

const group = (catalog: ReturnType<typeof mergeCatalog>, slot: string) => {
  const found = catalog.groups.find(g => g.slot === slot)
  if (!found) throw new Error(`no hay grupo para la ranura ${slot}`)
  return found
}

const card = (catalog: ReturnType<typeof mergeCatalog>, slot: string, value: string) => {
  const found = group(catalog, slot).cards.find(c => c.value === value)
  if (!found) throw new Error(`no hay tarjeta ${slot}=${value}`)
  return found
}

describe('mergeCatalog', () => {
  it('pinta un grupo por ranura elegible', () => {
    expect(mergeCatalog(manifest, defaults).groups.map(g => g.slot)).toEqual(['infra', 'database', 'auth'])
  })

  it('deja fuera la ranura del preset visual: lo manda el lienzo, no esta pantalla', () => {
    expect(mergeCatalog(manifest, defaults).groups.some(g => g.slot === 'design')).toBe(false)
  })

  it('deja fuera la ranura de un solo proveedor: no hay nada que elegir', () => {
    expect(mergeCatalog(manifest, defaults).groups.some(g => g.slot === 'ui')).toBe(false)
  })

  it('el grupo lleva el encabezado del catálogo, no la etiqueta seca del manifiesto', () => {
    expect(group(mergeCatalog(manifest, defaults), 'infra').heading).toBe('¿Dónde quieres alojarla?')
  })

  /** El raíl no cabe con la pregunta entera: ahí la fila se llama como la ranura. */
  it('y también la etiqueta corta del manifiesto, para el raíl', () => {
    expect(group(mergeCatalog(manifest, defaults), 'infra').label).toBe('Infraestructura')
  })

  it('lo que el manifiesto publica sale disponible, con la redacción del catálogo', () => {
    expect(card(mergeCatalog(manifest, defaults), 'infra', 'azure')).toMatchObject({
      title: 'Azure',
      available: true,
      disabled: false
    })
  })

  it('lo que el catálogo enseña y el manifiesto no tiene sale apagado y como próximamente', () => {
    expect(card(mergeCatalog(manifest, defaults), 'infra', 'aws')).toMatchObject({
      title: 'AWS',
      available: false,
      disabled: true,
      reason: 'Próximamente'
    })
    expect(card(mergeCatalog(manifest, defaults), 'auth', 'multi-tenant').available).toBe(false)
  })

  it('el catálogo manda el orden: primero sus tarjetas, en su orden', () => {
    expect(group(mergeCatalog(manifest, defaults), 'infra').cards.map(c => c.value)).toEqual([
      'none',
      'azure',
      'aws',
      'gcp'
    ])
  })

  /** El manifiesto manda (spec 23): un adapter nuevo se enciende sin tocar el componente. */
  it('un proveedor que el catálogo no conoce se pinta igualmente, al final y con su etiqueta', () => {
    const withHetzner: SlotsManifest = {
      ...manifest,
      slots: manifest.slots.map(slot =>
        slot.name === 'infra'
          ? {
              ...slot,
              providers: [...slot.providers, { value: 'hetzner', label: 'Hetzner', description: 'Servidor propio' }]
            }
          : slot
      )
    }
    const cards = group(mergeCatalog(withHetzner, defaults), 'infra').cards

    expect(cards[cards.length - 1]).toMatchObject({
      value: 'hetzner',
      title: 'Hetzner',
      hint: 'Servidor propio',
      available: true,
      disabled: false
    })
  })

  it('un proveedor cuyo requires choca con lo elegido sale apagado, y dice qué le falta', () => {
    expect(card(mergeCatalog(manifest, { ...defaults, database: 'mongo' }), 'auth', 'single-tenant')).toMatchObject({
      available: true,
      disabled: true,
      reason: 'Requiere Base de datos: PostgreSQL (TypeORM)'
    })
  })

  it('con la selección compatible, el mismo proveedor está disponible y sin razón', () => {
    const chosen = card(mergeCatalog(manifest, defaults), 'auth', 'single-tenant')

    expect(chosen.disabled).toBe(false)
    expect(chosen.reason).toBeUndefined()
  })

  describe('complementos', () => {
    it('el plugin del manifiesto sale disponible con la redacción del catálogo', () => {
      const email = mergeCatalog(manifest, defaults).addons.find(c => c.value === 'email')

      expect(email).toMatchObject({ title: 'Correo saliente', available: true, disabled: false })
    })

    it('los cuatro que aún no existen salen apagados, en el orden del catálogo', () => {
      const addons = mergeCatalog(manifest, defaults).addons

      expect(addons.map(c => c.value)).toEqual(['email', 'redis', 'observability', 'object-storage', 'custom-domain'])
      expect(addons.filter(c => !c.available).every(c => c.reason === 'Próximamente')).toBe(true)
    })

    it('no se ofrece alta disponibilidad: se retiró del catálogo a propósito', () => {
      expect(mergeCatalog(manifest, defaults).addons.some(c => c.value === 'high-availability')).toBe(false)
    })

    it('un plugin que el catálogo no conoce se pinta al final con su descripción', () => {
      const withBackups: SlotsManifest = {
        ...manifest,
        plugins: [...manifest.plugins, { name: 'backups', description: 'Copias nocturnas' }]
      }
      const addons = mergeCatalog(withBackups, defaults).addons

      expect(addons[addons.length - 1]).toMatchObject({
        value: 'backups',
        title: 'backups',
        hint: 'Copias nocturnas',
        available: true
      })
    })
  })
})
