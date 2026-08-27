import { describe, expect, it } from 'vitest'
import type { DraftResource } from '@app/shared/domain'
import { measurableFieldsOf, measureAllowedOn, measuresFor } from './kpi-config-options'

const draft = (fields: DraftResource['fields']): DraftResource =>
  ({ name: 'x', plural: 'xs', labelSingular: 'X', labelPlural: 'Xs', gender: 'm', fields }) as DraftResource

/** Spec 71: qué medidas ofrece el panel, y sobre qué campos. */
describe('kpi-config-options — medidas (spec 71)', () => {
  it('sin campos medibles solo se puede contar', () => {
    const options = measuresFor(draft([{ name: 'nombre', label: 'Nombre', type: 'string' }]))

    expect(options).toEqual(['count'])
  })

  it('con un numérico se ofrecen todas', () => {
    const options = measuresFor(
      draft([
        { name: 'nombre', label: 'Nombre', type: 'string' },
        { name: 'importe', label: 'Importe', type: 'number' }
      ])
    )

    expect(options).toEqual(['count', 'sum', 'avg', 'max', 'min', 'distinct'])
  })

  it('con solo fechas no se ofrece sumar ni promediar', () => {
    const options = measuresFor(draft([{ name: 'alta', label: 'Alta', type: 'date' }]))

    expect(options).toEqual(['count', 'max', 'min', 'distinct'])
  })

  it('los campos medibles son los números y las fechas, con su tipo', () => {
    const fields = measurableFieldsOf(
      draft([
        { name: 'nombre', label: 'Nombre', type: 'string' },
        { name: 'importe', label: 'Importe', type: 'number' },
        { name: 'alta', label: 'Alta', type: 'date' },
        { name: 'activo', label: 'Activo', type: 'boolean' }
      ])
    )

    expect(fields.map(f => [f.field.name, f.kind])).toEqual([
      ['importe', 'numeric'],
      ['alta', 'date']
    ])
  })

  it('sumar una fecha no vale; su máximo sí', () => {
    expect(measureAllowedOn('sum', 'date')).toBe(false)
    expect(measureAllowedOn('avg', 'date')).toBe(false)
    expect(measureAllowedOn('max', 'date')).toBe(true)
  })
})
