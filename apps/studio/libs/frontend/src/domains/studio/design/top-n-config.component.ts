import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core'
import { FormsModule } from '@angular/forms'
import type { DesignBlock } from '@app/shared/domain'
import { AppSelect, type AppSelectOption } from '../../../shared/components/ui/select'
import { ActiveViewService } from './active-view.service'
import { DesignStore } from './design-store'
import { sortableFieldsOf } from './kpi-config-options'

/**
 * Panel del bloque TOP N (spec 70): por qué campo se ordena, cuántas filas y qué se muestra.
 * Solo se ofrecen campos que el listado emitido sabe ORDENAR: el bloque es una página ordenada,
 * no una agregación.
 */
@Component({
  selector: 'studio-top-n-config',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, AppSelect],
  template: `
    @if (view(); as v) {
      <section class="mb-4 border-t pt-3" data-testid="top-n-config">
        <h3 class="mb-2 text-sm font-semibold">Componente · Top N</h3>
        <div class="space-y-2 text-xs">
          <label class="flex items-center justify-between gap-2">
            <span>Etiqueta</span>
            <input
              class="app-input w-[124px] shrink-0 rounded-md border px-2 py-1 text-xs"
              [ngModel]="v.block.kpiLabel ?? ''"
              [ngModelOptions]="{ standalone: true }"
              (ngModelChange)="patch({ kpiLabel: $event })"
              [placeholder]="v.placeholder"
              data-testid="top-n-label"
            />
          </label>
          <label class="flex items-center justify-between gap-2">
            <span>Ordenar por</span>
            <app-select
              class="w-[124px] shrink-0"
              size="sm"
              [options]="v.sortOptions"
              [ngModel]="v.block.topField ?? ''"
              [ngModelOptions]="{ standalone: true }"
              (ngModelChange)="patch({ topField: $event })"
              data-testid="top-n-field"
            />
          </label>
          <label class="flex items-center justify-between gap-2">
            <span>Sentido</span>
            <app-select
              class="w-[124px] shrink-0"
              size="sm"
              [options]="v.dirOptions"
              [ngModel]="v.block.topDir ?? 'desc'"
              [ngModelOptions]="{ standalone: true }"
              (ngModelChange)="patch({ topDir: $event })"
              data-testid="top-n-dir"
            />
          </label>
          <label class="flex items-center justify-between gap-2">
            <span>Cuántas filas</span>
            <input
              class="app-input w-[124px] shrink-0 rounded-md border px-2 py-1 text-xs"
              type="number"
              min="1"
              max="20"
              [ngModel]="v.block.topN ?? 5"
              [ngModelOptions]="{ standalone: true }"
              (ngModelChange)="onCount($event)"
              data-testid="top-n-count"
            />
          </label>
          <label class="flex items-center justify-between gap-2">
            <span>Mostrar</span>
            <app-select
              class="w-[124px] shrink-0"
              size="sm"
              [options]="v.labelOptions"
              [ngModel]="v.block.topLabelField ?? ''"
              [ngModelOptions]="{ standalone: true }"
              (ngModelChange)="patch({ topLabelField: $event || undefined })"
              data-testid="top-n-label-field"
            />
          </label>
          @if (!v.block.topField) {
            <p class="text-muted-foreground pt-1 text-[10px]">
              Sin campo de orden el bloque es diseño y no llega a la app generada.
            </p>
          }
        </div>
      </section>
    }
  `
})
export class TopNConfigComponent {
  readonly resource = input<string | null>(null)

  private readonly store = inject(DesignStore)
  private readonly active = inject(ActiveViewService)

  protected readonly view = computed(() => {
    const pageIndex = this.active.index()
    const blocks = this.store.pages()[pageIndex]?.blocks ?? []
    const blockIndex = blocks.findIndex(b => b.kind === 'top-n' && b.resource === this.resource())
    const draft = this.store.resources().find(r => r.name === this.resource())
    if (blockIndex < 0 || !draft) return null

    const block = blocks[blockIndex]
    const option = (value: string, label: string): AppSelectOption => ({ value, label })
    const sortable = sortableFieldsOf(draft)

    return {
      pageIndex,
      blockIndex,
      block,
      placeholder: `Top ${block.topN ?? 5} · ${draft.labelPlural}`,
      sortOptions: [option('', '— elige campo'), ...sortable.map(f => option(f.name, f.label))],
      dirOptions: [option('desc', 'De mayor a menor'), option('asc', 'De menor a mayor')],
      labelOptions: [option('', '— el nombre'), ...draft.fields.map(f => option(f.name, f.label))]
    }
  })

  /** Fuera del 1..20 el app-schema rechaza el diseño: se recorta aquí, no allí. */
  protected onCount(value: string): void {
    const parsed = Math.round(Number(value))
    if (!Number.isFinite(parsed)) return
    this.patch({ topN: Math.min(20, Math.max(1, parsed)) })
  }

  protected patch(change: Partial<DesignBlock>): void {
    const v = this.view()
    if (v) this.store.setKpiConfig(v.pageIndex, v.blockIndex, change)
  }
}
