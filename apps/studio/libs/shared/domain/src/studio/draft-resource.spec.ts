import { describe, expect, it } from 'vitest'
import { defineResource } from '@raptor/schema'
import {
  DRAFT_FIELD_TYPES,
  SELECTABLE_FIELD_TYPES,
  draftToResource,
  newDraftResource,
  type DraftResource
} from './draft-resource'

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

describe('draftToResource — campo hora (spec 65)', () => {
  it('un campo time cruza como string con control time y columna varchar(5)', () => {
    const conHora: DraftResource = {
      ...draft,
      fields: [...draft.fields, { name: 'horaEntrada', label: 'Hora de entrada', type: 'time' }]
    }

    const resource = draftToResource(conHora, 'flotas')
    const hora = resource.fields['horaEntrada']

    expect(hora.type).toBe('string')
    expect(hora.required).toBe(true)
    expect(hora.form).toMatchObject({ control: 'time', label: 'Hora de entrada' })
    expect(hora.column).toMatchObject({ type: 'varchar', length: 5 })
    expect(() => defineResource(resource)).not.toThrow()
  })

  it('el tipo hora es elegible en el panel', () => {
    expect(DRAFT_FIELD_TYPES).toContain('time')
    expect(SELECTABLE_FIELD_TYPES).toContain('time')
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

describe('draftToResource — página-formulario (spec 48)', () => {
  const draft = (extra: Partial<DraftResource> = {}): DraftResource => ({
    ...newDraftResource('Pacientes'),
    ...extra
  })

  it('sin formulario declarado no emite form', () => {
    expect(draftToResource(draft(), 'clinica').form).toBeUndefined()
  })

  it('con formulario declarado emite form vacío (mismo patrón que detail/gallery)', () => {
    expect(draftToResource(draft({ form: true }), 'clinica').form).toEqual({})
  })

  it('el resource con form sigue pasando defineResource', () => {
    expect(() => defineResource(draftToResource(draft({ form: true }), 'clinica'))).not.toThrow()
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

  it('el selector etiqueta con el campo REAL de la entidad destino, no siempre «nombre»', () => {
    const vehiculo: DraftResource = {
      ...newDraftResource('Vehículos'),
      fields: [{ name: 'matricula', label: 'Matrícula', type: 'string' }]
    }
    const reparacion: DraftResource = {
      ...newDraftResource('Reparaciones'),
      fields: [
        { name: 'descripcion', label: 'Descripción', type: 'string' },
        { name: 'vehiculo', label: 'Vehículo', type: 'ref', refTo: 'vehiculo' }
      ]
    }

    const lookup = draftToResource(reparacion, 'taller', [vehiculo]).fields['vehiculoId'].form?.lookup

    expect(lookup).toMatchObject({ resource: 'vehiculo', labelField: 'matricula' })
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

describe('draftToResource — enum (spec 22)', () => {
  const propiedad = (): DraftResource => ({
    ...newDraftResource('Propiedades'),
    fields: [
      { name: 'titulo', label: 'Título', type: 'string' },
      {
        name: 'estado',
        label: 'Estado',
        type: 'enum',
        values: [
          { value: 'disponible', label: 'Disponible' },
          { value: 'reservada', label: 'Reservada' },
          { value: 'vendida', label: 'Vendida' }
        ]
      }
    ]
  })

  it('el VO declara el conjunto cerrado de valores', () => {
    const field = draftToResource(propiedad(), 'inmo').fields['estado']

    expect(field.vo).toMatchObject({ values: ['disponible', 'reservada', 'vendida'] })
  })

  it('la columna es un badge con su mapa de etiquetas', () => {
    const field = draftToResource(propiedad(), 'inmo').fields['estado']

    expect(field.table?.type).toBe('badge')
    expect(field.table?.badgeMap?.['disponible']).toMatchObject({ label: 'Disponible' })
    expect(field.table?.badgeMap?.['vendida']).toMatchObject({ label: 'Vendida' })
  })

  it('los colores se asignan por posición: mismo diseño, mismos colores', () => {
    const first = draftToResource(propiedad(), 'inmo').fields['estado'].table?.badgeMap
    const second = draftToResource(propiedad(), 'inmo').fields['estado'].table?.badgeMap

    expect(first?.['disponible'].variant).toBe(second?.['disponible'].variant)
    expect(first?.['disponible'].variant).not.toBe(first?.['vendida'].variant)
  })

  it('el formulario ofrece un desplegable con las opciones y el primer valor por defecto', () => {
    const field = draftToResource(propiedad(), 'inmo').fields['estado']

    expect(field.form?.control).toBe('select')
    expect(field.form?.options).toEqual([
      { value: 'disponible', label: 'Disponible' },
      { value: 'reservada', label: 'Reservada' },
      { value: 'vendida', label: 'Vendida' }
    ])
    expect(field.form?.default).toContain('disponible')
  })

  it('el enum es filtrable y ordenable como cualquier columna del listado', () => {
    const field = draftToResource(propiedad(), 'inmo').fields['estado']

    expect(field.query?.filterable).toBeDefined()
  })
})

describe('newDraftResource — singular y plural en castellano (hallazgo 20)', () => {
  const casos: [string, string, string][] = [
    // etiqueta escrita, nombre singular esperado, plural esperado
    ['Propiedades', 'propiedad', 'propiedades'],
    ['Reparaciones', 'reparacion', 'reparaciones'],
    ['Animales', 'animal', 'animales'],
    ['Meses', 'mes', 'meses'],
    ['Coches', 'coche', 'coches'],
    ['Clientes', 'cliente', 'clientes'],
    ['Pacientes', 'paciente', 'pacientes'],
    // singular escrito: el plural se forma según la última letra
    ['Cliente', 'cliente', 'clientes'],
    ['Propiedad', 'propiedad', 'propiedades'],
    ['Animal', 'animal', 'animales']
  ]

  it.each(casos)('«%s» → %s / %s', (label, name, plural) => {
    const draft = newDraftResource(label)

    expect(draft.name).toBe(name)
    expect(draft.plural).toBe(plural)
  })

  it('la etiqueta singular respeta lo escrito por el usuario', () => {
    expect(newDraftResource('Propiedades').labelSingular).toBe('Propiedad')
    expect(newDraftResource('Coches').labelSingular).toBe('Coche')
  })
})

describe('el tipo uuid', () => {
  it('está en el contrato: el generador ya sabe emitir columnas uuid', () => {
    expect(DRAFT_FIELD_TYPES).toContain('uuid')
  })

  it('NO se ofrece «ref» como tipo: la referencia se elige aparte, por entidad destino', () => {
    expect(SELECTABLE_FIELD_TYPES).not.toContain('ref')
    expect(SELECTABLE_FIELD_TYPES).toContain('uuid')
  })

  it('un campo uuid emite su columna uuid, no un varchar', () => {
    const draft: DraftResource = {
      name: 'lectura',
      plural: 'lecturas',
      labelSingular: 'Lectura',
      labelPlural: 'Lecturas',
      gender: 'f',
      fields: [
        { name: 'nombre', label: 'Nombre', type: 'string' },
        { name: 'externo', label: 'Externo', type: 'uuid' }
      ]
    }

    const resource = draftToResource(draft, 'mi-app')

    expect(resource.fields['externo'].column).toMatchObject({ type: 'uuid' })
  })
})

/**
 * Spec 46: la matriz de accesos viaja tal cual del draft al resource-schema — el gate de
 * defineResource (roles legales, verbos existentes) aplica en la misma frontera que la
 * máquina de estados.
 */
describe('draftToResource — matriz de accesos (spec 46)', () => {
  const base: DraftResource = {
    name: 'factura',
    plural: 'facturas',
    labelSingular: 'Factura',
    labelPlural: 'Facturas',
    gender: 'f',
    fields: [{ name: 'nombre', label: 'Nombre', type: 'string' }]
  }

  it('copia access tal cual cuando el draft lo declara', () => {
    const draft: DraftResource = { ...base, access: { view: ['user'], manage: [] } }

    const resource = draftToResource(draft, 'mi-app')

    expect(resource.access).toEqual({ view: ['user'], manage: [] })
  })

  it('sin access no aparece la clave (ausente = política actual)', () => {
    expect('access' in draftToResource(base, 'mi-app')).toBe(false)
  })
})

describe('draftToResource — calendario (spec 59)', () => {
  const draft = (extra: Partial<DraftResource> = {}): DraftResource => ({
    ...newDraftResource('Pedidos'),
    fields: [
      { name: 'nombre', label: 'Nombre', type: 'string' },
      { name: 'entrega', label: 'Entrega', type: 'date' },
      {
        name: 'estado',
        label: 'Estado',
        type: 'enum',
        values: [
          { value: 'prevista', label: 'Entrega prevista' },
          { value: 'atencion', label: 'Requiere atención' }
        ]
      }
    ],
    ...extra
  })

  it('sin calendario declarado no emite calendar', () => {
    expect(draftToResource(draft(), 'taller').calendar).toBeUndefined()
  })

  it('con calendario emite calendar con el campo fecha elegido', () => {
    const resource = draftToResource(draft({ calendar: { dateField: 'entrega' } }), 'taller')

    expect(resource.calendar).toEqual({ date: 'entrega' })
  })

  it('la configuración completa cruza entera; weekends solo viaja cuando se apaga', () => {
    const resource = draftToResource(
      draft({ calendar: { dateField: 'entrega', labelField: 'nombre', colorField: 'estado', weekends: false } }),
      'taller'
    )

    expect(resource.calendar).toEqual({ date: 'entrega', label: 'nombre', color: 'estado', weekends: false })
  })

  it('el resource con calendario sigue pasando defineResource', () => {
    expect(() =>
      defineResource(draftToResource(draft({ calendar: { dateField: 'entrega', colorField: 'estado' } }), 'taller'))
    ).not.toThrow()
  })
})

describe('draftToResource — kanban (spec 61)', () => {
  const draft = (extra: Partial<DraftResource> = {}): DraftResource => ({
    ...newDraftResource('Pedidos'),
    fields: [
      { name: 'nombre', label: 'Nombre', type: 'string' },
      {
        name: 'estado',
        label: 'Estado',
        type: 'enum',
        values: [
          { value: 'pendiente', label: 'Pendiente' },
          { value: 'entregado', label: 'Entregado' }
        ]
      }
    ],
    ...extra
  })

  it('sin kanban declarado no emite kanban', () => {
    expect(draftToResource(draft(), 'taller').kanban).toBeUndefined()
  })

  it('con kanban emite la config con el campo de columnas y la etiqueta', () => {
    const resource = draftToResource(draft({ kanban: { field: 'estado', labelField: 'nombre' } }), 'taller')

    expect(resource.kanban).toEqual({ field: 'estado', label: 'nombre' })
  })

  it('el resource con kanban sigue pasando defineResource', () => {
    expect(() => defineResource(draftToResource(draft({ kanban: { field: 'estado' } }), 'taller'))).not.toThrow()
  })
})
