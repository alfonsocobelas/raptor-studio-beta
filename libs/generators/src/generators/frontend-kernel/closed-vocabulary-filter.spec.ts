import * as fs from 'fs'
import * as path from 'path'

/**
 * Spec 35: segundo defecto destapado por la suite del canon contra el emitido.
 *
 * Una columna con `valueMap` tiene vocabulario CERRADO igual que una de badges (el listado de
 * contratos emite `valueMap: BILLING_FREQUENCY_LABELS`). El emitido solo ofrecía desplegable
 * para `type: 'badge'`, así que para filtrar por frecuencia había que **teclear la clave
 * guardada** (`yearly`) mientras la pantalla muestra su etiqueta (`Anual`): imposible de
 * adivinar, y un `contiene` sobre una clave elegida de una lista no significa nada.
 */
describe('DataTable — filtro de vocabulario cerrado', () => {
  const template = fs.readFileSync(
    path.join(__dirname, 'files-ui', 'spartan', 'shared', 'components', 'data-table.ts.template'),
    'utf-8'
  )

  it('trata una columna con valueMap como vocabulario cerrado, no solo las de badges', () => {
    expect(template).toContain('column?.type === \'badge\' || column?.valueMap !== undefined')
  })

  it('deriva las opciones del valueMap manteniendo la clave como valor', () => {
    // el value SIEMPRE es la clave guardada: es lo que entiende el backend
    expect(template).toContain('Object.entries(column.valueMap).map(([value, label]) => ({ value, label }))')
  })

  it('fuerza la igualdad también para valueMap al añadir el filtro', () => {
    expect(template).toContain("colDef.type === 'badge' || colDef.valueMap ? 'eq' : this.filterOperator()")
  })
})
