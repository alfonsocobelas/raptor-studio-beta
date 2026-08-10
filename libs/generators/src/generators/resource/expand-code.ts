import { names } from '@nx/devkit'
import type { ResourceDefinition } from '@acc/schema'

/** Ancho de la columna: el mismo criterio (y motivo) que la migración. */
const CODE_MAX_LENGTH = 50

/**
 * Expande `code: { prefix, padding }` a un campo `code` normal del modelo (spec 19).
 *
 * El resource-schema PROHÍBE declarar un campo `code` a mano a propósito: el código de
 * negocio se declara como intención, no como columna. Aquí esa intención se convierte en un
 * campo string corriente, y a partir de ese punto toda la maquinaria que ya existe —VO,
 * miembro del agregado, `toPrimitives`, DTO, columna del listado— lo trata como a cualquier
 * otro. Es la regla 7 aplicada: generar, no interpretar.
 *
 * Lo que el campo NO es: editable. Se asigna en el alta (por la secuencia o respetando el que
 * venga de una importación, §2.bis) y no se vuelve a tocar.
 */
export function expandCode(definition: ResourceDefinition): ResourceDefinition {
  if (!definition.code) {
    return definition
  }

  const className = names(definition.name).className

  return {
    ...definition,
    fields: {
      ...definition.fields,
      code: {
        type: 'string',
        // SIEMPRE tiene valor en base: si el alta no lo trae, lo pone la secuencia. Esto lo
        // distingue de un unique opcional (que iría como índice parcial `WHERE code <> ''`)
        // y hace que la restricción sea un UNIQUE de tabla, que es lo que queremos.
        required: true,
        // única: es la referencia por la que un humano busca el registro, y la última
        // defensa contra un código importado que choque con otro ya presente
        unique: true,
        // se asigna al alta y jamás se edita: no entra en el update ni en el formulario
        updatable: false,
        // el backend lo pone si el alta no lo trae; una importación SÍ puede traerlo (§2.bis)
        serverAssigned: true,
        vo: {
          name: `${className}Code`,
          // en inglés como el resto de VOs del canon ('Customer city'), no la etiqueta en español
        fieldName: `${className} code`,
          lengthRule: 'max',
          constraintKey: 'CODE'
        },
        column: { type: 'varchar', length: CODE_MAX_LENGTH },
        // primera columna del listado: es para lo que existe
        table: { show: true, order: 0, label: 'Código' },
        query: { filterable: 1, searchable: 1 }
      }
    },
    constraints: {
      ...definition.constraints,
      CODE: { MAX: CODE_MAX_LENGTH }
    }
  }
}
