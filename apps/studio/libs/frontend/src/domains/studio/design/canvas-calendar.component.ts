import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core'
import type { DesignBlock } from '@app/shared/domain'
import { DesignStore } from './design-store'
import { buildSampleRows } from './mock-data'

interface PreviewCell {
  day: number
  strips: { label: string; accent: boolean }[]
}

/**
 * Bloque CALENDARIO (mock 22E): mini-mes con cada registro como tira en su día.
 * Es un mockup determinista — mes fijo, tiras de muestra — no un calendario real.
 */
@Component({
  selector: 'studio-canvas-calendar',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (view(); as v) {
      <div class="bg-card rounded-lg border">
        <div class="flex items-center justify-between border-b px-4 py-2.5">
          <h3 class="text-sm font-semibold">{{ v.labelPlural }}</h3>
          <span class="text-muted-foreground text-[10px] tracking-widest">‹ SEPT 2026 ›</span>
        </div>
        <div class="grid" [style.grid-template-columns]="'repeat(' + v.dayNames.length + ', minmax(0, 1fr))'">
          @for (name of v.dayNames; track name) {
            <div class="text-muted-foreground border-b px-1 py-1 text-center text-[9px] tracking-widest">
              {{ name }}
            </div>
          }
          @for (cell of v.cells; track cell.day) {
            <div
              class="min-h-14 border-b border-r p-1 last:border-r-0"
              [class.ring-1]="cell.day === 9"
              [class.ring-primary]="cell.day === 9"
            >
              <span class="text-[10px]" [class.text-primary]="cell.day === 9">{{ cell.day }}</span>
              @for (strip of cell.strips; track strip.label) {
                <div
                  class="bg-muted mt-0.5 truncate rounded-sm border-l-2 px-1 text-[9px]"
                  [class.border-l-primary]="strip.accent"
                  [class.border-l-foreground]="!strip.accent"
                  [attr.data-testid]="'calendar-strip-' + cell.day"
                >
                  {{ strip.label }}
                </div>
              }
            </div>
          }
        </div>
        <div
          class="text-muted-foreground flex items-center justify-between border-t px-4 py-1.5 text-[9px] uppercase tracking-widest"
        >
          <span>{{ v.labelPlural }} · campo fecha {{ v.dateLabel }}</span>
          <span><span class="text-foreground font-semibold">Mes</span> · Semana · Día</span>
        </div>
      </div>
    }
  `
})
export class CanvasCalendarComponent {
  readonly block = input.required<DesignBlock>()
  private readonly store = inject(DesignStore)

  protected readonly view = computed(() => {
    const block = this.block()
    const draft = this.store.resources().find(r => r.name === block.resource)
    if (!draft) return null

    const weekends = block.weekends !== false
    const dayNames = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'].slice(0, weekends ? 7 : 5)
    const labelField = block.labelField ?? draft.fields.find(f => f.type === 'string')?.name
    const dateLabel = draft.fields.find(f => f.name === block.dateField)?.label ?? block.dateField ?? '—'

    // mes de mockup: 21 días desde lunes, tiras de muestra repartidas de forma fija
    const rows = buildSampleRows(draft, 6)
    const stripDays = [1, 3, 7, 9, 11, 14, 16]
    const perDay = new Map<number, { label: string; accent: boolean }[]>()
    rows.forEach((row, index) => {
      const day = stripDays[index % stripDays.length]
      const label = String(row[labelField ?? ''] ?? draft.labelSingular)
      perDay.set(day, [...(perDay.get(day) ?? []), { label, accent: index % 3 === 2 }])
    })

    const days = Array.from({ length: 21 }, (_, i) => i + 1).filter(day => weekends || (day - 1) % 7 < 5)
    const cells: PreviewCell[] = days.map(day => ({ day, strips: perDay.get(day) ?? [] }))

    return { labelPlural: draft.labelPlural, dayNames, dateLabel, cells }
  })
}
