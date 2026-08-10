import { renderFrontendColumns } from './build-substitutions'
import * as fs from 'fs'
import * as path from 'path'
import type { ResourceDefinition } from '@acc/schema'

/**
 * Defecto 17 (visto en motorhub): «Terminada» salía como true/false en el
 * listado mientras la ficha ya decía Sí/No. El mismo dato, dos formatos.
 */
describe('columnas booleanas', () => {
  const conBooleano = {
    schemaVersion: 1,
    name: 'reparacion',
    plural: 'reparaciones',
    context: 'taller',
    schemaName: 'taller',
    fields: {
      id: { type: 'uuid', pk: true },
      terminada: { type: 'boolean', table: { show: true, order: 1, label: 'Terminada' } }
    }
  } as unknown as ResourceDefinition

  it('la columna declara su tipo para que la tabla la formatee', () => {
    expect(renderFrontendColumns(conBooleano).join('\n')).toContain("type: 'boolean'")
  })

  it('la DataTable pinta Sí/No en las celdas booleanas', () => {
    const template = fs.readFileSync(
      path.join(
        __dirname,
        '..',
        'frontend-kernel',
        'files-ui',
        'spartan',
        'shared',
        'components',
        'data-table.ts.template'
      ),
      'utf-8'
    )

    expect(template).toContain("type === 'boolean'")
    expect(template).toContain("'Sí'")
  })
})
