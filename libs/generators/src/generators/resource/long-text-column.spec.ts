import { renderFrontendColumns } from './build-substitutions'
import type { ResourceDefinition } from '@raptor/schema'

/**
 * Spec 54: `draftToResource` reparte `minWidth: 120` a todos los campos por igual, sin
 * distinguir que uno de ellos es de 2000 caracteres. Resultado en la demo taller: la columna
 * «Avería que cuenta el cliente» crecía hasta empujar el importe y la garantía fuera de la
 * pantalla. Quien sabe que un campo es de texto largo es su control de formulario.
 */
describe('columnas de texto largo', () => {
  const resource = (fields: Record<string, unknown>, virtuals?: Record<string, unknown>) =>
    ({
      schemaVersion: 1,
      name: 'orden',
      plural: 'ordenes',
      context: 'taller',
      schemaName: 'taller',
      fields: { id: { type: 'uuid', pk: true }, ...fields },
      ...(virtuals ? { list: { virtualColumns: virtuals } } : {})
    }) as unknown as ResourceDefinition

  const textarea = {
    type: 'string',
    form: { control: 'textarea', label: 'Avería' },
    table: { show: true, order: 1, label: 'Avería' }
  }
  const texto = {
    type: 'string',
    form: { control: 'text', label: 'Referencia' },
    table: { show: true, order: 2, label: 'Referencia' }
  }

  it('un campo que se edita en textarea trae su techo puesto', () => {
    const [averia] = renderFrontendColumns(resource({ averia: textarea }))

    expect(averia).toContain('maxWidth: 280')
  })

  it('una columna normal no lleva techo: el ancho lo sigue mandando su contenido', () => {
    const [, referencia] = renderFrontendColumns(resource({ averia: textarea, referencia: texto }))

    expect(referencia).not.toContain('maxWidth')
  })

  it('el techo declarado en el modelo gana al de la política', () => {
    const [averia] = renderFrontendColumns(
      resource({ averia: { ...textarea, table: { ...textarea.table, maxWidth: 420 } } })
    )

    expect(averia).toContain('maxWidth: 420')
    expect(averia).not.toContain('maxWidth: 280')
  })

  // Una columna calculada no tiene campo detrás, así que nadie puede deducir si es texto
  // largo: lo dice su autora o no lo tiene.
  it('una columna virtual no recibe techo por la política', () => {
    const columns = renderFrontendColumns(resource({}, { resumen: { show: true, order: 1, label: 'Resumen' } }))

    expect(columns.join('\n')).not.toContain('maxWidth')
  })
})
