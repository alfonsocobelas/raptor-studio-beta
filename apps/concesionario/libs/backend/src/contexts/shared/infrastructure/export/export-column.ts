export interface ExportColumn<T> {
  key: keyof T & string
  header: string
  format?: (value: T[keyof T], row: T) => string
}
