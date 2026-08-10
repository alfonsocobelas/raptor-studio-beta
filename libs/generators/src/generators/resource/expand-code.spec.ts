import { client } from './models/client.model'
import { customer } from './models/customer.model'
import { expandCode } from './expand-code'

/**
 * Spec 19 TASK-04: `code` no se declara como campo (el schema lo prohíbe a propósito) sino
 * como intención — `code: { prefix, padding }`. El generador lo EXPANDE a un campo normal
 * antes de construir nada, y a partir de ahí toda la maquinaria existente (VO, agregado,
 * toPrimitives, DTO, columna del listado) lo trata como a cualquier otro string.
 *
 * Es el mismo principio de la regla 7: generar, no interpretar.
 */
describe('expandCode', () => {
  it('un modelo sin código sale intacto', () => {
    expect(expandCode(customer)).toBe(customer)
  })

  it('añade el campo code al modelo que lo declara', () => {
    const expanded = expandCode(client)

    expect(expanded.fields['code']).toBeDefined()
    expect(expanded.fields['code']?.type).toBe('string')
  })

  it('el código es único: es la referencia por la que se busca un registro', () => {
    expect(expandCode(client).fields['code']?.unique).toBe(true)
  })

  it('nunca es editable: se asigna al alta y no se toca más', () => {
    expect(expandCode(client).fields['code']?.updatable).toBe(false)
  })

  it('se muestra el primero en el listado, que es para lo que existe', () => {
    const column = expandCode(client).fields['code']?.table

    expect(column?.show).toBe(true)
    expect(column?.order).toBe(0)
  })

  it('no pisa el modelo original', () => {
    expandCode(client)

    expect(client.fields['code']).toBeUndefined()
  })
})
