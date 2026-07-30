import { formatDate } from '@angular/common'
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
  LOCALE_ID,
  OnDestroy,
  output,
  signal
} from '@angular/core'
import { FormsModule } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MatCheckboxModule } from '@angular/material/checkbox'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatInputModule } from '@angular/material/input'
import { MatMenuModule } from '@angular/material/menu'
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator'
import { MatSelectModule } from '@angular/material/select'
import { MatSortModule, Sort } from '@angular/material/sort'
import { MatTableModule } from '@angular/material/table'
import { MatTooltipModule } from '@angular/material/tooltip'
import { NgIcon, provideIcons } from '@ng-icons/core'
import { lucideFunnel, lucidePencil, lucideTrash2, lucideEye, lucideX } from '@ng-icons/lucide'
import { ExportFormat } from '@app/shared/domain'
import { downloadBlob } from '../utils/download-file'

export interface ColumnDef {
  key: string
  label: string
  /** Campo por el que ordena en servidor cuando difiere de la clave mostrada */
  sortField?: string
  sortable?: boolean
  filterable?: boolean
  type?: 'text' | 'number' | 'date' | 'badge' | 'badges'
  badgeMap?: Record<string, { label: string; variant: string }>
  valueMap?: Record<string, string>
  minWidth?: number
}

export interface ColumnFilter {
  column: string
  columnLabel: string
  operator: string
  value: string
}

export interface TableAction {
  icon: string
  label: string
  action: string
  variant?: string
  hidden?: (row: Record<string, unknown>) => boolean
}

export interface SortOrder {
  orderBy: string
  orderType: 'asc' | 'desc'
}

const SEARCH_DEBOUNCE_MS = 300
const OPERATOR_LABELS: Record<string, string> = {
  contains: 'contiene',
  eq: 'es igual a',
  starts_with: 'empieza por',
  ends_with: 'termina por',
  gt: 'mayor que',
  lt: 'menor que'
}

/**
 * Tabla de datos (piel Material). Misma API pública que la implementación Spartan:
 * las pantallas generadas no cambian al cambiar de librería (ADR-003, nivel 1).
 */
