import { describe, expect, it } from 'vitest'
import type { DesignPage, DraftResource } from '@app/shared/domain'

import { blockFor, dropResource } from './block-drop'

function resource(name: string): DraftResource {
  return { name, plural: `${name}s`, labelSingular: name, labelPlural: `${name}s`, gender: 'm', fields: [] }
}

function page(...blocks: DesignPage['blocks']): DesignPage {
  return { title: 'Vista', blocks }
}

describe('dropResource', () => {
  const modelo = [resource('producto'), resource('proveedor')]

  it('manda la entidad de la vista donde se suelta', () => {
    expect(dropResource(page({ kind: 'table', resource: 'proveedor' }), null, modelo)).toBe('proveedor')
  })

  it('una fila de KPIs también da entidad a la vista: la primera que menciona', () => {
    expect(dropResource(page({ kind: 'kpis', resources: ['proveedor'] }), null, modelo)).toBe('proveedor')
  })

  it('en una vista sin entidad todavía, la elegida en el inspector', () => {
    expect(dropResource(page(), 'proveedor', modelo)).toBe('proveedor')
  })

  it('la entidad elegida que ya no existe no arrastra al bloque: cae a la primera del modelo', () => {
    expect(dropResource(page(), 'fantasma', modelo)).toBe('producto')
  })

  it('sin vista ni entidad elegida, la primera del modelo', () => {
    expect(dropResource(undefined, null, modelo)).toBe('producto')
  })

  it('sin modelo no hay entidad que dar: el bloque no se puede soltar', () => {
    expect(dropResource(page(), null, [])).toBeNull()
  })
})

describe('blockFor', () => {
  it('los KPIs se alimentan de una lista de entidades, no de una', () => {
    expect(blockFor('kpis', 'producto')).toEqual({ kind: 'kpis', resources: ['producto'] })
  })

  it('el resto de bloques llevan su entidad', () => {
    expect(blockFor('table', 'producto')).toEqual({ kind: 'table', resource: 'producto' })
  })
})
