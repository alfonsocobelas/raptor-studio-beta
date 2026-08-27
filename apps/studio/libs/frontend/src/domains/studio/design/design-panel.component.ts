import { ChangeDetectionStrategy, Component, computed, inject, linkedSignal } from '@angular/core'
import { CalendarConfigComponent } from './calendar-config.component'
import { KanbanConfigComponent } from './kanban-config.component'
import { DesignStore } from './design-store'
import { ChartConfigComponent } from './chart-config.component'
import { KpiConfigComponent } from './kpi-config.component'
import { KpisConfigComponent } from './kpis-config.component'
import { TopNConfigComponent } from './top-n-config.component'
import { InspectorComponent } from './inspector.component'
import type { BlockKind } from '@app/shared/domain'
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
/** Bloques que se dibujan a partir de las columnas de la entidad. */
const COLUMN_BLOCKS: BlockKind[] = ['table', 'cards', 'fields', 'form']

/** Bloques con panel de configuración propio. */
const CONFIGURABLE_BLOCKS: BlockKind[] = ['calendar', 'kanban', 'kpi', 'kpis', 'top-n', 'count-by', 'series']

@Component({
  selector: 'studio-design-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [InspectorComponent, CalendarConfigComponent, KanbanConfigComponent, KpiConfigComponent, KpisConfigComponent, TopNConfigComponent, ChartConfigComponent],
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
            <div class="mode-switch flex rounded-lg p-0.5" role="group" aria-label="Modo">
              @for (mode of modes; track mode) {
                <button
                  type="button"
                  class="studio-ui flex-1 rounded-md px-2 py-1.5 text-center text-xs transition-colors"
                  [class.bg-background]="preview.theme() === mode"
                  [class.ring-1]="preview.theme() === mode"
                  [class.ring-border]="preview.theme() === mode"
                  [class.shadow-sm]="preview.theme() === mode"
                  [class.font-semibold]="preview.theme() === mode"
                  [class.text-muted-foreground]="preview.theme() !== mode"
                  [attr.aria-current]="preview.theme() === mode ? 'true' : null"
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
              <studio-kpis-config />
              <studio-calendar-config [resource]="view.resource()" />
              <studio-kanban-config [resource]="view.resource()" />
              <studio-kpi-config [resource]="view.resource()" />
              <studio-top-n-config [resource]="view.resource()" />
              <studio-chart-config [resource]="view.resource()" />
              @if (columnsMatterHere()) {
                <studio-inspector [resource]="view.resource()" (close)="view.selectResource(null)" />
              } @else if (!hasBlockConfig()) {
                <p class="text-muted-foreground text-xs" data-testid="component-no-columns">
                  Esta vista no pinta columnas: se compone de bloques. Las columnas de la entidad se
                  editan en Modelo.
                </p>
              }
            } @else {
              <p class="text-muted-foreground text-xs" data-testid="component-empty">
                Elige una entidad en el lienzo y aquí aparecerán sus columnas.
              </p>
            }
          }
        }
      </div>
    </div>
  `,
  styles: `
    /* El canal del segmentado va en el rosa arcilla del estudio, no en gris: es el
       naranja de la rejilla (#d75f3d) ya rebajado a superficie, así el hueco se lee
       sin discutirle el protagonismo a la píldora blanca que va dentro. */
    .mode-switch {
      background-color: #e3baac;
    }
  `
})
export class DesignPanelComponent {
  protected readonly preview = inject(PreviewSettings)
  protected readonly view = inject(ActiveViewService)
  private readonly store = inject(DesignStore)

  /**
   * Bloques cuya pantalla se construye con las COLUMNAS de la entidad. Solo ahí tiene sentido el
   * inspector: en un panel ofrecía editar la tabla de una vista que no tiene tabla (2026-08-27).
   * El calendario y el kanban se quedan fuera a propósito — pintan uno o dos campos elegidos en
   * su propio panel, no el conjunto de columnas.
   */
  protected readonly columnsMatterHere = computed(() => {
    const resource = this.view.resource()
    const blocks = this.store.pages()[this.view.index()]?.blocks ?? []
    return blocks.some(block => COLUMN_BLOCKS.includes(block.kind) && block.resource === resource)
  })

  /** ¿Algún bloque de esta vista trae panel propio? Si no, el hueco se explica en vez de quedar en blanco. */
  protected readonly hasBlockConfig = computed(() => {
    const resource = this.view.resource()
    const blocks = this.store.pages()[this.view.index()]?.blocks ?? []
    // la fila de KPIs habla de varias entidades: le basta con medir la elegida
    return blocks.some(
      block =>
        CONFIGURABLE_BLOCKS.includes(block.kind) &&
        (block.resource === resource || (block.resources ?? []).includes(resource ?? ''))
    )
  })

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
