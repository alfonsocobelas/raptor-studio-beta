import * as fs from 'fs'
import * as path from 'path'

/**
 * Spec 35: destapado al correr contra el emitido la suite de data-table del canon.
 *
 * Una columna puede mostrarse por una clave y ordenarse por otra (`sortField`: la columna
 * formateada `pctFmt` ordena por el numérico `pct`). Hacia fuera ya se traducía; hacia dentro
 * no: el host devuelve `[sortColumn]="pct"` (lo que guarda en su request) y la tabla lo
 * comparaba con las claves de columna, así que **la flecha de orden desaparecía y el segundo
 * clic reiniciaba en `asc`** en vez de invertir.
 */
describe('DataTable — espejo de sortField (modo servidor)', () => {
  const template = (skin: string): string =>
    fs.readFileSync(
      path.join(__dirname, 'files-ui', skin, 'shared', 'components', 'data-table.ts.template'),
      'utf-8'
    )

  it('spartan resuelve el sortField recibido de vuelta a la clave de su columna', () => {
    expect(template('spartan')).toContain('c.sortField === orderBy')
  })

  it('spartan sigue traduciendo la clave a sortField al emitir el orden', () => {
    expect(template('spartan')).toContain('?.sortField ?? this.sortColumn()')
  })
})
