import type { ExportColumn } from './export-column'

const BOM = '﻿'
const SEPARATOR = ';'
const LINE_BREAK = '\r\n'

const escapeCell = (value: string): string => `"${value.replace(/"/g, '""')}"`

const cellValue = <T>(row: T, column: ExportColumn<T>): string => {
  const raw = row[column.key]
  if (column.format) {
    return column.format(raw, row)
  }
  if (raw === null || raw === undefined) {
    return ''
  }
  return String(raw)
}

export const toCsv = <T>(rows: T[], columns: ExportColumn<T>[]): Buffer => {
  const header = columns.map(column => escapeCell(column.header)).join(SEPARATOR)
  const body = rows.map(row => columns.map(column => escapeCell(cellValue(row, column))).join(SEPARATOR))
  const content = BOM + [header, ...body].join(LINE_BREAK)
  return Buffer.from(content, 'utf-8')
}
