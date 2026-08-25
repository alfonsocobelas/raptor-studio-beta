import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core'
import { RegisterProjectDto } from '@app/shared/domain'
import { ProjectService, ImportFailure } from '../../../../../../core/services/project.service'
import { downloadBlob } from '../../../../../../shared/utils/download-file'
import { generateId } from '../../../../../../shared/utils/uuid'

type ColumnKind = 'text' | 'number' | 'boolean' | 'date'

/** Columnas del alta con su tipo: las cabeceras del fichero deben llamarse igual. */
const COLUMNS: { name: string; kind: ColumnKind }[] = [
  { name: 'customerId', kind: 'text' },
  { name: 'customerName', kind: 'text' },
  { name: 'name', kind: 'text' },
  { name: 'description', kind: 'text' },
  { name: 'startDate', kind: 'date' },
  { name: 'endDate', kind: 'date' },
  { name: 'status', kind: 'text' },
  { name: 'implementer', kind: 'text' }
]

/**
 * Parser CSV mínimo y sin dependencias: comillas dobles y comas. Los saltos de
 * línea DENTRO de una celda no se soportan (documentado en la spec 33).
 */
function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue
    const cells: string[] = []
    let value = ''
    let quoted = false
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (quoted) {
        if (char === '"' && line[i + 1] === '"') {
          value += '"'
          i++
        } else if (char === '"') {
          quoted = false
        } else {
          value += char
        }
      } else if (char === '"') {
        quoted = true
      } else if (char === ',') {
        cells.push(value)
        value = ''
      } else {
        value += char
      }
    }
    cells.push(value)
    rows.push(cells.map(cell => cell.trim()))
  }
  return rows
}

/**
 * Import validado por el DOMINIO (spec 33): el fichero se parsea aquí, el backend
 * valida cada fila con los value objects del alta y responde con errores por fila
 * — o importa todo en una transacción.
 */
@Component({
  selector: 'app-projects-import',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-4">
      <div>
        <h2 class="text-lg font-semibold">Importar proyectos</h2>
        <p class="text-muted-foreground text-sm">
          CSV con cabeceras exactas del alta.
          <button type="button" class="text-foreground underline underline-offset-4" (click)="template()">
            Descargar plantilla
          </button>
        </p>
      </div>

      <input
        type="file"
        accept=".csv,text/csv"
        class="app-toolbar border-input w-full rounded-md border px-3 py-2 text-sm"
        data-testid="import-file"
        (change)="onFile($event)"
      />

      @if (error()) {
        <p class="text-destructive text-sm" data-testid="import-error">{{ error() }}</p>
      }
      @if (rows().length && !error()) {
        <p class="text-muted-foreground text-sm" data-testid="import-preview">
          {{ rows().length }} filas listas para validar
        </p>
      }
      @if (failures().length) {
        <div class="app-panel border-destructive/40 max-h-48 space-y-1 overflow-y-auto rounded-md border p-3">
          @for (failure of failures(); track failure.row + failure.message) {
            <p class="text-destructive text-sm" data-testid="import-failure">
              Fila {{ failure.row }}: {{ failure.message }}
            </p>
          }
        </div>
      }
      @if (imported() !== null) {
        <p class="text-sm font-medium" data-testid="import-done">{{ imported() }} filas importadas</p>
      }

      <div class="app-toolbar flex justify-end gap-2">
        <button type="button" class="border-input rounded-md border px-3 py-2 text-sm" (click)="close.emit()">
          {{ imported() === null ? 'Cancelar' : 'Cerrar' }}
        </button>
        <button
          type="button"
          class="bg-primary text-primary-foreground rounded-md px-3 py-2 text-sm disabled:opacity-50"
          [disabled]="!rows().length || busy() || imported() !== null"
          data-testid="import-confirm"
          (click)="confirm()"
        >
          Importar
        </button>
      </div>
    </div>
  `
})
export class ProjectsImportComponent {
  private readonly _service = inject(ProjectService)

  readonly close = output<void>()

  readonly rows = signal<RegisterProjectDto[]>([])
  readonly failures = signal<ImportFailure[]>([])
  readonly error = signal('')
  readonly imported = signal<number | null>(null)
  readonly busy = signal(false)

  /** La plantilla ES el contrato: mismas cabeceras que valida el backend. */
  template(): void {
    const csv = `${COLUMNS.map(column => column.name).join(',')}\n`
    downloadBlob(new Blob([csv], { type: 'text/csv' }), 'proyectos-plantilla.csv')
  }

  async onFile(event: Event): Promise<void> {
    this.error.set('')
    this.failures.set([])
    this.imported.set(null)
    this.rows.set([])

    const file = (event.target as HTMLInputElement).files?.[0]
    if (!file) return

    const [header, ...lines] = parseCsv(await file.text())
    if (!header) {
      this.error.set('El fichero está vacío')
      return
    }
    const unknown = header.filter(name => !COLUMNS.some(column => column.name === name))
    if (unknown.length) {
      this.error.set(`Cabeceras desconocidas: ${unknown.join(', ')} — descarga la plantilla`)
      return
    }

    this.rows.set(lines.map(cells => this.toRow(header, cells)))
  }

  async confirm(): Promise<void> {
    this.busy.set(true)
    try {
      const result = await this._service.importRows(this.rows())
      this.failures.set(result.failures)
      if (!result.failures.length) this.imported.set(result.imported)
    } catch {
      this.error.set('No se pudo importar: error inesperado del servidor')
    } finally {
      this.busy.set(false)
    }
  }

  /** Cada celda se coacciona al tipo del campo; la vacía se omite (campos opcionales). */
  private toRow(header: string[], cells: string[]): RegisterProjectDto {
    const row: Record<string, unknown> = { id: generateId() }
    header.forEach((name, index) => {
      const cell = cells[index] ?? ''
      if (cell === '') return
      const kind = COLUMNS.find(column => column.name === name)?.kind ?? 'text'
      row[name] = kind === 'number' ? Number(cell) : kind === 'boolean' ? cell === 'true' || cell === '1' : cell
    })
    return row as unknown as RegisterProjectDto
  }
}
