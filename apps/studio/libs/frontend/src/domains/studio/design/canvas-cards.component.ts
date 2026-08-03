import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core'
import { NgIcon, provideIcons } from '@ng-icons/core'
import { lucideSearch } from '@ng-icons/lucide'
import { DesignStore } from './design-store'
import { buildSampleRows } from './mock-data'

/**
 * Arquetipo GALERÍA: una tarjeta por registro (título, subtítulo, atributos como
 * chips, métrica destacada y acción), con buscador y filtros — el patrón de las
 * pantallas de «oportunidades» o «catálogo», donde una tabla queda fría.
 */
@Component({
  selector: 'studio-canvas-cards',
  imports: [NgIcon],
  providers: [provideIcons({ lucideSearch })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (view(); as v) {
      <div class="mb-4 flex items-center gap-2">
        <div class="border-input text-muted-foreground flex flex-1 items-center gap-2 rounded-md border px-3 py-2 text-sm">
          <ng-icon name="lucideSearch" size="14" /> Buscar {{ v.labelPlural.toLowerCase() }}…
        </div>
        <span class="chip-filter bg-primary text-primary-foreground">Todos</span>
        <span class="chip-filter">Recientes</span>
        <span class="chip-filter">Favoritos</span>
      </div>

      <div class="grid grid-cols-2 gap-4">
        @for (card of v.cards; track card.title) {
          <article class="hover:border-primary/50 rounded-lg border p-4 transition-colors">
            <div class="mb-2 flex items-start justify-between gap-3">
              <h3 class="font-semibold leading-tight">{{ card.title }}</h3>
              @if (card.metric) {
                <span class="text-primary shrink-0 text-sm font-bold">{{ card.metric }}</span>
              }
            </div>
            <p class="text-muted-foreground mb-3 text-sm">{{ card.subtitle }}</p>
            <div class="mb-3 flex flex-wrap gap-1.5">
              @for (chip of card.chips; track chip) {
                <span class="bg-muted rounded-full px-2 py-0.5 text-xs">{{ chip }}</span>
              }
            </div>
            <div class="flex items-center justify-between border-t pt-3">
              <span class="text-muted-foreground text-xs">{{ card.footer }}</span>
              <span class="bg-primary text-primary-foreground rounded-md px-3 py-1.5 text-xs font-medium">
                Ver ficha
              </span>
            </div>
          </article>
        }
      </div>
    }
  `,
  styles: `
    .chip-filter {
      border: 1px solid var(--border);
      border-radius: 9999px;
      padding: 0.3rem 0.85rem;
      font-size: 0.8rem;
      user-select: none;
    }
  `
})
export class CanvasCardsComponent {
  readonly resource = input.required<string>()
  private readonly store = inject(DesignStore)

  protected readonly view = computed(() => {
    const draft = this.store.resources().find(r => r.name === this.resource())
    if (!draft) return null
    const rows = buildSampleRows(draft, 6)
    const titleField = draft.fields.find(f => f.type === 'string')
    const textFields = draft.fields.filter(f => f.type === 'string' || f.type === 'text')
    const metricField = draft.fields.find(f => f.type === 'number' || f.type === 'integer')
    const dateField = draft.fields.find(f => f.type === 'date')

    return {
      labelPlural: draft.labelPlural,
      cards: rows.map(row => ({
        title: String(row[titleField?.name ?? ''] ?? draft.labelSingular),
        subtitle: String(row[textFields[1]?.name ?? ''] ?? `${draft.labelSingular} del catálogo`),
        chips: textFields
          .slice(2, 5)
          .map(f => String(row[f.name] ?? ''))
          .filter(Boolean),
        metric: metricField ? String(row[metricField.name] ?? '') : null,
        footer: dateField ? String(row[dateField.name] ?? '') : 'Actualizado hoy'
      }))
    }
  })
}
