import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core'
import type { DesignBlock } from '@app/shared/domain'
import { DesignStore } from './design-store'
import { buildSampleRows } from './mock-data'

interface PreviewColumn {
  value: string
  label: string
  cards: string[]
}

/**
 * Bloque KANBAN (spec 61, 22F): una columna por valor del enum, cada registro
 * como tarjeta. Es un mockup determinista — tarjetas de muestra repartidas en
 * orden — no un tablero operativo.
 */
@Component({
  selector: 'studio-canvas-kanban',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (view(); as v) {
      <div class="bg-card rounded-lg border">
        <div class="flex items-center justify-between border-b px-4 py-2.5">
          <h3 class="text-sm font-semibold">{{ v.labelPlural }}</h3>
          <span class="text-muted-foreground text-[10px] tracking-widest">ARRASTRA PARA CAMBIAR DE ESTADO</span>
        </div>
        <div class="grid gap-3 p-3" [style.grid-template-columns]="'repeat(' + v.columns.length + ', minmax(0, 1fr))'">
          @for (column of v.columns; track column.value) {
            <section class="bg-background/60 min-h-24 rounded-md border">
              <header class="flex items-center justify-between border-b px-2 py-1.5">
                <span class="text-[10px] font-semibold uppercase tracking-widest">{{ column.label }}</span>
                <span class="text-muted-foreground text-[10px]">{{ column.cards.length }}</span>
              </header>
              <div class="space-y-1.5 p-1.5">
                @for (card of column.cards; track card) {
                  <div
                    class="bg-card truncate rounded border px-2 py-1 text-[11px] shadow-sm"
                    [attr.data-testid]="'kanban-card-' + column.value"
                  >
                    {{ card }}
                  </div>
                }
              </div>
            </section>
          }
        </div>
        <div class="text-muted-foreground border-t px-4 py-1.5 text-[9px] uppercase tracking-widest">
          {{ v.labelPlural }} · columnas por {{ v.fieldLabel }}
        </div>
      </div>
    }
  `
})
export class CanvasKanbanComponent {
  readonly block = input.required<DesignBlock>()
  private readonly store = inject(DesignStore)

  protected readonly view = computed(() => {
    const block = this.block()
    const draft = this.store.resources().find(r => r.name === block.resource)
    const columnsField = draft?.fields.find(f => f.name === block.columnsField)
    if (!draft || !columnsField?.values?.length) return null

    const labelField = block.labelField ?? draft.fields.find(f => f.type === 'string')?.name
    const rows = buildSampleRows(draft, 6)
    const values = columnsField.values

    const columns: PreviewColumn[] = values.map((value, index) => ({
      value: value.value,
      label: value.label,
      // reparto fijo por posición: mockup determinista, no datos reales
      cards: rows
        .filter((_, rowIndex) => rowIndex % values.length === index)
        .map(row => String(row[labelField ?? ''] ?? draft.labelSingular))
    }))

    return { labelPlural: draft.labelPlural, fieldLabel: columnsField.label, columns }
  })
}
