import { formatDate, NgTemplateOutlet } from '@angular/common'
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
import { NgIcon, provideIcons } from '@ng-icons/core'
import {
  lucideArrowDown,
  lucideArrowUp,
  lucideArrowUpDown,
  lucideCheck,
  lucideChevronLeft,
  lucideChevronRight,
  lucideColumns3,
  lucideDownload,
  lucideFilter,
  lucideLock,
  lucideLockOpen,
  lucidePencil,
  lucidePlus,
  lucideSearch,
  lucideTrash2,
  lucideX
} from '@ng-icons/lucide'
import { HlmBadgeImports } from '@spartan-ng/helm/badge'
import { HlmButtonImports } from '@spartan-ng/helm/button'
import { HlmCheckboxImports } from '@spartan-ng/helm/checkbox'
import { HlmInputImports } from '@spartan-ng/helm/input'
import { HlmPopoverImports } from '@spartan-ng/helm/popover'
import { HlmSelectImports } from '@spartan-ng/helm/select'
import { HlmSeparatorImports } from '@spartan-ng/helm/separator'
import { HlmTableImports } from '@spartan-ng/helm/table'
import { HlmTooltipImports } from '@spartan-ng/helm/tooltip'
import { ExportFormat } from '@app/shared/domain'
import { downloadBlob } from '../utils/download-file'

export interface ColumnDef {
  key: string
  label: string
  // Field to sort by in server-side mode when it differs from the display key (e.g. a formatted
  // column 'pctFmt' that must sort by its numeric backing field 'pct'). Defaults to key.
  sortField?: string
  sortable?: boolean
  filterable?: boolean
  // 'badges': el valor de la celda es un ARRAY y se pinta un badge por elemento (spec 39)
  type?: 'text' | 'number' | 'date' | 'boolean' | 'badge' | 'badges'
  badgeMap?: Record<string, { label: string; variant: string }>
  // Etiqueta de presentación por valor para celdas de texto (ej. 'yearly' → 'Anual'); fallback al valor crudo
  valueMap?: Record<string, string>
  minWidth?: number
  // Techo de ancho: la celda corta con elipsis y da el texto completo en el tooltip (spec 54).
  // Sin techo una columna de texto largo crece hasta empujar los demás datos fuera de la pantalla.
  maxWidth?: number
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
  /** Botón con el texto visible (estilo de la referencia) en vez de icono con tooltip. */
  showLabel?: boolean
  // Oculta la acción para las filas que cumplan el predicado (spec 46: borrar no aplica a ME_SAP).
  hidden?: (row: Record<string, unknown>) => boolean
}

interface ColumnOrderItem {
  key: string
  label: string
  visible: boolean
  sticky: boolean
}

// Payload emitted by (sortChange) in server-side mode; reused by the list services' request.
export interface SortOrder {
  orderBy: string
  orderType: 'asc' | 'desc'
}

const ACTION_COL_WIDTH = 90
const DEFAULT_COL_WIDTH = 150
const SEARCH_DEBOUNCE_MS = 300

const FILTER_OPERATOR_LABELS: Record<string, string> = {
  contains: 'Contiene',
  eq: 'Igual a',
  starts_with: 'Empieza por',
  ends_with: 'Termina en',
  gt: 'Mayor que',
  lt: 'Menor que'
}

