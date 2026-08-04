import { Workbook } from 'exceljs'
import type { ExportColumn } from './export-column'

const cellValue = <T>(row: T, column: ExportColumn<T>): string | T[keyof T] => {
  const raw = row[column.key]
  if (column.format) {
    return column.format(raw, row)
  }
  return raw
}

export const toXlsx = async <T>(rows: T[], columns: ExportColumn<T>[]): Promise<Buffer> => {
  const workbook = new Workbook()
  const sheet = workbook.addWorksheet('Export')
  sheet.addRow(columns.map(column => column.header))
  for (const row of rows) {
    sheet.addRow(columns.map(column => cellValue(row, column)))
  }
  const buffer = await workbook.xlsx.writeBuffer()
  return buffer as unknown as Buffer
}