@Component({
  selector: 'app-data-table',
  imports: [
    FormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatMenuModule,
    MatPaginatorModule,
    MatSelectModule,
    MatSortModule,
    MatTableModule,
    MatTooltipModule,
    NgIcon
  ],
  providers: [provideIcons({ lucideFunnel, lucidePencil, lucideTrash2, lucideEye, lucideX })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-4">
      <div class="flex flex-wrap items-center gap-2">
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="min-w-64 flex-1">
          <input matInput type="search" placeholder="Buscar en todas las columnas..." [(ngModel)]="searchTerm" />
        </mat-form-field>

        <span class="flex-1"></span>

        @if (showCreate()) {
          <button matButton="filled" (click)="create.emit()">{{ createLabel() }}</button>
        }

        <button matButton="outlined" [matMenuTriggerFor]="filterMenu">
          <ng-icon name="lucideFunnel" size="16" /> Filtros
        </button>
        <mat-menu #filterMenu="matMenu" class="p-2">
          <div class="flex w-80 flex-col gap-2 p-3" (click)="$event.stopPropagation()">
            <mat-form-field appearance="outline" subscriptSizing="dynamic">
              <mat-label>Columna</mat-label>
              <mat-select [(ngModel)]="filterColumn">
                @for (column of filterableColumns(); track column.key) {
                  <mat-option [value]="column.key">{{ column.label }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline" subscriptSizing="dynamic">
              <mat-label>Operador</mat-label>
              <mat-select [(ngModel)]="filterOperator">
                @for (operator of operators; track operator) {
                  <mat-option [value]="operator">{{ operatorLabel(operator) }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline" subscriptSizing="dynamic">
              <mat-label>Valor</mat-label>
              <input matInput [(ngModel)]="filterValue" />
            </mat-form-field>
            <button matButton="filled" [disabled]="!filterColumn() || !filterValue()" (click)="addFilter()">
              Añadir filtro
            </button>
          </div>
        </mat-menu>

        <button matButton="outlined" [matMenuTriggerFor]="columnMenu">Columnas</button>
        <mat-menu #columnMenu="matMenu">
          <div class="flex flex-col p-2" (click)="$event.stopPropagation()">
            @for (column of columns(); track column.key) {
              <mat-checkbox [checked]="isVisible(column.key)" (change)="toggleColumn(column.key)">
                {{ column.label }}
              </mat-checkbox>
            }
          </div>
        </mat-menu>

        <button matButton="outlined" [matMenuTriggerFor]="exportMenu">Exportar</button>
        <mat-menu #exportMenu="matMenu">
          <button mat-menu-item (click)="exportAs('csv')">CSV</button>
          <button mat-menu-item (click)="exportAs('xlsx')">Excel</button>
        </mat-menu>
      </div>

      @if (activeFilters().length) {
        <div class="flex flex-wrap gap-2">
          @for (filter of activeFilters(); track filter.column + filter.operator + filter.value) {
            <span class="bg-surface-variant flex items-center gap-1 rounded-full border px-3 py-1 text-sm">
              {{ filter.columnLabel }} {{ operatorLabel(filter.operator) }} "{{ filter.value }}"
              <button type="button" class="ml-1" (click)="removeFilter(filter)" aria-label="Quitar filtro">
                <ng-icon name="lucideX" size="14" />
              </button>
            </span>
          }
        </div>
      }

      <div class="overflow-x-auto rounded-xl border">
        <table mat-table [dataSource]="rows()" matSort (matSortChange)="onSort($event)" class="w-full">
          @if (showActions()) {
            <ng-container matColumnDef="__actions">
              <th mat-header-cell *matHeaderCellDef>Acciones</th>
              <td mat-cell *matCellDef="let row">
                <div class="flex items-center gap-1">
                  @for (action of resolvedActions(); track action.action) {
                  @if (!action.hidden || !action.hidden(row)) {
                    <button
                      matIconButton
                      class="text-muted-foreground"
                      [matTooltip]="action.label"
                      [attr.aria-label]="action.label"
                      (click)="actionClick.emit({ action: action.action, row })"
                    >
                      <ng-icon [name]="action.icon" size="16" />
                      </button>
                    }
                  }
                </div>
              </td>
            </ng-container>
          }

          @for (column of visibleColumns(); track column.key) {
            <ng-container [matColumnDef]="column.key">
              <th mat-header-cell *matHeaderCellDef [mat-sort-header]="column.key" [disabled]="column.sortable === false">
                {{ column.label }}
              </th>
              <td mat-cell *matCellDef="let row" [style.min-width.px]="column.minWidth">
                @switch (column.type) {
                  @case ('badge') {
                    <span class="rounded-full border px-2.5 py-1 text-xs font-medium" [class]="badgeClass(column, row)">
                      {{ badgeLabel(column, row) }}
                    </span>
                  }
                  @case ('badges') {
                    @for (item of badgeList(column, row); track item) {
                      <span class="bg-muted text-muted-foreground mr-1 rounded-full border border-transparent px-2.5 py-1 text-xs font-medium">{{ item }}</span>
                    }
                  }
                  @default {
                    {{ cellText(column, row) }}
                  }
                }
              </td>
            </ng-container>
          }

          <tr mat-header-row *matHeaderRowDef="displayedColumns()"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns()"></tr>
        </table>

        @if (loading()) {
          <p class="p-8 text-center text-sm opacity-70">Cargando…</p>
        } @else if (!rows().length) {
          <p class="p-8 text-center text-sm opacity-70">No hay registros que mostrar.</p>
        }
      </div>

      <mat-paginator
        [length]="totalRows()"
        [pageIndex]="pageIndex()"
        [pageSize]="pageSize()"
        [pageSizeOptions]="[5, 10, 20, 50]"
        (page)="onPage($event)"
      />
    </div>
  `
})
export class DataTable implements OnDestroy {
  private readonly _locale = inject(LOCALE_ID)

  readonly columns = input.required<ColumnDef[]>()
  readonly data = input.required<Record<string, unknown>[]>()
  readonly trackByFn = input<(row: Record<string, unknown>) => unknown>(row => row['id'])
  readonly showCreate = input(false)
  readonly createLabel = input('Crear')
  readonly showActions = input(true)
  readonly actions = input<TableAction[]>([{ icon: 'lucideEye', label: 'Ver ficha', action: 'view' }])
  readonly exportFilename = input('export')
  readonly initialStickyColumns = input<string[]>([])
  readonly serverSide = input(false)
  readonly total = input<number | null>(null)
  readonly loading = input(false)
  readonly page = input<number | null>(null)
  readonly pageSizeInput = input<number | null>(null, { alias: 'pageSize' })
  readonly sortColumnInput = input('', { alias: 'sortColumn' })
  readonly sortDirectionInput = input<'asc' | 'desc'>('asc', { alias: 'sortDirection' })
  readonly searchInput = input('', { alias: 'search' })

  readonly create = output<void>()
  readonly actionClick = output<{ action: string; row: Record<string, unknown> }>()
  readonly pageChange = output<number>()
  readonly pageSizeChange = output<number>()
  readonly sortChange = output<SortOrder | null>()
  readonly filtersChange = output<ColumnFilter[]>()
  readonly searchChange = output<string>()
  readonly exportRequested = output<ExportFormat>()

  protected readonly operators = Object.keys(OPERATOR_LABELS)
  protected readonly searchTerm = linkedSignal(() => this.searchInput())
  protected readonly filterColumn = signal('')
  protected readonly filterOperator = signal('contains')
  protected readonly filterValue = signal('')
  protected readonly activeFilters = signal<ColumnFilter[]>([])
  private readonly _hidden = signal<Set<string>>(new Set())
  private _searchTimer: ReturnType<typeof setTimeout> | undefined

  constructor() {
    // El servidor no debe recibir una petición por pulsación.
    effect(() => {
      const term = this.searchTerm()
      clearTimeout(this._searchTimer)
      this._searchTimer = setTimeout(() => {
        if (term !== this.searchInput()) {
          this.searchChange.emit(term)
        }
      }, SEARCH_DEBOUNCE_MS)
    })
  }

  ngOnDestroy(): void {
    clearTimeout(this._searchTimer)
  }

  protected readonly filterableColumns = computed(() => this.columns().filter(column => column.filterable))
  protected readonly visibleColumns = computed(() => this.columns().filter(column => !this._hidden().has(column.key)))
  protected readonly displayedColumns = computed(() => [
    ...(this.showActions() ? ['__actions'] : []),
    ...this.visibleColumns().map(column => column.key)
  ])
  protected readonly resolvedActions = computed(() => this.actions())
  protected readonly totalRows = computed(() => this.total() ?? this.data().length)
  protected readonly pageSize = computed(() => this.pageSizeInput() ?? 10)
  protected readonly pageIndex = computed(() => (this.page() ?? 1) - 1)

  /** En modo servidor la tabla pinta lo que recibe; en local filtra y pagina ella. */
  protected readonly rows = computed(() => {
    if (this.serverSide()) {
      return this.data()
    }
    let result = this.applyFilters(this.data())
    const term = this.searchTerm().trim().toLowerCase()
    if (term) {
      result = result.filter(row =>
        this.columns().some(column => String(this.cellValue(column.key, row)).toLowerCase().includes(term))
      )
    }
    const start = this.pageIndex() * this.pageSize()
    return result.slice(start, start + this.pageSize())
  })

  protected isVisible(key: string): boolean {
    return !this._hidden().has(key)
  }

  protected toggleColumn(key: string): void {
    this._hidden.update(hidden => {
      const next = new Set(hidden)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  protected operatorLabel(operator: string): string {
    return OPERATOR_LABELS[operator] ?? operator
  }

  protected addFilter(): void {
    const column = this.columns().find(c => c.key === this.filterColumn())
    if (!column) {
      return
    }
    // Las columnas de badge tienen un conjunto cerrado de valores: la igualdad es lo único sensato.
    const operator = column.type === 'badge' ? 'eq' : this.filterOperator()
    this.activeFilters.update(filters => [
      ...filters,
      { column: column.key, columnLabel: column.label, operator, value: this.filterValue() }
    ])
    this.filterValue.set('')
    this.filtersChange.emit(this.activeFilters())
  }

  protected removeFilter(filter: ColumnFilter): void {
    this.activeFilters.update(filters => filters.filter(f => f !== filter))
    this.filtersChange.emit(this.activeFilters())
  }

  protected onSort(sort: Sort): void {
    if (!sort.direction) {
      return void this.sortChange.emit(null)
    }
    const column = this.columns().find(c => c.key === sort.active)
    this.sortChange.emit({ orderBy: column?.sortField ?? sort.active, orderType: sort.direction })
  }

  protected onPage(event: PageEvent): void {
    if (event.pageSize !== this.pageSize()) {
      return void this.pageSizeChange.emit(event.pageSize)
    }
    this.pageChange.emit(event.pageIndex + 1)
  }

  protected exportAs(format: ExportFormat): void {
    if (this.serverSide()) {
      return void this.exportRequested.emit(format)
    }
    const header = this.visibleColumns().map(column => `"${column.label}"`).join(';')
    const body = this.rows().map(row =>
      this.visibleColumns().map(column => `"${this.cellText(column, row)}"`).join(';')
    )
    const blob = new Blob([`﻿${[header, ...body].join('\n')}`], { type: 'text/csv;charset=utf-8' })
    downloadBlob(blob, `${this.exportFilename()}.csv`)
  }

  protected cellText(column: ColumnDef, row: Record<string, unknown>): string {
    const value = this.cellValue(column.key, row)
    if (value === null || value === undefined || value === '') {
      return ''
    }
    if (column.type === 'date') {
      return formatDate(String(value), 'dd/MM/yyyy', this._locale)
    }
    if (column.valueMap) {
      return column.valueMap[String(value)] ?? String(value)
    }
    return String(value)
  }

  /** La variante del modelo (default/secondary/outline) se pinta con los tonos del tema. */
  protected badgeClass(column: ColumnDef, row: Record<string, unknown>): string {
    const value = String(this.cellValue(column.key, row))
    const variant = column.badgeMap?.[value]?.variant ?? 'outline'
    if (variant === 'default') {
      return 'bg-accent text-accent-foreground border-transparent'
    }
    if (variant === 'secondary') {
      return 'bg-muted text-muted-foreground border-transparent'
    }
    return 'text-muted-foreground'
  }

  protected badgeLabel(column: ColumnDef, row: Record<string, unknown>): string {
    const value = String(this.cellValue(column.key, row))
    return column.badgeMap?.[value]?.label ?? value
  }

  protected badgeList(column: ColumnDef, row: Record<string, unknown>): string[] {
    const value = this.cellValue(column.key, row)
    if (!Array.isArray(value)) {
      return []
    }
    return value.map(item => column.badgeMap?.[String(item)]?.label ?? String(item))
  }

  private cellValue(key: string, row: Record<string, unknown>): unknown {
    return row[key]
  }

  private applyFilters(rows: Record<string, unknown>[]): Record<string, unknown>[] {
    let result = rows
    for (const filter of this.activeFilters()) {
      result = result.filter(row => {
        const value = String(this.cellValue(filter.column, row)).toLowerCase()
        const target = filter.value.toLowerCase()
        switch (filter.operator) {
          case 'contains':
            return value.includes(target)
          case 'eq':
            return value === target
          case 'starts_with':
            return value.startsWith(target)
          case 'ends_with':
            return value.endsWith(target)
          case 'gt':
            return value > target
          case 'lt':
            return value < target
          default:
            return true
        }
      })
    }
    return result
  }
}
