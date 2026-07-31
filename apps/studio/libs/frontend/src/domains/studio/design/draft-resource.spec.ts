import { describe, expect, it } from 'vitest'
import { defineResource } from '@acc/schema'
import { draftToResource, newDraftResource, type DraftResource } from './draft-resource'

const draft: DraftResource = {
  name: 'empleado',
  plural: 'empleados',
  labelSingular: 'Empleado',
  labelPlural: 'Empleados',
  gender: 'm',
  fields: [
    { name: 'nombre', label: 'Nombre', type: 'string' },
    { name: 'salario', label: 'Salario', type: 'number' },
    { name: 'antiguedad', label: 'Años', type: 'integer' },
    { name: 'activo', label: 'Activo', type: 'boolean' },
    { name: 'fechaAlta', label: 'Fecha de alta', type: 'date' },
    { name: 'notas', label: 'Notas', type: 'text' }
  ]
}

describe('draftToResource', () => {
  it('produce un ResourceDefinition que pasa defineResource (gate real)', () => {
    expect(() => defineResource(draftToResource(draft, 'flotas'))).not.toThrow()
  })

  it('deriva identidad, labels y contexto de la app', () => {
    const resource = draftToResource(draft, 'flotas')

    expect(resource).toMatchObject({
      name: 'empleado',
      plural: 'empleados',
      context: 'flotas',
      schemaName: 'flotas',
      labels: { singular: 'Empleado', plural: 'Empleados', gender: 'm' }
    })
    expect(resource.fields['id']).toMatchObject({ type: 'uuid', pk: true })
  })

  it('el primer campo string es el «nombre»: requerido, con VO string y buscable', () => {
    const resource = draftToResource(draft, 'flotas')
    const nombre = resource.fields['nombre']

    expect(nombre.required).toBe(true)
    expect(nombre.vo).toMatchObject({ name: 'EmpleadoNombre', ensure: 'string', minLength: true })
    expect(nombre.table).toMatchObject({ show: true, label: 'Nombre' })
    expect(nombre.query?.searchable).toBeTruthy()
  })

  it('mapea tipos: number numeric, integer int, boolean checkbox, date date, text textarea', () => {
    const resource = draftToResource(draft, 'flotas')

    expect(resource.fields['salario'].column).toMatchObject({ type: 'numeric', transformer: 'numeric' })
    expect(resource.fields['antiguedad'].column).toMatchObject({ type: 'int' })
    expect(resource.fields['activo'].form).toMatchObject({ control: 'checkbox' })
    expect(resource.fields['fechaAlta'].column).toMatchObject({ type: 'date', tsType: 'string' })
    expect(resource.fields['notas'].form).toMatchObject({ control: 'textarea' })
  })

  it('todas las columnas son visibles en tabla y el form cubre todos los campos', () => {
    const resource = draftToResource(draft, 'flotas')
    for (const field of draft.fields) {
      expect(resource.fields[field.name].table?.show).toBe(true)
      expect(resource.fields[field.name].form?.label).toBe(field.label)
    }
  })
})

describe('newDraftResource', () => {
  it('crea una entidad con un campo nombre por defecto', () => {
    const created = newDraftResource('Vehículo')

    expect(created.name).toBe('vehiculo')
    expect(created.plural).toBe('vehiculos')
    expect(created.fields[0]).toMatchObject({ name: 'nombre', type: 'string' })
    expect(() => defineResource(draftToResource(created, 'mi-app'))).not.toThrow()
  })
})
