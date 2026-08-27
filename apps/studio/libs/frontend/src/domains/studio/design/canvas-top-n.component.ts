import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core'
import type { DesignBlock } from '@app/shared/domain'
import { DesignStore } from './design-store'
import { buildSampleRows } from './mock-data'

interface TopRow {
  label: string
  value: string
}

/**
 * Bloque TOP N (spec 70): la lista corta ordenada por un campo. En la app emitida es UNA
 * petición al listado (`pageSize=N` con orden), no una agregación: por eso está en esta spec y
 * no en la del endpoint `aggregate`.
 */
@Component({
  selector: 'studio-canvas-top-n',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (view(); as v) {
      <div class="app-panel bg-card rounded-lg border p-4" data-testid="canvas-top-n">
        <h3 class="mb-3 text-sm font-semibold">{{ v.title }}</h3>
        @if (v.rows.length) {
          <ol class="space-y-2">
            @for (row of v.rows; track $index) {
              <li class="flex items-center gap-2 text-sm">
                <span class="text-muted-foreground w-6 shrink-0 tabular-nums">{{ $index + 1 }}</span>
                <span class="flex-1 truncate">{{ row.label }}</span>
                <span class="text-right tabular-nums">{{ row.value }}</span>
              </li>
            }
          </ol>
        } @else {
          <p class="text-muted-foreground text-xs">Elige el campo por el que ordenar</p>
        }
        <p class="text-muted-foreground mt-3 border-t pt-1.5 text-[9px] uppercase tracking-widest">
          {{ v.footer }}
        </p>
      </div>
    }
  `
})
export class CanvasTopNComponent {
  readonly block = input.required<DesignBlock>()

  private readonly _store = inject(DesignStore)

  protected readonly view = computed(() => {
    const block = this.block()
    const draft = this._store.resources().find(r => r.name === block.resource)
    if (!draft) return null

    const n = block.topN ?? 5
    const sortField = draft.fields.find(f => f.name === block.topField)
    const labelField = draft.fields.find(f => f.name === block.topLabelField) ?? draft.fields.find(f => f.type === 'string')
    const dir = block.topDir === 'asc' ? 'ascendente' : 'descendente'

    const samples = buildSampleRows(draft, n, this._store.resources())
    const rows: TopRow[] = sortField
      ? samples.map(sample => ({
          label: String(labelField ? (sample[labelField.name] ?? '') : ''),
          value: String(sample[sortField.name] ?? '')
        }))
      : []

    return {
      title: block.kpiLabel?.trim() || `Top ${n} · ${sortField?.label ?? draft.labelPlural}`,
      rows,
      footer: `${draft.labelPlural} · ${n} primeros por ${sortField?.label ?? '—'} (${dir})`
    }
  })
}
