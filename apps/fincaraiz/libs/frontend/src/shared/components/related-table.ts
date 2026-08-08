import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { RouterLink } from '@angular/router'
import { firstValueFrom } from 'rxjs'
import { formatValue } from '../utils/format-value'

export interface RelatedColumn {
  key: string
  label: string
}

interface PagedResponse {
  items: Record<string, unknown>[]
  total: number
}

/**
 * Tabla de registros que APUNTAN a otro (drill-down derivado, ADR-002 punto 4):
 * una consulta al listado del hijo filtrada por el id del padre, nunca un join.
 * Muestra las primeras filas y enlaza al listado completo.
 */
@Component({
  selector: 'app-related-table',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mt-6">
      <div class="mb-2 flex items-baseline justify-between">
        <h2 class="text-sm font-semibold">{{ title() }}</h2>
        @if (total() > rows().length) {
          <a class="text-muted-foreground text-xs hover:underline" [routerLink]="route()"> Ver los {{ total() }} </a>
        }
      </div>

      @if (loading()) {
        <p class="text-muted-foreground py-6 text-center text-sm">Cargando…</p>
      } @else if (!rows().length) {
        <p class="text-muted-foreground rounded-lg border border-dashed py-6 text-center text-sm">
          Todavía no hay {{ title().toLowerCase() }}.
        </p>
      } @else {
        <div class="overflow-x-auto rounded-lg border">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b">
                @for (column of columns(); track column.key) {
                  <th class="text-muted-foreground px-4 py-2 text-left font-medium">{{ column.label }}</th>
                }
              </tr>
            </thead>
            <tbody>
              @for (row of rows(); track $index) {
                <tr class="hover:bg-muted/50 border-b last:border-0">
                  @for (column of columns(); track column.key) {
                    <td class="px-4 py-2">{{ format(row[column.key]) }}</td>
                  }
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </section>
  `
})
export class RelatedTable {
  readonly title = input.required<string>()
  /** Endpoint del listado del hijo */
  readonly endpoint = input.required<string>()
  /** Campo del hijo que apunta al padre */
  readonly field = input.required<string>()
  /** Id del padre */
  readonly value = input.required<string>()
  readonly columns = input.required<RelatedColumn[]>()
  readonly route = input.required<string>()
  /** Filas visibles antes de enviar al listado completo */
  readonly limit = input(5)

  private readonly _http = inject(HttpClient)

  readonly rows = signal<Record<string, unknown>[]>([])
  readonly total = signal(0)
  readonly loading = signal(true)

  constructor() {
    effect(() => {
      const parentId = this.value()
      void this.load(parentId)
    })
  }

  private async load(parentId: string): Promise<void> {
    this.loading.set(true)
    try {
      const response = await firstValueFrom(
        this._http.get<PagedResponse>(this.endpoint(), {
          params: {
            page: '1',
            pageSize: String(this.limit()),
            filters: JSON.stringify([{ field: this.field(), operator: 'eq', value: parentId }])
          }
        })
      )
      this.rows.set(response.items ?? [])
      this.total.set(response.total ?? 0)
    } catch {
      this.rows.set([])
      this.total.set(0)
    } finally {
      this.loading.set(false)
    }
  }

  protected format(value: unknown): string {
    return formatValue(value)
  }
}
