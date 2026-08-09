import { provideZonelessChangeDetection } from '@angular/core'
import { aliasedInput, fireEvent, render, screen, waitFor } from '@testing-library/angular'
import { vi } from 'vitest'
import { ColumnDef, DataTable } from './data-table'
import { downloadBlob } from '../utils/download-file'

vi.mock('../utils/download-file', () => ({ downloadBlob: vi.fn() }))

const columns: ColumnDef[] = [
  { key: 'name', label: 'Nombre' },
  { key: 'industry', label: 'Industria' }
]
const data = [{ name: 'Acme Corp', industry: 'Technology' }]

const manyRows = (n: number) => Array.from({ length: n }, (_, i) => ({ name: `row-${i}`, industry: 'Tech' }))

describe('DataTable', () => {
  it('renders column headers', async () => {
    await render(DataTable, {
      inputs: { columns, data },
      providers: [provideZonelessChangeDetection()]
    })

    expect(screen.getByText('Nombre')).toBeTruthy()
    expect(screen.getByText('Industria')).toBeTruthy()
  })

  it('renders row data', async () => {
    await render(DataTable, {
      inputs: { columns, data },
      providers: [provideZonelessChangeDetection()]
    })

    expect(screen.getByText('Acme Corp')).toBeTruthy()
    expect(screen.getByText('Technology')).toBeTruthy()
  })

  it('projects [toolbar] content into the toolbar row, next to the search box', async () => {
    await render(
      `<app-data-table [columns]="columns" [data]="data">
        <span toolbar>Contenido proyectado</span>
      </app-data-table>`,
      {
        imports: [DataTable],
        componentProperties: { columns, data },
        providers: [provideZonelessChangeDetection()]
      }
    )

    const projected = screen.getByText('Contenido proyectado')
    // Comparte contenedor con el buscador: mismo grupo izquierdo de la toolbar.
    expect(projected.closest('div')?.querySelector('input[placeholder="Buscar en todas las columnas..."]')).toBeTruthy()
  })

  describe('text cells with valueMap', () => {
    const mappedColumns: ColumnDef[] = [
      { key: 'name', label: 'Nombre' },
      { key: 'billingFrequency', label: 'Facturación', valueMap: { yearly: 'Anual', monthly: 'Mensual' } }
    ]

    it('renders the mapped label instead of the raw value', async () => {
      await render(DataTable, {
        inputs: { columns: mappedColumns, data: [{ name: 'Acme Corp', billingFrequency: 'yearly' }] },
        providers: [provideZonelessChangeDetection()]
      })

      expect(screen.getByText('Anual')).toBeTruthy()
      expect(screen.queryByText('yearly')).toBeNull()
    })

    it('falls back to the raw value when the map has no entry', async () => {
      await render(DataTable, {
        inputs: { columns: mappedColumns, data: [{ name: 'Acme Corp', billingFrequency: 'weekly' }] },
        providers: [provideZonelessChangeDetection()]
      })

      expect(screen.getByText('weekly')).toBeTruthy()
    })

    it('renders a dash for a null text cell (maintenance contracts have no number, spec 44)', async () => {
      const nullableColumns: ColumnDef[] = [
        { key: 'name', label: 'Nombre' },
        { key: 'contractNumber', label: 'Nº Contrato' }
      ]

      await render(DataTable, {
        inputs: { columns: nullableColumns, data: [{ name: 'Acme', contractNumber: null }] },
        providers: [provideZonelessChangeDetection()]
      })

      expect(screen.getByText('—')).toBeTruthy()
    })

    it('renders an empty cell for an empty string (distinct from null — MANUAL licenses use "")', async () => {
      const emptyStringColumns: ColumnDef[] = [
        { key: 'name', label: 'Nombre' },
        { key: 'contractNumber', label: 'Contrato' }
      ]

      await render(DataTable, {
        inputs: { columns: emptyStringColumns, data: [{ name: 'Acme', contractNumber: '' }] },
        providers: [provideZonelessChangeDetection()]
      })

      expect(screen.queryByText('—')).toBeNull()
    })
  })

  describe('date cells (spec 40)', () => {
    const dateColumns: ColumnDef[] = [
      { key: 'name', label: 'Nombre' },
      { key: 'startDate', label: 'Inicio', type: 'date' }
    ]

    it('formats an ISO date as dd/MM/yyyy', async () => {
      await render(DataTable, {
        inputs: { columns: dateColumns, data: [{ name: 'Acme', startDate: '2026-01-17' }] },
        providers: [provideZonelessChangeDetection()]
      })

      expect(screen.getByText('17/01/2026')).toBeTruthy()
      expect(screen.queryByText('2026-01-17')).toBeNull()
    })

    it('renders a dash for a null/empty date (open-ended contract)', async () => {
      await render(DataTable, {
        inputs: { columns: dateColumns, data: [{ name: 'Acme', startDate: null }] },
        providers: [provideZonelessChangeDetection()]
      })

      expect(screen.getByText('—')).toBeTruthy()
    })
  })

  describe('badges cells (array values, spec 39)', () => {
    const badgesColumns: ColumnDef[] = [
      { key: 'name', label: 'Nombre' },
      {
        key: 'types',
        label: 'Tipo',
        type: 'badges',
        badgeMap: {
          cloud: { label: 'Cloud', variant: 'default' },
          onprem: { label: 'On-premise', variant: 'secondary' },
          maintenance: { label: 'Mantenimiento', variant: 'outline' }
        }
      }
    ]

    it('renders one badge per value of the array using the badgeMap', async () => {
      await render(DataTable, {
        inputs: { columns: badgesColumns, data: [{ name: 'Acme', types: ['cloud', 'onprem', 'maintenance'] }] },
        providers: [provideZonelessChangeDetection()]
      })

      expect(screen.getByText('Cloud')).toBeTruthy()
      expect(screen.getByText('On-premise')).toBeTruthy()
      expect(screen.getByText('Mantenimiento')).toBeTruthy()
    })

    it('renders a dash for an empty array', async () => {
      await render(DataTable, {
        inputs: { columns: badgesColumns, data: [{ name: 'Bare', types: [] }] },
        providers: [provideZonelessChangeDetection()]
      })

      expect(screen.getByText('—')).toBeTruthy()
      expect(screen.queryByText('Cloud')).toBeNull()
    })

    it('skips values missing from the badgeMap instead of crashing', async () => {
      await render(DataTable, {
        inputs: { columns: badgesColumns, data: [{ name: 'Acme', types: ['cloud', 'unknown'] }] },
        providers: [provideZonelessChangeDetection()]
      })

      expect(screen.getByText('Cloud')).toBeTruthy()
      expect(screen.queryByText('unknown')).toBeNull()
    })
  })

  describe('server-side mode', () => {
    it('shows the API total in the footer, not the number of loaded rows', async () => {
      await render(DataTable, {
        inputs: { columns, data, serverSide: true, total: 28 },
        providers: [provideZonelessChangeDetection()]
      })

      expect(screen.getByText(/de 28 registros/)).toBeTruthy()
    })

    it('renders all loaded rows without client-side slicing', async () => {
      // 15 rows > default pageSize (10): client mode would hide row-14, server mode shows it.
      await render(DataTable, {
        inputs: { columns, data: manyRows(15), serverSide: true, total: 15 },
        providers: [provideZonelessChangeDetection()]
      })

      expect(screen.getByText('row-14')).toBeTruthy()
    })

    it('reflects the host-provided page in the footer (single source of truth)', async () => {
      await render(DataTable, {
        inputs: { columns, data, serverSide: true, total: 28, page: 2 },
        providers: [provideZonelessChangeDetection()]
      })

      expect(screen.getByText(/11-20 de 28 registros/)).toBeTruthy()
    })

    it('reflects the host-provided pageSize in the footer and page count (single source of truth)', async () => {
      // Host persists pageSize across navigation; on re-mount the table must mirror it (28/5 = 6 pages),
      // not reset the selector back to its 10 default while the data stays paged at 5.
      await render(DataTable, {
        inputs: { columns, data, serverSide: true, total: 28, pageSize: 5 },
        providers: [provideZonelessChangeDetection()]
      })

      expect(screen.getByText(/1-5 de 28 registros/)).toBeTruthy()
      expect(screen.getByRole('button', { name: '6' })).toBeTruthy()
    })

    it('reflects the host-provided sort column and direction (single source of truth)', async () => {
      // Host persists the order across navigation; on re-mount the header indicator must match the data.
      const { fixture } = await render(DataTable, {
        inputs: { columns, data, serverSide: true, total: 28, sortColumn: 'name', sortDirection: 'desc' },
        providers: [provideZonelessChangeDetection()]
      })

      expect(fixture.componentInstance.sortColumn()).toBe('name')
      expect(fixture.componentInstance.sortDirection()).toBe('desc')
    })

    it('derives page count from total (page button beyond loaded rows exists)', async () => {
      // total 28 / pageSize 10 = 3 pages, even though only 1 row is loaded.
      await render(DataTable, {
        inputs: { columns, data, serverSide: true, total: 28 },
        providers: [provideZonelessChangeDetection()]
      })

      expect(screen.getByRole('button', { name: '3' })).toBeTruthy()
    })

    it('shows the global search, the column filters and export in server-side mode', async () => {
      const filterableCols: ColumnDef[] = [
        { key: 'name', label: 'Nombre', filterable: true },
        { key: 'industry', label: 'Industria' }
      ]
      await render(DataTable, {
        inputs: { columns: filterableCols, data, serverSide: true, total: 28 },
        providers: [provideZonelessChangeDetection()]
      })

      // The global search now maps to the backend `search` query param, so it is visible too.
      expect(screen.getByPlaceholderText('Buscar en todas las columnas...')).toBeTruthy()
      // Column filters map to backend query params, so the popover is available.
      expect(screen.getByText('Filtros')).toBeTruthy()
      // Export delegates to the backend, so the button stays visible too.
      expect(screen.getByText('Exportar')).toBeTruthy()
    })

    it('hides the filters popover when no column opts into filtering (keeps other tables clean)', async () => {
      // columns has no filterable:true → server-side offers nothing, so the button should not appear.
      await render(DataTable, {
        inputs: { columns, data, serverSide: true, total: 28 },
        providers: [provideZonelessChangeDetection()]
      })

      expect(screen.queryByText('Filtros')).toBeNull()
    })

    it('only offers opt-in (filterable===true) columns in server-side mode', async () => {
      const mixed: ColumnDef[] = [
        { key: 'name', label: 'Nombre', filterable: true },
        { key: 'industry', label: 'Industria' } // not opt-in → excluded in server-side
      ]
      const { fixture } = await render(DataTable, {
        inputs: { columns: mixed, data, serverSide: true, total: 1 },
        providers: [provideZonelessChangeDetection()]
      })

      expect(fixture.componentInstance.filterableColumns().map(c => c.key)).toEqual(['name'])
    })

    it('keeps opt-out (filterable!==false) columns in client-side mode', async () => {
      const mixed: ColumnDef[] = [
        { key: 'name', label: 'Nombre' },
        { key: 'industry', label: 'Industria', filterable: false }
      ]
      const { fixture } = await render(DataTable, {
        inputs: { columns: mixed, data },
        providers: [provideZonelessChangeDetection()]
      })

      expect(fixture.componentInstance.filterableColumns().map(c => c.key)).toEqual(['name'])
    })
  })

  describe('export', () => {
    beforeEach(() => vi.mocked(downloadBlob).mockClear())

    it('emits exportRequested("csv") in server-side mode instead of generating locally', async () => {
      const onExport = vi.fn()
      const { fixture } = await render(DataTable, {
        inputs: { columns, data, serverSide: true, total: 28 },
        providers: [provideZonelessChangeDetection()]
      })
      fixture.componentInstance.exportRequested.subscribe(onExport)

      fixture.componentInstance.exportCSV()

      expect(onExport).toHaveBeenCalledWith('csv')
      expect(downloadBlob).not.toHaveBeenCalled()
    })

    it('emits exportRequested("xlsx") for the Excel option in server-side mode', async () => {
      const onExport = vi.fn()
      const { fixture } = await render(DataTable, {
        inputs: { columns, data, serverSide: true, total: 28 },
        providers: [provideZonelessChangeDetection()]
      })
      fixture.componentInstance.exportRequested.subscribe(onExport)

      fixture.componentInstance.exportExcel()

      expect(onExport).toHaveBeenCalledWith('xlsx')
      expect(downloadBlob).not.toHaveBeenCalled()
    })

    it('generates the file locally (no emit) in client-side mode', async () => {
      const onExport = vi.fn()
      const { fixture } = await render(DataTable, {
        inputs: { columns, data, exportFilename: 'clientes' },
        providers: [provideZonelessChangeDetection()]
      })
      fixture.componentInstance.exportRequested.subscribe(onExport)

      fixture.componentInstance.exportCSV()

      expect(onExport).not.toHaveBeenCalled()
      expect(downloadBlob).toHaveBeenCalledTimes(1)
      const [, filename] = vi.mocked(downloadBlob).mock.calls[0]
      expect(filename).toBe('clientes.csv')
    })
  })

  describe('server-side events', () => {
    it('emits pageChange when navigating to a page', async () => {
      const onPage = vi.fn()
      const { fixture } = await render(DataTable, {
        inputs: { columns, data, serverSide: true, total: 28 },
        providers: [provideZonelessChangeDetection()]
      })
      fixture.componentInstance.pageChange.subscribe(onPage)

      fixture.componentInstance.goToPage(2)

      expect(onPage).toHaveBeenCalledWith(2)
    })

    it('emits pageSizeChange (and resets to page 1) when the page size changes', async () => {
      const onPageSize = vi.fn()
      const { fixture } = await render(DataTable, {
        inputs: { columns, data, serverSide: true, total: 28 },
        providers: [provideZonelessChangeDetection()]
      })
      fixture.componentInstance.pageSizeChange.subscribe(onPageSize)

      fixture.componentInstance.changePageSize(25)

      expect(onPageSize).toHaveBeenCalledWith(25)
      expect(fixture.componentInstance.currentPage()).toBe(1)
    })

    it('emits sortChange with the toggled direction', async () => {
      const onSort = vi.fn()
      const { fixture } = await render(DataTable, {
        inputs: { columns, data, serverSide: true, total: 28 },
        providers: [provideZonelessChangeDetection()]
      })
      fixture.componentInstance.sortChange.subscribe(onSort)

      fixture.componentInstance.toggleSort('name')
      expect(onSort).toHaveBeenLastCalledWith({ orderBy: 'name', orderType: 'asc' })

      fixture.componentInstance.toggleSort('name')
      expect(onSort).toHaveBeenLastCalledWith({ orderBy: 'name', orderType: 'desc' })
    })

    it('emits the column sortField as orderBy, falling back to the key when absent', async () => {
      // A formatted column displays 'pctFmt' but must sort by its numeric backing field 'pct'.
      const sortFieldColumns: ColumnDef[] = [
        { key: 'name', label: 'Nombre' },
        { key: 'pctFmt', label: '% Consumo', sortField: 'pct' }
      ]
      const onSort = vi.fn()
      const { fixture } = await render(DataTable, {
        inputs: { columns: sortFieldColumns, data: [{ name: 'A', pctFmt: '10%' }], serverSide: true, total: 1 },
        providers: [provideZonelessChangeDetection()]
      })
      fixture.componentInstance.sortChange.subscribe(onSort)

      fixture.componentInstance.toggleSort('pctFmt')
      expect(onSort).toHaveBeenLastCalledWith({ orderBy: 'pct', orderType: 'asc' })

      fixture.componentInstance.toggleSort('name')
      expect(onSort).toHaveBeenLastCalledWith({ orderBy: 'name', orderType: 'asc' })
    })

    it('resolves a mirrored sortField back to its column key (indicator and toggle survive the round-trip)', async () => {
      // The host mirrors request.orders[0].orderBy ('pct') into [sortColumn], but the header is keyed
      // by 'pctFmt': without resolving it back, the arrow vanishes and a second click restarts at asc.
      const sortFieldColumns: ColumnDef[] = [
        { key: 'name', label: 'Nombre' },
        { key: 'pctFmt', label: '% Consumo', sortField: 'pct' }
      ]
      const onSort = vi.fn()
      const { fixture } = await render(DataTable, {
        inputs: {
          columns: sortFieldColumns,
          data: [{ name: 'A', pctFmt: '10%' }],
          serverSide: true,
          total: 1,
          sortColumn: 'pct',
          sortDirection: 'asc'
        },
        providers: [provideZonelessChangeDetection()]
      })
      fixture.componentInstance.sortChange.subscribe(onSort)

      expect(fixture.componentInstance.sortColumn()).toBe('pctFmt')

      fixture.componentInstance.toggleSort('pctFmt')
      expect(onSort).toHaveBeenLastCalledWith({ orderBy: 'pct', orderType: 'desc' })
    })
  })

  describe('client-side mode (no regression)', () => {
    it('does not emit server-side events when navigating, resizing or sorting', async () => {
      const onPage = vi.fn()
      const onPageSize = vi.fn()
      const onSort = vi.fn()
      const { fixture } = await render(DataTable, {
        inputs: { columns, data },
        providers: [provideZonelessChangeDetection()]
      })
      fixture.componentInstance.pageChange.subscribe(onPage)
      fixture.componentInstance.pageSizeChange.subscribe(onPageSize)
      fixture.componentInstance.sortChange.subscribe(onSort)

      fixture.componentInstance.goToPage(1)
      fixture.componentInstance.changePageSize(25)
      fixture.componentInstance.toggleSort('name')

      expect(onPage).not.toHaveBeenCalled()
      expect(onPageSize).not.toHaveBeenCalled()
      expect(onSort).not.toHaveBeenCalled()
    })

    it('computes the footer total from the loaded rows', async () => {
      await render(DataTable, {
        inputs: { columns, data },
        providers: [provideZonelessChangeDetection()]
      })

      expect(screen.getByText(/de 1 registros/)).toBeTruthy()
    })

    it('keeps the global search, filters and export controls', async () => {
      await render(DataTable, {
        inputs: { columns, data },
        providers: [provideZonelessChangeDetection()]
      })

      expect(screen.getByPlaceholderText('Buscar en todas las columnas...')).toBeTruthy()
      expect(screen.getByText('Filtros')).toBeTruthy()
      expect(screen.getByText('Exportar')).toBeTruthy()
    })
  })

  describe('server-side filters output', () => {
    it('emits filtersChange when a filter is added in server-side mode', async () => {
      const onFilters = vi.fn()
      const { fixture } = await render(DataTable, {
        inputs: { columns, data, serverSide: true, total: 28 },
        providers: [provideZonelessChangeDetection()]
      })
      const cmp = fixture.componentInstance
      cmp.filtersChange.subscribe(onFilters)

      cmp.filterColumn.set('name')
      cmp.filterOperator.set('eq')
      cmp.filterValue.set('Acme')
      cmp.addFilter()

      expect(onFilters).toHaveBeenCalledWith([{ column: 'name', columnLabel: 'Nombre', operator: 'eq', value: 'Acme' }])
    })

    it('emits the shrunken list when a filter is removed, and empty on clear', async () => {
      const onFilters = vi.fn()
      const { fixture } = await render(DataTable, {
        inputs: { columns, data, serverSide: true, total: 28 },
        providers: [provideZonelessChangeDetection()]
      })
      const cmp = fixture.componentInstance
      cmp.filtersChange.subscribe(onFilters)

      cmp.filterColumn.set('name')
      cmp.filterValue.set('Acme')
      cmp.addFilter()
      cmp.removeFilter(0)
      expect(onFilters).toHaveBeenLastCalledWith([])

      cmp.filterColumn.set('industry')
      cmp.filterValue.set('Tech')
      cmp.addFilter()
      cmp.clearFilters()
      expect(onFilters).toHaveBeenLastCalledWith([])
    })

    it('does not emit filtersChange in client-side mode', async () => {
      const onFilters = vi.fn()
      const { fixture } = await render(DataTable, {
        inputs: { columns, data },
        providers: [provideZonelessChangeDetection()]
      })
      const cmp = fixture.componentInstance
      cmp.filtersChange.subscribe(onFilters)

      cmp.filterColumn.set('name')
      cmp.filterValue.set('Acme')
      cmp.addFilter()

      expect(onFilters).not.toHaveBeenCalled()
    })
  })

  describe('server-side search', () => {
    afterEach(() => {
      vi.useRealTimers()
    })

    it('mirrors the host-provided search term (single source of truth)', async () => {
      await render(DataTable, {
        inputs: { columns, data, serverSide: true, total: 28, ...aliasedInput('search', 'acme') },
        providers: [provideZonelessChangeDetection()]
      })

      const input = screen.getByPlaceholderText('Buscar en todas las columnas...') as HTMLInputElement
      expect(input.value).toBe('acme')
    })

    it('emits searchChange once, trimmed, after the debounce, and resets to page 1', async () => {
      vi.useFakeTimers()
      const onSearch = vi.fn()
      const { fixture } = await render(DataTable, {
        inputs: { columns, data, serverSide: true, total: 28, page: 3 },
        providers: [provideZonelessChangeDetection()]
      })
      const cmp = fixture.componentInstance
      cmp.searchChange.subscribe(onSearch)

      // Rapid typing: each keystroke restarts the debounce window.
      cmp.onSearchChange('ac')
      vi.advanceTimersByTime(200)
      expect(onSearch).not.toHaveBeenCalled()

      cmp.onSearchChange(' acme ')
      vi.advanceTimersByTime(300)

      expect(onSearch).toHaveBeenCalledTimes(1)
      expect(onSearch).toHaveBeenCalledWith('acme')
      expect(cmp.currentPage()).toBe(1)
    })

    it('does not emit searchChange in client-side mode and filters immediately', async () => {
      vi.useFakeTimers()
      const onSearch = vi.fn()
      const { fixture } = await render(DataTable, {
        inputs: { columns, data },
        providers: [provideZonelessChangeDetection()]
      })
      const cmp = fixture.componentInstance
      cmp.searchChange.subscribe(onSearch)

      cmp.onSearchChange('acme')

      // Immediate in-memory filtering (current behavior), no debounce and no emission.
      expect(cmp.globalSearch()).toBe('acme')
      expect(cmp.filteredData()).toHaveLength(1)
      vi.advanceTimersByTime(400)
      expect(onSearch).not.toHaveBeenCalled()
    })
  })

  describe('clear search button', () => {
    afterEach(() => {
      vi.useRealTimers()
    })

    it('is hidden when the search box is empty and clears the search when clicked (client-side)', async () => {
      await render(DataTable, {
        inputs: { columns, data: [...data, { name: 'Beta Corp', industry: 'Retail' }] },
        providers: [provideZonelessChangeDetection()]
      })

      expect(screen.queryByRole('button', { name: 'Borrar búsqueda' })).toBeNull()

      const input = screen.getByPlaceholderText('Buscar en todas las columnas...') as HTMLInputElement
      fireEvent.input(input, { target: { value: 'acme' } })
      expect(screen.queryByText('Beta Corp')).toBeNull()

      fireEvent.click(screen.getByRole('button', { name: 'Borrar búsqueda' }))

      // ngModel refleja el nuevo valor en el DOM de forma asíncrona
      await waitFor(() => expect(input.value).toBe(''))
      expect(screen.getByText('Beta Corp')).toBeTruthy()
      expect(screen.queryByRole('button', { name: 'Borrar búsqueda' })).toBeNull()
    })

    it('emits searchChange("") and resets the page when cleared in server-side mode', async () => {
      vi.useFakeTimers()
      const onSearch = vi.fn()
      const { fixture } = await render(DataTable, {
        inputs: { columns, data, serverSide: true, total: 28, page: 3, ...aliasedInput('search', 'acme') },
        providers: [provideZonelessChangeDetection()]
      })
      const cmp = fixture.componentInstance
      cmp.searchChange.subscribe(onSearch)

      fireEvent.click(screen.getByRole('button', { name: 'Borrar búsqueda' }))
      vi.advanceTimersByTime(300)

      expect(onSearch).toHaveBeenCalledTimes(1)
      expect(onSearch).toHaveBeenCalledWith('')
      expect(cmp.currentPage()).toBe(1)
      expect(cmp.globalSearch()).toBe('')
    })
  })

  describe('badge value control', () => {
    const badgeColumns: ColumnDef[] = [
      { key: 'name', label: 'Nombre', filterable: true },
      {
        key: 'status',
        label: 'Estado',
        type: 'badge',
        filterable: true,
        badgeMap: {
          active: { label: 'Activo', variant: 'default' },
          expired: { label: 'Expirado', variant: 'secondary' }
        }
      }
    ]

    it('exposes badge options from the selected column badgeMap', async () => {
      const { fixture } = await render(DataTable, {
        inputs: { columns: badgeColumns, data, serverSide: true, total: 1 },
        providers: [provideZonelessChangeDetection()]
      })
      const cmp = fixture.componentInstance

      cmp.filterColumn.set('status')
      expect(cmp.badgeOptions()).toEqual([
        { value: 'active', label: 'Activo' },
        { value: 'expired', label: 'Expirado' }
      ])

      cmp.filterColumn.set('name')
      expect(cmp.badgeOptions()).toEqual([])
    })

    it('forces the eq operator when filtering a badge column', async () => {
      const { fixture } = await render(DataTable, {
        inputs: { columns: badgeColumns, data, serverSide: true, total: 1 },
        providers: [provideZonelessChangeDetection()]
      })
      const cmp = fixture.componentInstance

      cmp.filterColumn.set('status')
      cmp.filterValue.set('active')
      cmp.addFilter()

      expect(cmp.activeFilters()).toEqual([
        { column: 'status', columnLabel: 'Estado', operator: 'eq', value: 'active' }
      ])
    })

    // Una columna de texto con valueMap es igual de cerrada que un badge: pinta 'Anual' pero guarda
    // 'yearly'. Sin desplegable, el usuario teclea lo que ve y el ILIKE busca contra el valor crudo,
    // así que se lleva cero resultados sin entender por qué.
    describe('closed vocabulary via valueMap (not only badges)', () => {
      const valueMapColumns: ColumnDef[] = [
        { key: 'name', label: 'Nombre', filterable: true },
        {
          key: 'billingFrequency',
          label: 'Facturación',
          filterable: true,
          valueMap: { monthly: 'Mensual', yearly: 'Anual' }
        }
      ]

      it('offers its labelled options in the value dropdown', async () => {
        const { fixture } = await render(DataTable, {
          inputs: { columns: valueMapColumns, data, serverSide: true, total: 1 },
          providers: [provideZonelessChangeDetection()]
        })
        const cmp = fixture.componentInstance

        cmp.filterColumn.set('billingFrequency')

        expect(cmp.isBadgeFilter()).toBe(true)
        expect(cmp.badgeOptions()).toEqual([
          { value: 'monthly', label: 'Mensual' },
          { value: 'yearly', label: 'Anual' }
        ])
      })

      it('filters by the stored value with eq, never by the rendered label', async () => {
        const { fixture } = await render(DataTable, {
          inputs: { columns: valueMapColumns, data, serverSide: true, total: 1 },
          providers: [provideZonelessChangeDetection()]
        })
        const cmp = fixture.componentInstance

        cmp.filterColumn.set('billingFrequency')
        cmp.filterValue.set('yearly')
        cmp.addFilter()

        expect(cmp.activeFilters()).toEqual([
          { column: 'billingFrequency', columnLabel: 'Facturación', operator: 'eq', value: 'yearly' }
        ])
      })
    })
  })

  describe('operator vocabulary (backend-aligned)', () => {
    const twoRows = [
      { name: 'Acme Corp', industry: 'Technology' },
      { name: 'Globex', industry: 'Retail' }
    ]

    it('client-side filtering honours the backend "eq" operator', async () => {
      const { fixture } = await render(DataTable, {
        inputs: { columns, data: twoRows },
        providers: [provideZonelessChangeDetection()]
      })
      const cmp = fixture.componentInstance

      cmp.filterColumn.set('name')
      cmp.filterOperator.set('eq')
      cmp.filterValue.set('Acme Corp')
      cmp.addFilter()

      expect(cmp.filteredData().map(r => r['name'])).toEqual(['Acme Corp'])
    })

    it('client-side filtering honours the backend "starts_with" operator', async () => {
      const { fixture } = await render(DataTable, {
        inputs: { columns, data: twoRows },
        providers: [provideZonelessChangeDetection()]
      })
      const cmp = fixture.componentInstance

      cmp.filterColumn.set('name')
      cmp.filterOperator.set('starts_with')
      cmp.filterValue.set('Glo')
      cmp.addFilter()

      expect(cmp.filteredData().map(r => r['name'])).toEqual(['Globex'])
    })

    it('labels the backend operators in Spanish', async () => {
      const { fixture } = await render(DataTable, {
        inputs: { columns, data },
        providers: [provideZonelessChangeDetection()]
      })
      const cmp = fixture.componentInstance

      expect(cmp.operatorLabel('eq')).toBe('es igual a')
      expect(cmp.operatorLabel('starts_with')).toBe('empieza por')
      expect(cmp.operatorLabel('ends_with')).toBe('termina en')
    })
  })

  describe('per-row hidden actions (spec 46)', () => {
    it('hides an action for the rows matching its hidden predicate and keeps it for the rest', async () => {
      const rows = [
        { name: 'Manual row', origin: 'MANUAL' },
        { name: 'SAP row', origin: 'ME_SAP' }
      ]
      await render(DataTable, {
        inputs: {
          columns,
          data: rows,
          actions: [
            { icon: 'lucidePencil', label: 'Editar', action: 'edit' },
            {
              icon: 'lucideTrash2',
              label: 'Eliminar',
              action: 'delete',
              hidden: (row: Record<string, unknown>) => row['origin'] === 'ME_SAP'
            }
          ]
        },
        providers: [provideZonelessChangeDetection()]
      })

      // 2 filas con editar, solo 1 con eliminar
      expect(screen.getAllByLabelText('Editar')).toHaveLength(2)
      expect(screen.getAllByLabelText('Eliminar')).toHaveLength(1)
    })
  })

  describe('spartan selects (not native)', () => {
    it('renders no native select, not even inside the filters popover', async () => {
      const filterableColumns: ColumnDef[] = [
        { key: 'name', label: 'Nombre', filterable: true },
        { key: 'industry', label: 'Industria', filterable: true }
      ]
      await render(DataTable, {
        inputs: { columns: filterableColumns, data },
        providers: [provideZonelessChangeDetection()]
      })

      fireEvent.click(screen.getByRole('button', { name: /filtros/i }))

      expect(screen.getAllByText('Añadir filtro').length).toBeGreaterThan(0)
      expect(document.querySelector('select')).toBeNull()
    })

    it('changes the page size from the footer select', async () => {
      await render(DataTable, {
        inputs: { columns, data: manyRows(30) },
        providers: [provideZonelessChangeDetection()]
      })
      expect(screen.getAllByRole('row')).toHaveLength(11) // cabecera + 10 por defecto

      fireEvent.click(screen.getByRole('combobox', { name: 'Por página:' }))
      fireEvent.click(screen.getByRole('option', { name: '25' }))

      // El popover del select se cierra con animación; esperar a que el DOM se estabilice
      await waitFor(() => expect(screen.getByRole('combobox', { name: 'Por página:' }).textContent).toContain('25'))
      expect(screen.getAllByRole('row')).toHaveLength(26)
    })

    it('picks the filter column and operator from spartan selects', async () => {
      const filterableColumns: ColumnDef[] = [
        { key: 'name', label: 'Nombre', filterable: true },
        { key: 'industry', label: 'Industria', filterable: true }
      ]
      await render(DataTable, {
        inputs: { columns: filterableColumns, data },
        providers: [provideZonelessChangeDetection()]
      })

      fireEvent.click(screen.getByRole('button', { name: /filtros/i }))
      fireEvent.click(screen.getByRole('combobox', { name: 'Columna' }))
      fireEvent.click(screen.getByRole('option', { name: 'Industria' }))

      // El popover del select se cierra con animación; esperar a que el DOM se estabilice
      await waitFor(() => expect(screen.getByRole('combobox', { name: 'Columna' }).textContent).toContain('Industria'))
      // El select de operador muestra el default y ofrece sus opciones
      fireEvent.click(screen.getByRole('combobox', { name: 'Operador' }))
      fireEvent.click(screen.getByRole('option', { name: 'Empieza por' }))
      await waitFor(() =>
        expect(screen.getByRole('combobox', { name: 'Operador' }).textContent).toContain('Empieza por')
      )
    })
  })

  describe('no inline editing', () => {
    it('does not open an inline editor on cell double click', async () => {
      await render(DataTable, {
        inputs: { columns, data },
        providers: [provideZonelessChangeDetection()]
      })

      const cell = screen.getByText('Acme Corp')
      fireEvent.dblClick(cell)

      // La celda sigue mostrando el texto, sin input de edición
      expect(screen.getByText('Acme Corp')).toBeTruthy()
      expect(document.querySelector('td input')).toBeNull()
    })
  })
})
