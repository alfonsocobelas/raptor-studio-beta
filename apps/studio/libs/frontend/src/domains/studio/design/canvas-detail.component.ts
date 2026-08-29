import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core'
import { NgIcon, provideIcons } from '@ng-icons/core'
import { lucideArrowLeft, lucidePencil, lucideTrash2 } from '@ng-icons/lucide'
import { DesignStore } from './design-store'
import { detailTransitionActions } from './detail-transitions'
import { buildSampleRows } from './mock-data'

/**
 * Réplica CONTROLADA de la ficha emitida (spec 16). Su anatomía copia
 * `__fileName__-detail.component.ts.template` línea a línea: volver, título,
 * Editar/Eliminar y una rejilla de datos con etiqueta en versalitas. Nada de
 * avatares, badges de estado ni timelines: si el generador no lo emite, el
 * lienzo no puede prometerlo.
 */
@Component({
  selector: 'studio-canvas-detail',
  imports: [NgIcon],
  providers: [provideIcons({ lucideArrowLeft, lucidePencil, lucideTrash2 })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (view(); as v) {
      <div class="min-w-0 space-y-6">
        <span class="text-muted-foreground flex items-center gap-2 text-sm">
          <ng-icon name="lucideArrowLeft" size="16" />
          Volver a {{ v.labelPlural }}
        </span>

        <div class="flex items-start justify-between gap-4">
          <h1 class="text-2xl font-bold tracking-tight">{{ v.title }}</h1>
          <div class="app-toolbar flex gap-2">
            @for (action of v.actions; track action.name) {
              <span class="border-input hover:bg-accent flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                {{ action.label }}
              </span>
            }
            <span class="border-input flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
              <ng-icon name="lucidePencil" size="16" />
              Editar
            </span>
            <span class="text-destructive flex items-center gap-2 rounded-md px-3 py-2 text-sm">
              <ng-icon name="lucideTrash2" size="16" />
              Eliminar
            </span>
          </div>
        </div>

        <dl class="app-panel bg-card grid grid-cols-1 gap-x-8 gap-y-4 rounded-lg border p-6 sm:grid-cols-2">
          @for (row of v.rows; track row.label) {
            <div class="min-w-0">
              <dt class="text-muted-foreground text-xs uppercase tracking-wide">{{ row.label }}</dt>
              <dd class="truncate text-sm font-medium">{{ row.value }}</dd>
            </div>
          }
        </dl>
      </div>
    }
  `
})
export class CanvasDetailComponent {
  readonly resource = input.required<string>()
  private readonly store = inject(DesignStore)

  protected readonly view = computed(() => {
    const draft = this.store.resources().find(r => r.name === this.resource())
    if (!draft) return null

    const [sample] = buildSampleRows(draft, 1, this.store.resources())
    // el generador titula con el primer campo de texto y lo excluye de la rejilla
    const titleField = draft.fields.find(f => f.type === 'string')
    const title = String(sample[titleField?.name ?? ''] ?? draft.labelSingular)

    return {
      title,
      labelPlural: draft.labelPlural,
      // los botones de transición que emitirá la ficha (spec 74): misma regla que el generador
      actions: detailTransitionActions(draft.state),
      rows: draft.fields
        .filter(f => f.name !== titleField?.name)
        .map(f => ({ label: f.label, value: String(sample[f.name] ?? '—') }))
    }
  })
}
