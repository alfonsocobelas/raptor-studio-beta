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
  it('si el nombre ya viene en plural, deriva el singular (Empleados → empleado/empleados)', () => {
    const created = newDraftResource('Empleados')

    expect(created.name).toBe('empleado')
    expect(created.plural).toBe('empleados')
    expect(created.labelSingular).toBe('Empleado')
    expect(created.labelPlural).toBe('Empleados')
  })

  it('crea una entidad con un campo nombre por defecto', () => {
    const created = newDraftResource('Vehículo')

    expect(created.name).toBe('vehiculo')
    expect(created.plural).toBe('vehiculos')
    expect(created.fields[0]).toMatchObject({ name: 'nombre', type: 'string' })
    expect(() => defineResource(draftToResource(created, 'mi-app'))).not.toThrow()
  })
})

describe('draftToResource — ficha (spec 16)', () => {
  const draft = (extra: Partial<DraftResource> = {}): DraftResource => ({
    ...newDraftResource('Pacientes'),
    fields: [
      { name: 'nombre', label: 'Nombre', type: 'string' },
      { name: 'telefono', label: 'Teléfono', type: 'string' }
    ],
    ...extra
  })

  it('sin ficha declarada no emite detail', () => {
    expect(draftToResource(draft(), 'clinica').detail).toBeUndefined()
  })

  it('con ficha declarada emite detail', () => {
    expect(draftToResource(draft({ detail: true }), 'clinica').detail).toEqual({})
  })

  it('los adjuntos arrastran la ficha: sin ella no habría dónde mostrarlos', () => {
    const resource = draftToResource(draft({ attachments: true }), 'clinica')

    expect(resource.attachments).toBe(true)
    expect(resource.detail).toEqual({})
  })
})

describe('draftToResource — galería (spec 17)', () => {
  const draft = (extra: Partial<DraftResource> = {}): DraftResource => ({
    ...newDraftResource('Tratamientos'),
    fields: [
      { name: 'nombre', label: 'Nombre', type: 'string' },
      { name: 'precio', label: 'Precio', type: 'number' }
    ],
    ...extra
  })

  it('sin galería declarada no emite gallery', () => {
    expect(draftToResource(draft(), 'clinica').gallery).toBeUndefined()
  })

  it('con galería declarada emite gallery', () => {
    expect(draftToResource(draft({ gallery: true }), 'clinica').gallery).toEqual({})
  })
})

describe('draftToResource — entradilla (spec 18)', () => {
  const draft = (extra: Partial<DraftResource> = {}): DraftResource => ({
    ...newDraftResource('Pacientes'),
    ...extra
  })

  it('sin texto, la pantalla no lleva entradilla', () => {
    expect(draftToResource(draft(), 'clinica').labels?.subtitle).toBeUndefined()
  })

  it('el texto de la vista se emite como entradilla de la pantalla', () => {
    const resource = draftToResource(draft({ subtitle: 'Pacientes dados de alta este año' }), 'clinica')

    expect(resource.labels?.subtitle).toBe('Pacientes dados de alta este año')
  })
})

/**
 * Spec 15 · fase 1: una referencia dibujada se expande al par canónico del
 * resource-schema — id con relación y selector, y nombre denormalizado que es
 * lo que el usuario ve y por lo que busca (patrón de contract.customerId).
 */
describe('draftToResource — referencias entre entidades', () => {
  const cita = (): DraftResource => ({
    ...newDraftResource('Citas'),
    fields: [
      { name: 'motivo', label: 'Motivo', type: 'string' },
      { name: 'paciente', label: 'Paciente', type: 'ref', refTo: 'paciente' }
    ]
  })

  const fields = () => draftToResource(cita(), 'vetcare').fields

  it('emite el campo id con su relación y lo hace filtrable', () => {
    const id = fields()['pacienteId']

    expect(id).toMatchObject({
      type: 'uuid',
      required: true,
      relation: { to: 'paciente', kind: 'reference' }
    })
    expect(id.query?.filterable).toBeTruthy()
  })

  it('el formulario ofrece un selector alimentado por la otra entidad', () => {
    expect(fields()['pacienteId'].form).toMatchObject({
      control: 'select',
      label: 'Paciente',
      lookup: { resource: 'paciente', labelField: 'nombre', denormalizes: 'pacienteName' }
    })
  })

  it('emite el nombre denormalizado: es lo que se ve en la tabla y por lo que se busca', () => {
    const name = fields()['pacienteName']

    expect(name).toMatchObject({ type: 'string', required: true })
    expect(name.table).toMatchObject({ show: true, label: 'Paciente' })
    expect(name.query?.searchable).toBeTruthy()
  })

  it('el id NO se muestra en la tabla: el usuario ve nombres, no uuids', () => {
    expect(fields()['pacienteId'].table?.show).toBeFalsy()
  })

  it('declara la constraint del nombre con la clave que usa el lengthConst', () => {
    const resource = draftToResource(cita(), 'vetcare')
    const lengthConst = resource.fields['pacienteName'].column?.lengthConst

    expect(lengthConst).toBe('PACIENTE_NAME.MAX')
    expect(resource.constraints?.['PACIENTE_NAME']).toEqual({ MAX: 200 })
  })

  it('no emite un campo suelto con el nombre del draft', () => {
    expect(fields()['paciente']).toBeUndefined()
  })
})
