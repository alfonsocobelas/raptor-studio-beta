import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core'
import { ActiveViewService } from './active-view.service'
import { DesignStore } from './design-store'
import { PREVIEW_PALETTES, PREVIEW_PRESETS, PreviewSettings } from './preview-settings'

/**
 * Cabecera del lienzo: qué vista se está mirando y con qué piel y tema se
 * dibuja. Los rótulos salen del catálogo y de los presets del generador, así
 * que dicen exactamente lo que se va a emitir.
 */
@Component({
  selector: 'studio-canvas-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (title(); as title) {
      <div class="mx-auto mb-3 flex max-w-6xl items-center gap-3" data-testid="canvas-header">
        <p
          class="studio-eyebrow"
          data-testid="canvas-header-title"
        >
          Aspecto final · {{ title }}
        </p>
        <span class="flex-1"></span>
        <span class="bg-card text-muted-foreground studio-ui rounded-full border px-3 py-1" data-testid="chip-skin">
          Piel: {{ skinLabel() }}
        </span>
        <span
          class="bg-card text-muted-foreground studio-ui flex items-center gap-1.5 rounded-full border px-3 py-1"
          data-testid="chip-theme"
        >
          <span class="inline-block size-2.5 rounded-full" [style.background]="themeSwatch()"></span>
          {{ themeLabel() }}
        </span>
      </div>
    }
  `
})
export class CanvasHeaderComponent {
  private readonly store = inject(DesignStore)
  private readonly view = inject(ActiveViewService)
  private readonly preview = inject(PreviewSettings)

  protected readonly title = computed(() => this.store.pages()[this.view.index()]?.title ?? null)

  private readonly theme = computed(() => PREVIEW_PALETTES.find(palette => palette.id === this.preview.palette()))

  protected readonly themeLabel = computed(() => this.theme()?.label ?? this.preview.palette())
  protected readonly themeSwatch = computed(() => this.theme()?.swatch ?? 'transparent')
  protected readonly skinLabel = computed(
    () => PREVIEW_PRESETS.find(preset => preset.id === this.preview.preset())?.label ?? this.preview.preset()
  )
}
