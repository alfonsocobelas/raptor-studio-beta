import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core'
import type { DraftResource } from '@app/shared/domain'
import { CanvasFormFieldsComponent } from './canvas-form-fields.component'
import { DesignStore } from './design-store'
import { formDialogDescription, formDialogTitle } from './form-preview'

/**
 * Bloque Formulario del lienzo (spec 48): la página de alta/edición que emitirá
 * el generador, mostrada en modo alta. Reutiliza la parrilla de controles del
 * diálogo mock; los botones son decorativos — en la app real Guardar crea el
 * registro y navega al listado.
 */
@Component({
  selector: 'studio-canvas-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CanvasFormFieldsComponent],
  template: `
    @if (draft(); as resource) {
      <section class="bg-background rounded-lg border p-6">
        <h2 class="text-lg font-semibold" data-testid="canvas-form-title">{{ title() }}</h2>
        <p class="text-muted-foreground mt-1 text-sm">{{ description() }}</p>

        <div class="mt-6">
          <studio-canvas-form-fields [resource]="resource" />
        </div>

        <div class="mt-6 flex justify-end gap-2">
          <span class="chrome-btn">Cancelar</span>
          <span class="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-medium">Guardar</span>
        </div>
      </section>
    }
  `,
  styles: `
    .chrome-btn {
      border: 1px solid var(--border);
      border-radius: 0.375rem;
      padding: 0.45rem 0.9rem;
      font-size: 0.875rem;
      color: var(--foreground);
      user-select: none;
    }
  `
})
export class CanvasFormComponent {
  readonly resource = input.required<string>()

  private readonly store = inject(DesignStore)

  protected readonly draft = computed<DraftResource | null>(
    () => this.store.resources().find(r => r.name === this.resource()) ?? null
  )
  protected readonly title = computed(() => {
    const draft = this.draft()
    return draft ? formDialogTitle(draft, 'create') : ''
  })
  protected readonly description = computed(() => {
    const draft = this.draft()
    return draft ? formDialogDescription(draft, 'create') : ''
  })
}