@Component({
  selector: 'app-data-table',
  imports: [
    NgTemplateOutlet,
    FormsModule,
    NgIcon,
    HlmTableImports,
    HlmButtonImports,
    HlmInputImports,
    HlmBadgeImports,
    HlmPopoverImports,
    HlmCheckboxImports,
    HlmSelectImports,
    HlmSeparatorImports,
    HlmTooltipImports
  ],
  providers: [
    provideIcons({
      lucideArrowUpDown,
      lucideArrowUp,
      lucideArrowDown,
      lucideFilter,
      lucideColumns3,
      lucideDownload,
      lucideSearch,
      lucidePencil,
      lucideTrash2,
      lucideX,
      lucidePlus,
      lucideCheck,
      lucideChevronLeft,
      lucideChevronRight,
      lucideLock,
      lucideLockOpen
    })
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Toolbar -->
    <div class="flex flex-col gap-3 pb-4 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex flex-1 flex-wrap items-center gap-3">
        <div class="relative max-w-sm flex-1">
          <ng-icon name="lucideSearch" class="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2 text-sm" />
          <input
            class="h-9 w-full pr-9 pl-9"
            [ngModel]="globalSearch()"
            hlmInput
            placeholder="Buscar en todas las columnas..."
            (ngModelChange)="onSearchChange($event)"
          />
          @if (globalSearch()) {
            <button
              class="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
              type="button"
              aria-label="Borrar búsqueda"
              (click)="onSearchChange('')"
            >
              <ng-icon name="lucideX" class="text-sm" />
            </button>
          }
        </div>
        <!-- Slot para controles del host (ej. toggles que modifican el dataset) junto al buscador -->
        <ng-content select="[toolbar]" />
      </div>
      <div class="flex flex-wrap items-center gap-2">
        @if (showCreate()) {
          <button hlmBtn size="sm" (click)="create.emit()">
            <ng-icon name="lucidePlus" class="mr-1" />
            {{ createLabel() }}
          </button>
        }

        <!-- Column filters popover (available in both modes; hidden when no column is filterable) -->
        @if (filterableColumns().length) {
          <hlm-popover>
            <button class="relative" hlmPopoverTrigger hlmBtn variant="outline" size="sm">
              <ng-icon name="lucideFilter" class="mr-1" />
              Filtros
              @if (activeFilters().length) {
                <span
                  class="bg-primary text-primary-foreground ml-1.5 inline-flex size-5 items-center justify-center rounded-full text-[10px] font-bold"
                >
                  {{ activeFilters().length }}
                </span>
              }
            </button>
            <hlm-popover-content *hlmPopoverPortal class="w-80 p-4">
              <div class="space-y-3">
                <h4 class="text-sm font-medium">Añadir filtro</h4>
                <div class="space-y-2">
                  <!-- Labels sr-only: role=combobox no toma nombre accesible de su contenido -->
                  <label class="sr-only" for="dt-filter-column">Columna</label>
                  <hlm-select
                    [ngModel]="filterColumn()"
                    [itemToString]="filterColumnToLabel"
                    (ngModelChange)="filterColumn.set($event)"
                  >
                    <hlm-select-trigger buttonId="dt-filter-column">
                      <hlm-select-value placeholder="Seleccionar columna" />
                    </hlm-select-trigger>
                    <hlm-select-content *hlmSelectPortal>
                      @for (col of filterableColumns(); track col.key) {
                        <hlm-select-item [value]="col.key">{{ col.label }}</hlm-select-item>
                      }
                    </hlm-select-content>
                  </hlm-select>
                  @if (!isBadgeFilter()) {
                    <label class="sr-only" for="dt-filter-operator">Operador</label>
                    <hlm-select
                      [ngModel]="filterOperator()"
                      [itemToString]="filterOperatorToLabel"
                      (ngModelChange)="filterOperator.set($event)"
                    >
                      <hlm-select-trigger buttonId="dt-filter-operator">
                        <hlm-select-value />
                      </hlm-select-trigger>
                      <hlm-select-content *hlmSelectPortal>
                        <hlm-select-item value="contains">Contiene</hlm-select-item>
                        <hlm-select-item value="eq">Igual a</hlm-select-item>
                        <hlm-select-item value="starts_with">Empieza por</hlm-select-item>
                        <hlm-select-item value="ends_with">Termina en</hlm-select-item>
                        <hlm-select-item value="gt">Mayor que</hlm-select-item>
                        <hlm-select-item value="lt">Menor que</hlm-select-item>
                      </hlm-select-content>
                    </hlm-select>
                  }
                  @if (isBadgeFilter()) {
                    <label class="sr-only" for="dt-filter-value">Valor</label>
                    <hlm-select
                      [ngModel]="filterValue()"
                      [itemToString]="badgeValueToLabel"
                      (ngModelChange)="filterValue.set($event)"
                    >
                      <hlm-select-trigger buttonId="dt-filter-value">
                        <hlm-select-value placeholder="Seleccionar valor" />
                      </hlm-select-trigger>
                      <hlm-select-content *hlmSelectPortal>
                        @for (opt of badgeOptions(); track opt.value) {
                          <hlm-select-item [value]="opt.value">{{ opt.label }}</hlm-select-item>
                        }
                      </hlm-select-content>
                    </hlm-select>
                  } @else {
                    <input
                      class="h-9 w-full"
                      [ngModel]="filterValue()"
                      hlmInput
                      placeholder="Valor..."
                      (ngModelChange)="filterValue.set($event)"
                    />
                  }
                  <button
                    class="w-full"
                    [disabled]="!filterColumn() || !filterValue()"
                    hlmBtn
                    size="sm"
                    (click)="addFilter()"
                  >
                    Añadir filtro
                  </button>
                </div>
                @if (activeFilters().length) {
                  <hlm-separator />
                  <div class="space-y-2">
                    <h4 class="text-sm font-medium">Filtros activos</h4>
                    @for (filter of activeFilters(); track $index) {
                      <div class="flex items-center justify-between gap-2 rounded-md border px-2 py-1.5 text-xs">
                        <span class="truncate">
                          <span class="font-medium">{{ filter.columnLabel }}</span>
                          {{ operatorLabel(filter.operator) }}
                          <span class="font-medium">{{ filter.value }}</span>
                        </span>
                        <button hlmBtn variant="ghost" size="icon-xs" (click)="removeFilter($index)">
                          <ng-icon name="lucideX" />
                        </button>
                      </div>
                    }
                    <button class="w-full" hlmBtn variant="outline" size="sm" (click)="clearFilters()">
                      Limpiar filtros
                    </button>
                  </div>
                }
              </div>
            </hlm-popover-content>
          </hlm-popover>
        }

        <!-- Columns visibility/reorder/lock -->
        <hlm-popover>
          <button hlmPopoverTrigger hlmBtn variant="outline" size="sm">
            <ng-icon name="lucideColumns3" class="mr-1" />
            Columnas
          </button>
          <hlm-popover-content *hlmPopoverPortal class="w-72 p-4">
            <div class="space-y-3">
              <h4 class="text-sm font-medium">Gestionar columnas</h4>
              <div class="space-y-1">
                @for (col of columnOrder(); track col.key; let i = $index) {
                  <div class="hover:bg-accent flex items-center gap-1.5 rounded-md px-2 py-1.5 transition-colors">
                    <hlm-checkbox [checked]="col.visible" (checkedChange)="toggleColumnVisibility(col.key)" />
                    <span class="flex-1 truncate text-sm">{{ col.label }}</span>
                    <button
                      class="inline-flex size-6 items-center justify-center rounded-full transition-colors"
                      [class]="
                        col.sticky
                          ? 'bg-foreground/8 text-foreground hover:bg-foreground/15'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      "
                      [title]="col.sticky ? 'Desbloquear' : 'Bloquear'"
                      (click)="toggleColumnSticky(col.key)"
                    >
                      @if (col.sticky) {
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="13"
                          height="13"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        >
                          <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                      } @else {
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="13"
                          height="13"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        >
                          <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                        </svg>
                      }
                    </button>
                    <div class="flex gap-0.5">
                      <button
                        class="text-muted-foreground hover:bg-muted hover:text-foreground inline-flex size-6 items-center justify-center rounded text-xs transition-colors disabled:pointer-events-none disabled:opacity-30"
                        [disabled]="i === 0"
                        (click)="moveColumn(i, i - 1)"
                        title="Subir"
                      >
                        &#x25B2;
                      </button>
                      <button
                        class="text-muted-foreground hover:bg-muted hover:text-foreground inline-flex size-6 items-center justify-center rounded text-xs transition-colors disabled:pointer-events-none disabled:opacity-30"
                        [disabled]="i === columnOrder().length - 1"
                        (click)="moveColumn(i, i + 1)"
                        title="Bajar"
                      >
                        &#x25BC;
                      </button>
                    </div>
                  </div>
                }
              </div>
            </div>
          </hlm-popover-content>
        </hlm-popover>

        <!-- Export: client-side generates the file locally; server-side delegates to the backend. -->
        <hlm-popover>
          <button hlmPopoverTrigger hlmBtn variant="outline" size="sm">
            <ng-icon name="lucideDownload" class="mr-1" />
            Exportar
          </button>
          <hlm-popover-content *hlmPopoverPortal class="w-44 p-2">
            <button
              class="hover:bg-accent flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors"
              (click)="exportCSV()"
            >
              Descargar CSV
            </button>
            <button
              class="hover:bg-accent flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors"
              (click)="exportExcel()"
            >
              Descargar Excel
            </button>
          </hlm-popover-content>
        </hlm-popover>
      </div>
    </div>

    <!-- Table -->
    <div class="overflow-x-auto rounded-md border">
      <table class="w-full caption-bottom text-sm" style="min-width: max-content;">
        <thead class="[&_tr]:border-b">
          <tr class="hover:bg-muted/50 border-b transition-colors">
            <!-- Actions column (sticky left by default; at the end with actionsEnd) -->
            @if (showActions() && !actionsEnd()) {
              <th
                class="text-foreground bg-background sticky left-0 z-20 h-10 px-2 text-left align-middle font-medium whitespace-nowrap"
                [style.width.px]="actionColWidth"
                [style.min-width.px]="actionColWidth"
                [class.border-r]="!stickyVisibleColumns().length"
                [class.border-border/50]="!stickyVisibleColumns().length"
              >
                Acciones
              </th>
            }
            <!-- Sticky data columns -->
            @for (col of stickyVisibleColumns(); track col.key; let si = $index; let last = $last) {
              <th
                class="text-foreground bg-background sticky z-10 h-10 px-2 text-left align-middle font-medium whitespace-nowrap select-none"
                [style.left.px]="stickyLeftOffsets()[si]"
                [style.min-width.px]="col.minWidth ?? defaultColWidth"
                [class.border-r]="last"
                [class.border-border/50]="last"
                [class.cursor-pointer]="col.sortable !== false"
                (click)="col.sortable !== false ? toggleSort(col.key) : null"
              >
                <div class="flex items-center gap-1">
                  {{ col.label }}
                  @if (col.sortable !== false) {
                    @if (sortColumn() === col.key) {
                      <ng-icon [name]="sortDirection() === 'asc' ? 'lucideArrowUp' : 'lucideArrowDown'" size="xs" />
                    } @else {
                      <ng-icon name="lucideArrowUpDown" class="text-muted-foreground/50" size="xs" />
                    }
                  }
                </div>
              </th>
            }
            <!-- Scrollable data columns -->
            @for (col of scrollableVisibleColumns(); track col.key) {
              <th
                class="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap select-none"
                [style.min-width.px]="col.minWidth ?? defaultColWidth"
                [class.cursor-pointer]="col.sortable !== false"
                (click)="col.sortable !== false ? toggleSort(col.key) : null"
              >
                <div class="flex items-center gap-1">
                  {{ col.label }}
                  @if (col.sortable !== false) {
                    @if (sortColumn() === col.key) {
                      <ng-icon [name]="sortDirection() === 'asc' ? 'lucideArrowUp' : 'lucideArrowDown'" size="xs" />
                    } @else {
                      <ng-icon name="lucideArrowUpDown" class="text-muted-foreground/50" size="xs" />
                    }
                  }
                </div>
              </th>
            }
            @if (showActions() && actionsEnd()) {
              <th class="text-foreground h-10 px-2 text-right align-middle font-medium whitespace-nowrap">Acciones</th>
            }
          </tr>
        </thead>
        <tbody class="[&_tr:last-child]:border-0">
          @for (row of paginatedData(); track trackByFn()(row)) {
            <tr class="hover:bg-muted/50 border-b transition-colors">
              <!-- Actions (sticky left by default) -->
              @if (showActions() && !actionsEnd()) {
                <td
                  class="bg-background sticky left-0 z-20 p-2 align-middle whitespace-nowrap"
                  [style.width.px]="actionColWidth"
                  [style.min-width.px]="actionColWidth"
                  [class.border-r]="!stickyVisibleColumns().length"
                  [class.border-border/50]="!stickyVisibleColumns().length"
                >
                  <div class="flex items-center gap-1.5">
                    <ng-container *ngTemplateOutlet="actionsTpl; context: { $implicit: row }" />
                  </div>
                </td>
              }
              <!-- Sticky data cells -->
              @for (col of stickyVisibleColumns(); track col.key; let si = $index; let last = $last) {
                <td
                  class="bg-background sticky z-10 p-2 align-middle whitespace-nowrap"
                  [style.left.px]="stickyLeftOffsets()[si]"
                  [style.min-width.px]="col.minWidth ?? defaultColWidth"
                  [class.border-r]="last"
                  [class.border-border/50]="last"
                >
                  <ng-container *ngTemplateOutlet="cellTpl; context: { $implicit: row, col }" />
                </td>
              }
              <!-- Scrollable data cells -->
              @for (col of scrollableVisibleColumns(); track col.key) {
                <td class="p-2 align-middle whitespace-nowrap" [style.min-width.px]="col.minWidth ?? defaultColWidth">
                  <ng-container *ngTemplateOutlet="cellTpl; context: { $implicit: row, col }" />
                </td>
              }
              @if (showActions() && actionsEnd()) {
                <!-- ancho acotado: los botones envuelven en vez de estirar la tabla (min-width: max-content) -->
                <td class="p-2 align-middle">
                  <div class="ml-auto flex max-w-[240px] flex-wrap items-center justify-end gap-1.5">
                    <ng-container *ngTemplateOutlet="actionsTpl; context: { $implicit: row }" />
                  </div>
                </td>
              }
            </tr>
          } @empty {
            <tr class="border-b">
              <td class="h-24 text-center" [attr.colspan]="totalColumnCount()">
                <span class="text-muted-foreground">No se encontraron registros</span>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>

    <!-- Actions template (compartido por la columna inicial y la final) -->
    <ng-template #actionsTpl let-row>
      @for (action of actions(); track action.action) {
        @if (!action.hidden || !action.hidden(row)) {
          @if (action.showLabel) {
            <button
              [variant]="$any(action.variant ?? 'outline')"
              hlmBtn
              size="sm"
              (click)="actionClick.emit({ action: action.action, row })"
            >
              {{ action.label }}
            </button>
          } @else {
            <button
              [variant]="$any(action.variant ?? 'ghost')"
              [hlmTooltip]="action.label"
              [attr.aria-label]="action.label"
              hlmBtn
              size="icon-sm"
              (click)="actionClick.emit({ action: action.action, row })"
            >
              <ng-icon [name]="action.icon" />
            </button>
          }
        }
      }
    </ng-template>

    <!-- Cell template -->
    <ng-template #cellTpl let-row let-col="col">
      @if (col.type === 'badge' && col.badgeMap) {
        @if (col.badgeMap[getCellValue(row, col.key)]; as badge) {
          <span class="text-xs" [variant]="$any(badge.variant)" hlmBadge>
            {{ badge.label }}
          </span>
        } @else {
          {{ getCellValue(row, col.key) || '—' }}
        }
      } @else if (col.type === 'date') {
        {{ formatDateCell(getCellValue(row, col.key)) }}
      } @else if (col.type === 'boolean') {
        {{ formatBooleanCell(row[col.key]) }}
      } @else if (col.type === 'badges' && col.badgeMap) {
        @if (getBadgeValues(row, col).length) {
          <span class="flex flex-wrap gap-1">
            @for (badge of getBadgeValues(row, col); track badge.label) {
              <span class="text-xs" [variant]="$any(badge.variant)" hlmBadge>
                {{ badge.label }}
              </span>
            }
          </span>
        } @else {
          —
        }
      } @else if (col.maxWidth) {
        @let text = getDisplayValue(row, col);
        <span
          class="block truncate"
          [style.max-width.px]="col.maxWidth"
          [hlmTooltip]="text"
          [tooltipDisabled]="text === '—'"
        >
          {{ text }}
        </span>
      } @else {
        {{ getDisplayValue(row, col) }}
      }
    </ng-template>

    <!-- Pagination -->
    <div class="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p class="text-muted-foreground text-sm">
        {{ paginationInfo() }}
      </p>
      <div class="flex items-center gap-4">
        <div class="flex items-center gap-2">
          <label class="text-muted-foreground text-sm whitespace-nowrap" for="dt-page-size">Por página:</label>
          <hlm-select [ngModel]="pageSize()" (ngModelChange)="changePageSize($event)">
            <hlm-select-trigger size="sm" buttonId="dt-page-size">
              <hlm-select-value />
            </hlm-select-trigger>
            <hlm-select-content *hlmSelectPortal>
              @for (size of pageSizes; track size) {
                <hlm-select-item [value]="size">{{ size }}</hlm-select-item>
              }
            </hlm-select-content>
          </hlm-select>
        </div>
        <div class="flex items-center gap-1">
          <button
            [disabled]="currentPage() <= 1"
            hlmBtn
            variant="outline"
            size="sm"
            (click)="goToPage(currentPage() - 1)"
          >
            <ng-icon name="lucideChevronLeft" />
          </button>
          @for (page of pageNumbers(); track page) {
            @if (page === -1) {
              <span class="text-muted-foreground px-2">...</span>
            } @else {
              <button
                class="min-w-9"
                [variant]="page === currentPage() ? 'default' : 'outline'"
                hlmBtn
                size="sm"
                (click)="goToPage(page)"
              >
                {{ page }}
              </button>
            }
          }
          <button
            [disabled]="currentPage() >= totalPages()"
            hlmBtn
            variant="outline"
            size="sm"
            (click)="goToPage(currentPage() + 1)"
          >
            <ng-icon name="lucideChevronRight" />
          </button>
        </div>
      </div>
    </div>
  `
})
export class DataTable implements OnDestroy {
  // Inputs
  readonly columns = input.required<ColumnDef[]>()
  readonly data = input.required<Record<string, unknown>[]>()
  readonly trackByFn = input<(row: Record<string, unknown>) => unknown>(
    () => (row: Record<string, unknown>) => row['id']
  )
  readonly showCreate = input(false)
  readonly createLabel = input('Crear')
  readonly showActions = input(true)
  /** Columna de acciones al FINAL de la fila (estilo de la referencia) en vez de fija a la izquierda. */
  readonly actionsEnd = input(false)
  readonly actions = input<TableAction[]>([
    { icon: 'lucidePencil', label: 'Editar', action: 'edit' },
    { icon: 'lucideTrash2', label: 'Eliminar', action: 'delete', variant: 'ghost' }
  ])
  readonly exportFilename = input('export')
  readonly initialStickyColumns = input<string[]>([])

  // Server-side mode: the host provides one page of data + the API `total`, and
  // handles page/sort changes. Client-side features (search, filters, export) are hidden.
  readonly serverSide = input(false)
  readonly total = input<number | null>(null)
  readonly loading = input(false)
  // In server-side mode the host owns the current page; the table mirrors it so both stay in sync
  // (e.g. when a sort or page-size change resets the page). In client-side mode this input is unused.
  readonly page = input<number | null>(null)
  // Same rationale as page(): in server-side mode the host persists these, so on re-mount the table
  // mirrors them instead of resetting the "per page" selector and the header sort indicator.
  readonly pageSizeInput = input<number | null>(null, { alias: 'pageSize' })
  readonly sortColumnInput = input('', { alias: 'sortColumn' })
  readonly sortDirectionInput = input<'asc' | 'desc'>('asc', { alias: 'sortDirection' })
  readonly searchInput = input('', { alias: 'search' })

  // Outputs
  readonly create = output<void>()
  readonly actionClick = output<{ action: string; row: Record<string, unknown> }>()

  // Server-side outputs: emitted only when serverSide() is true, so the host can re-query.
  readonly pageChange = output<number>()
  readonly pageSizeChange = output<number>()
  readonly sortChange = output<SortOrder | null>()
  // Emitted only in server-side mode when the active column filters change, so the host can re-query.
  readonly filtersChange = output<ColumnFilter[]>()
  // Emitted only in server-side mode, debounced, with the trimmed term, so the host can re-query.
  readonly searchChange = output<string>()
  // In server-side mode the client only holds one page, so export delegates to the backend: the host
  // fetches the full filtered dataset in the requested format and downloads it.
  readonly exportRequested = output<ExportFormat>()

  // Constants
  readonly actionColWidth = ACTION_COL_WIDTH
  readonly defaultColWidth = DEFAULT_COL_WIDTH

  // Internal state
  // Client-side: user-driven filter term. Server-side: mirrors the host's [search] so a re-mount
  // keeps the input text; typing overrides it locally until the host echoes the emitted term back.
  readonly globalSearch = linkedSignal(() => (this.serverSide() ? this.searchInput() : ''))
  // Client-side: user-driven, starting from the defaults. Server-side: mirror the host's inputs so a
  // host-driven change (or a re-mount after navigation) keeps the footer, selector and controls in sync.
  // El host guarda en su request el campo por el que ordena el backend (`sortField`), no la
  // clave de la columna: sin traducirlo de vuelta, la cabecera no se reconoce ordenada — la
  // flecha desaparece y el siguiente clic reinicia en asc en vez de invertir.
  readonly sortColumn = linkedSignal(() => {
    if (!this.serverSide()) {
      return ''
    }
    const orderBy = this.sortColumnInput()
    return this.columns().find(c => c.sortField === orderBy)?.key ?? orderBy
  })
  readonly sortDirection = linkedSignal<'asc' | 'desc'>(() => (this.serverSide() ? this.sortDirectionInput() : 'asc'))
  readonly currentPage = linkedSignal(() => (this.serverSide() ? (this.page() ?? 1) : 1))
  readonly pageSize = linkedSignal(() => (this.serverSide() ? (this.pageSizeInput() ?? 10) : 10))
  readonly pageSizes = [5, 10, 25, 50, 100]

  // Filter state. Columna/valor usan null como "sin selección": hlm-select solo muestra el
  // placeholder cuando el valor es null (hasValue() es value !== null, así que '' cuenta como valor).
  readonly activeFilters = signal<ColumnFilter[]>([])
  readonly filterColumn = signal<string | null>(null)
  readonly filterOperator = signal('contains')
  readonly filterValue = signal<string | null>(null)

  // Column order/visibility/sticky
  readonly columnOrder = signal<ColumnOrderItem[]>([])

  // Debounce timer for the server-side search (undefined when idle).
  private searchDebounce: ReturnType<typeof setTimeout> | undefined

  constructor() {
    effect(() => {
      const cols = this.columns()
      const stickyCols = this.initialStickyColumns()
      if (cols.length && !this.columnOrder().length) {
        this.columnOrder.set(
          cols.map(c => ({
            key: c.key,
            label: c.label,
            visible: true,
            sticky: stickyCols.includes(c.key)
          }))
        )
      }
    })
  }

  // Computed: column splits
  // Server-side: opt-in (filterable === true) so the host only offers columns the backend allowlist
  // accepts — an unlisted field would 400. Client-side: opt-out (filterable !== false), unchanged.
  readonly filterableColumns = computed(() =>
    this.serverSide()
      ? this.columns().filter(c => c.filterable === true)
      : this.columns().filter(c => c.filterable !== false)
  )

  // The column currently chosen in the filter popover (undefined when none / not found).
  readonly selectedColumnDef = computed(() => this.columns().find(c => c.key === this.filterColumn()))
  // Vocabulario cerrado (badges o valueMap): el valor se elige de un desplegable en vez de
  // escribirse. Sin esto había que teclear la clave guardada ('yearly') mientras la celda
  // muestra su etiqueta ('Anual').
  readonly isBadgeFilter = computed(() => {
    const column = this.selectedColumnDef()
    return column?.type === 'badge' || column?.valueMap !== undefined
  })
  // Opciones {valor guardado, etiqueta mostrada} de la columna elegida; [] si no es de vocabulario
  // cerrado. El value SIEMPRE es la clave, que es lo que entiende el backend.
  readonly badgeOptions = computed(() => {
    const column = this.selectedColumnDef()
    if (column?.badgeMap) {
      return Object.entries(column.badgeMap).map(([value, { label }]) => ({ value, label }))
    }
    if (column?.valueMap) {
      return Object.entries(column.valueMap).map(([value, label]) => ({ value, label }))
    }
    return []
  })

  // itemToString de los hlm-select del popover de filtros: con el listbox cerrado los items no
  // están instanciados y el trigger mostraría el valor crudo en vez de su etiqueta.
  readonly filterColumnToLabel = (value: unknown): string =>
    this.filterableColumns().find(c => c.key === value)?.label ?? ''
  readonly filterOperatorToLabel = (value: unknown): string => FILTER_OPERATOR_LABELS[String(value)] ?? ''
  readonly badgeValueToLabel = (value: unknown): string => this.badgeOptions().find(o => o.value === value)?.label ?? ''

  readonly visibleColumns = computed(() => {
    const order = this.columnOrder()
    const cols = this.columns()
    return order
      .filter(o => o.visible)
      .map(o => cols.find(c => c.key === o.key)!)
      .filter(Boolean)
  })

  readonly stickyVisibleColumns = computed(() => {
    const order = this.columnOrder()
    const cols = this.columns()
    return order
      .filter(o => o.visible && o.sticky)
      .map(o => cols.find(c => c.key === o.key)!)
      .filter(Boolean)
  })

  readonly scrollableVisibleColumns = computed(() => {
    const order = this.columnOrder()
    const cols = this.columns()
    return order
      .filter(o => o.visible && !o.sticky)
      .map(o => cols.find(c => c.key === o.key)!)
      .filter(Boolean)
  })

  readonly stickyLeftOffsets = computed(() => {
    const stickyCols = this.stickyVisibleColumns()
    const cols = this.columns()
    const hasActions = this.showActions()
    let offset = hasActions ? ACTION_COL_WIDTH : 0
    return stickyCols.map(col => {
      const current = offset
      const def = cols.find(c => c.key === col.key)
      offset += def?.minWidth ?? DEFAULT_COL_WIDTH
      return current
    })
  })

  readonly totalColumnCount = computed(() => {
    return this.visibleColumns().length + (this.showActions() ? 1 : 0)
  })

  // Data pipeline
  readonly filteredData = computed(() => {
    let result = [...this.data()]
    const search = this.globalSearch().toLowerCase().trim()
    const filters = this.activeFilters()
    const cols = this.columns()

    if (search) {
      result = result.filter(row =>
        cols.some(col => String(this.getCellValue(row, col.key)).toLowerCase().includes(search))
      )
    }

    for (const filter of filters) {
      result = result.filter(row => {
        const val = String(this.getCellValue(row, filter.column)).toLowerCase()
        const fv = filter.value.toLowerCase()
        switch (filter.operator) {
          case 'contains':
            return val.includes(fv)
          case 'eq':
            return val === fv
          case 'starts_with':
            return val.startsWith(fv)
          case 'ends_with':
            return val.endsWith(fv)
          case 'gt':
            return val > fv
          case 'lt':
            return val < fv
          default:
            return true
        }
      })
    }

    return result
  })

  readonly sortedData = computed(() => {
    const data = this.filteredData()
    const col = this.sortColumn()
    const dir = this.sortDirection()
    if (!col) {
      return data
    }
    return [...data].sort((a, b) => {
      const comparison = String(this.getCellValue(a, col)).localeCompare(String(this.getCellValue(b, col)), undefined, {
        numeric: true,
        sensitivity: 'base'
      })
      return dir === 'asc' ? comparison : -comparison
    })
  })

  readonly totalPages = computed(() => {
    const count = this.serverSide() ? (this.total() ?? 0) : this.sortedData().length
    return Math.max(1, Math.ceil(count / this.pageSize()))
  })

  readonly paginatedData = computed(() => {
    if (this.serverSide()) {
      return this.data()
    }
    const start = (this.currentPage() - 1) * this.pageSize()
    return this.sortedData().slice(start, start + this.pageSize())
  })

  readonly paginationInfo = computed(() => {
    const total = this.serverSide() ? (this.total() ?? 0) : this.filteredData().length
    if (total === 0) {
      return 'Sin registros'
    }
    const start = (this.currentPage() - 1) * this.pageSize() + 1
    const end = Math.min(this.currentPage() * this.pageSize(), total)
    return `${start}-${end} de ${total} registros`
  })

  readonly pageNumbers = computed(() => {
    const total = this.totalPages()
    const current = this.currentPage()
    const pages: number[] = []
    if (total <= 7) {
      for (let i = 1; i <= total; i++) {
        pages.push(i)
      }
    } else {
      pages.push(1)
      if (current > 3) {
        pages.push(-1)
      }
      for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
        pages.push(i)
      }
      if (current < total - 2) {
        pages.push(-1)
      }
      pages.push(total)
    }
    return pages
  })

  getCellValue(row: Record<string, unknown>, key: string): string {
    const value = row[key]
    return value == null ? '' : String(value)
  }

  // null distinto de '' (spec 44: maintenance contracts sin número/inicio) → guion, mismo
  // convenio que las celdas 'date'. Una cadena vacía (p.ej. contractNumber de licencias MANUAL)
  // no es "sin dato": se muestra en blanco, sin inventar un guion donde el dominio no lo pide.
  getDisplayValue(row: Record<string, unknown>, col: ColumnDef): string {
    if (row[col.key] == null) {
      return '—'
    }
    return col.valueMap?.[this.getCellValue(row, col.key)] ?? this.getCellValue(row, col.key)
  }

  private readonly locale = inject(LOCALE_ID)

  /** Celdas 'boolean': un listado dice Sí/No, igual que la ficha — nunca true/false. */
  protected formatBooleanCell(value: unknown): string {
    if (value === null || value === undefined || value === '') {
      return '—'
    }
    return value ? 'Sí' : 'No'
  }

  // Celdas 'date': ISO → dd/MM/yyyy con el locale de la app (el mismo separador que la ficha y la
  // piel material — defecto 22); vacío/nulo → guion (contrato abierto)
  formatDateCell(value: string): string {
    if (!value) {
      return '—'
    }
    return formatDate(value, 'dd/MM/yyyy', this.locale)
  }

  // Celdas 'badges': resuelve cada elemento del array contra el badgeMap (los desconocidos se omiten)
  getBadgeValues(row: Record<string, unknown>, col: ColumnDef): { label: string; variant: string }[] {
    const value = row[col.key]
    if (!Array.isArray(value) || !col.badgeMap) {
      return []
    }
    return value.flatMap(item => {
      const badge = col.badgeMap?.[String(item)]
      return badge ? [badge] : []
    })
  }

  onSearchChange(value: string): void {
    this.globalSearch.set(value)
    if (!this.serverSide()) {
      return
    }
    clearTimeout(this.searchDebounce)
    this.searchDebounce = setTimeout(() => {
      this.currentPage.set(1)
      this.searchChange.emit(value.trim())
    }, SEARCH_DEBOUNCE_MS)
  }

  ngOnDestroy(): void {
    clearTimeout(this.searchDebounce)
  }

  goToPage(page: number): void {
    this.currentPage.set(page)
    if (this.serverSide()) {
      this.pageChange.emit(page)
    }
  }

  toggleSort(col: string): void {
    if (this.sortColumn() === col) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc')
    } else {
      this.sortColumn.set(col)
      this.sortDirection.set('asc')
    }
    if (this.serverSide()) {
      const orderBy = this.columns().find(c => c.key === this.sortColumn())?.sortField ?? this.sortColumn()
      this.sortChange.emit({ orderBy, orderType: this.sortDirection() })
    }
  }

  // Filter methods
  addFilter(): void {
    const col = this.filterColumn()
    const value = this.filterValue()
    const colDef = this.columns().find(c => c.key === col)
    if (!col || !value || !colDef) {
      return
    }
    // Vocabulario cerrado (badge o valueMap): el valor sale de un desplegable, así que la igualdad
    // es el único operador con sentido — un 'contiene' sobre una clave elegida de una lista sobra.
    const operator = colDef.type === 'badge' || colDef.valueMap ? 'eq' : this.filterOperator()
    this.activeFilters.update(f => [
      ...f,
      {
        column: col,
        columnLabel: colDef.label,
        operator,
        value
      }
    ])
    this.filterColumn.set(null)
    this.filterValue.set(null)
    this.filterOperator.set('contains')
    this.currentPage.set(1)
    this.emitFiltersIfServerSide()
  }

  removeFilter(index: number): void {
    this.activeFilters.update(f => f.filter((_, i) => i !== index))
    this.currentPage.set(1)
    this.emitFiltersIfServerSide()
  }

  clearFilters(): void {
    this.activeFilters.set([])
    this.currentPage.set(1)
    this.emitFiltersIfServerSide()
  }

  private emitFiltersIfServerSide(): void {
    if (this.serverSide()) {
      this.filtersChange.emit(this.activeFilters())
    }
  }

  operatorLabel(op: string): string {
    const labels: Record<string, string> = {
      contains: 'contiene',
      eq: 'es igual a',
      starts_with: 'empieza por',
      ends_with: 'termina en',
      gt: 'mayor que',
      lt: 'menor que'
    }
    return labels[op] ?? op
  }

  // Column methods
  toggleColumnVisibility(key: string): void {
    this.columnOrder.update(cols => cols.map(c => (c.key === key ? { ...c, visible: !c.visible } : c)))
  }

  toggleColumnSticky(key: string): void {
    this.columnOrder.update(cols => cols.map(c => (c.key === key ? { ...c, sticky: !c.sticky } : c)))
  }

  moveColumn(from: number, to: number): void {
    this.columnOrder.update(cols => {
      const arr = [...cols]
      const [item] = arr.splice(from, 1)
      arr.splice(to, 0, item)
      return arr
    })
  }

  changePageSize(size: number | string): void {
    this.pageSize.set(Number(size))
    this.currentPage.set(1)
    if (this.serverSide()) {
      this.pageSizeChange.emit(Number(size))
    }
  }

  exportCSV(): void {
    if (this.serverSide()) {
      return void this.exportRequested.emit('csv')
    }
    this.downloadCsvLocally(`${this.exportFilename()}.csv`, 'text/csv')
  }

  exportExcel(): void {
    if (this.serverSide()) {
      return void this.exportRequested.emit('xlsx')
    }
    // Client-side "Excel" stays a CSV renamed to .xls (legacy behavior); server-side yields a real XLSX.
    this.downloadCsvLocally(`${this.exportFilename()}.xls`, 'application/vnd.ms-excel')
  }

  private generateCSV(): string {
    const cols = this.visibleColumns()
    const header = cols.map(c => `"${c.label}"`).join(';')
    const rows = this.filteredData().map(row =>
      cols.map(c => `"${this.getCellValue(row, c.key).replace(/"/g, '""')}"`).join(';')
    )
    return [header, ...rows].join('\n')
  }

  private downloadCsvLocally(filename: string, mimeType: string): void {
    const bom = '\uFEFF'
    const blob = new Blob([bom + this.generateCSV()], { type: `${mimeType};charset=utf-8` })
    downloadBlob(blob, filename)
  }
}
