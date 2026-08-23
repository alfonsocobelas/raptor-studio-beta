import { ChangeDetectionStrategy, Component, inject, linkedSignal } from '@angular/core'
import { CalendarConfigComponent } from './calendar-config.component'
import { InspectorComponent } from './inspector.component'
import { ActiveViewService } from './active-view.service'
import { PREVIEW_PALETTES, PREVIEW_PRESETS, PreviewSettings } from './preview-settings'

type PanelTab = 'theme' | 'skin' | 'component'

interface PanelTabOption {
  id: PanelTab
  label: string
}

const PANEL_TABS: readonly PanelTabOption[] = [
  { id: 'theme', label: 'Tema' },
  { id: 'skin', label: 'Piel' },
  { id: 'component', label: 'Componente' }
]

/**
 * Panel derecho del modo Vistas. Todo lo que ofrece sale del catálogo del
 * schema o de los presets del generador: aquí no se inventan acentos,
 * tipografías ni radios, porque nada de eso viaja al código emitido.
 */
@Component({
  selector: 'studio-design-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [InspectorComponent, CalendarConfigComponent],
  template: `
    <div class="flex min-h-0 flex-col">
      <div class="flex items-center gap-4 border-b" role="tablist">
        @for (option of tabs; track option.id) {
          <button
            type="button"
            role="tab"
            class="studio-ui hover:border-b-foreground/30 hover:text-foreground -mb-px border-b-2 border-transparent px-2.5 pb-2.5 pt-3 font-semibold transition-colors"
            [class.border-b-foreground]="tab() === option.id"
            [class.font-semibold]="tab() === option.id"
            [class.text-muted-foreground]="tab() !== option.id"
            [attr.aria-selected]="tab() === option.id"
            [attr.data-testid]="'panel-tab-' + option.id"
            (click)="tab.set(option.id)"
          >
            {{ option.label }}
          </button>
        }
      </div>

      <div class="min-h-0 flex-1 overflow-y-auto px-0.5 pt-3">
        @switch (tab()) {
          @case ('theme') {
            <h3 class="studio-eyebrow mb-2">Paleta</h3>
            <div class="grid grid-cols-2 gap-2">
              @for (palette of palettes; track palette.id) {
                <button
                  type="button"
                  class="hover:border-foreground/40 rounded-md border p-2 text-left transition-colors"
                  [class.ring-2]="preview.palette() === palette.id"
                  [class.ring-inset]="preview.palette() === palette.id"
                  [attr.data-testid]="'palette-' + palette.id"
                  (click)="preview.palette.set(palette.id)"
                >
                  <span class="mb-1.5 block h-4 w-full rounded" [style.background]="palette.swatch"></span>
                  <span class="block text-xs" [class.font-semibold]="preview.palette() === palette.id">
                    {{ palette.label }}
                  </span>
                </button>
              }
            </div>

            <h3 class="studio-eyebrow mb-2 mt-4">Modo</h3>
            <div class="flex items-center gap-1 rounded-md border p-0.5">
              @for (mode of modes; track mode) {
                <button
                  type="button"
                  class="hover:ring-foreground/25 flex-1 rounded px-2 py-1 text-xs transition-shadow hover:ring-1"
                  [class.bg-accent]="preview.theme() === mode"
                  [class.font-semibold]="preview.theme() === mode"
                  [attr.data-testid]="'preview-mode-' + mode"
                  (click)="preview.theme.set(mode)"
                >
                  {{ mode === 'light' ? 'Claro' : 'Oscuro' }}
                </button>
              }
            </div>

            <p class="text-muted-foreground mt-4 text-xs">
              El tema se aplica a todas las vistas y viaja al código generado.
            </p>
          }

          @case ('skin') {
            <h3 class="studio-eyebrow mb-2">Piel</h3>
            @for (option of presets; track option.id) {
              <button
                type="button"
                class="hover:border-foreground/40 mb-1.5 block w-full rounded-md border px-2 py-2 text-left text-sm transition-colors"
                [class.ring-2]="preview.preset() === option.id"
                [class.ring-inset]="preview.preset() === option.id"
                [class.font-semibold]="preview.preset() === option.id"
                [attr.data-testid]="'preview-preset-' + option.id"
                (click)="preview.preset.set(option.id)"
              >
                {{ option.label }}
              </button>
            }
            <p class="text-muted-foreground mt-2 text-xs">
              La piel cambia el armazón de la app (barra, densidad), no sus colores.
            </p>
          }

          @case ('component') {
            @if (view.resource()) {
              <studio-calendar-config [resource]="view.resource()" />
              <studio-inspector [resource]="view.resource()" (close)="view.selectResource(null)" />
            } @else {
              <p class="text-muted-foreground text-xs" data-testid="component-empty">
                Elige una entidad en el lienzo y aquí aparecerán sus columnas.
              </p>
            }
          }
        }
      </div>
    </div>
  `
})
export class DesignPanelComponent {
  protected readonly preview = inject(PreviewSettings)
  protected readonly view = inject(ActiveViewService)

  protected readonly tabs = PANEL_TABS
  protected readonly palettes = PREVIEW_PALETTES
  protected readonly presets = PREVIEW_PRESETS
  protected readonly modes = ['light', 'dark'] as const

  /**
   * Pestaña visible. Elegir una entidad en el lienzo trae el panel a «Componente»
   * —si no, el inspector se abriría a ciegas—, y por lo demás manda el último
   * clic. Con un effect no bastaba: el panel es OnPush y no se refresca por el
   * clic en otro componente, así que la pestaña se deriva al leerse.
   */
  protected readonly tab = linkedSignal<string | null, PanelTab>({
    source: () => this.view.resource(),
    computation: (resource, previous) => (resource ? 'component' : (previous?.value ?? 'theme'))
  })
}
