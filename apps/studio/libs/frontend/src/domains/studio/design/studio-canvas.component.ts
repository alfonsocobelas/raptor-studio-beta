import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { VIEW_PRESETS, type BlockKind } from '@app/shared/domain'
import { PREVIEW_PALETTES, PreviewSettings } from './preview-settings'
import { previewThemeVars } from './preview-theme'
import { NgIcon, provideIcons } from '@ng-icons/core'
import {
  lucideChartNoAxesColumn,
  lucideCheck,
  lucideChevronUp,
  lucideIdCard,
  lucideLayoutDashboard,
  lucideLayoutGrid,
  lucideMoon,
  lucidePaperclip,
  lucidePlus,
  lucideSquareDashed,
  lucideSun,
  lucideTable,
  lucideTrash2,
  lucideX
} from '@ng-icons/lucide'

/** Un solo set de iconos en todo el estudio: el mismo lucide que emite la app. */
const STUDIO_ICONS = {
  lucideChartNoAxesColumn,
  lucideCheck,
  lucideChevronUp,
  lucideIdCard,
  lucideLayoutDashboard,
  lucideLayoutGrid,
  lucideMoon,
  lucidePaperclip,
  lucidePlus,
  lucideSquareDashed,
  lucideSun,
  lucideTable,
  lucideTrash2,
  lucideX
}
import { DesignStore } from './design-store'
import { CanvasPageComponent } from './canvas-page.component'
import { ModelViewComponent } from './model-view.component'
import { InspectorComponent } from './inspector.component'
import { ChatPanelComponent } from '../chat/chat-panel.component'
import { GenerateWizardComponent } from '../generate/generate-wizard.component'

interface BlockTool {
  kind: BlockKind
  icon: string
  label: string
  /** Necesita elegir entidad al insertarlo */
  needsResource: boolean
}

const BLOCK_TOOLS: BlockTool[] = [
  { kind: 'table', icon: 'lucideTable', label: 'Tabla', needsResource: true },
  { kind: 'kpis', icon: 'lucideChartNoAxesColumn', label: 'KPIs', needsResource: true },
  { kind: 'fields', icon: 'lucideIdCard', label: 'Datos', needsResource: true },
  { kind: 'cards', icon: 'lucideLayoutGrid', label: 'Galería', needsResource: true },
  { kind: 'attachments', icon: 'lucidePaperclip', label: 'Ficheros', needsResource: true }
]

/**
 * El estudio: primero eliges VISTA (en blanco o preset) y luego le sueltas
 * BLOQUES — la tabla es uno más, opcional (ADR-009). Chat a la derecha.
 */
@Component({
  selector: 'studio-canvas',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    NgIcon,
    CanvasPageComponent,
    InspectorComponent,
    ChatPanelComponent,
    GenerateWizardComponent,
    ModelViewComponent
  ],
  providers: [provideIcons(STUDIO_ICONS)],
  template: `
    <div class="flex h-screen flex-col">
      <header class="bg-card flex items-center gap-3 border-b px-4 py-2">
        <!-- marca del producto -->
        <div class="flex shrink-0 items-center gap-2" data-testid="product-logo">
          <svg class="size-7" viewBox="0 0 32 32" role="img" aria-label="Raptor Studio">
            <rect width="32" height="32" rx="9" fill="#1b1917" />
            <text
              x="16"
              y="17"
              text-anchor="middle"
              dominant-baseline="central"
              font-family="Helvetica Neue, Helvetica, Arial, sans-serif"
              font-size="17"
              font-weight="700"
              fill="#f15539"
            >
              R
            </text>
          </svg>
          <span class="text-[15px] font-semibold tracking-tight">Raptor Studio</span>
        </div>
        <div class="bg-border h-6 w-px"></div>

        <!-- conmutador Vistas / Modelo (spec 15, fase 4) -->
        <div class="flex items-center gap-0.5 rounded-md border p-0.5">
          <button
            type="button"
            class="rounded px-2 py-0.5 text-xs font-medium"
            [class.bg-primary]="mode() === 'views'"
            [class.text-primary-foreground]="mode() === 'views'"
            data-testid="mode-views"
            (click)="mode.set('views')"
          >
            Vistas
          </button>
          <button
            type="button"
            class="rounded px-2 py-0.5 text-xs font-medium"
            [class.bg-primary]="mode() === 'model'"
            [class.text-primary-foreground]="mode() === 'model'"
            data-testid="mode-model"
            (click)="mode.set('model')"
          >
            Modelo
          </button>
        </div>
        <div class="bg-border h-6 w-px"></div>

        <!-- crear vista -->
        @if (creating()) {
          <form class="flex items-center gap-2" (ngSubmit)="confirmPage()">
            <input
              class="border-input w-44 rounded-md border px-2 py-1 text-sm"
              name="pageTitle"
              placeholder="Nombre de la vista…"
              [(ngModel)]="pageTitle"
              data-testid="new-page-title"
            />
            <button
              type="submit"
              class="bg-primary text-primary-foreground rounded-md px-2 py-1 text-sm"
              data-testid="new-page-ok"
            >
              Crear {{ presetLabel() }}
            </button>
            <button type="button" class="text-muted-foreground text-sm" (click)="creating.set(null)">✕</button>
          </form>
        } @else {
          <div class="relative">
            <button
              type="button"
              class="toolbar-item font-medium"
              data-testid="tool-new-view"
              (click)="viewMenu.set(!viewMenu())"
            >
              + Nueva vista
            </button>
            @if (viewMenu()) {
              <div class="bg-background absolute left-0 top-9 z-20 w-64 rounded-md border p-1 shadow-md">
                @for (preset of presets; track preset.id) {
                  <button
                    type="button"
                    class="hover:bg-accent block w-full rounded px-2 py-1.5 text-left"
                    [attr.data-testid]="'preset-' + preset.id"
                    (click)="startPage(preset.id)"
                  >
                    <span class="flex items-center gap-2 text-sm font-medium">
                      <ng-icon [name]="preset.icon" size="16" />
                      {{ preset.label }}
                    </span>
                    <span class="text-muted-foreground block text-xs">{{ preset.description }}</span>
                  </button>
                }
              </div>
            }
          </div>

          <div class="bg-border h-6 w-px"></div>

          <!-- bloques: se insertan en la vista activa -->
          @for (tool of blockTools; track tool.kind) {
            <div class="relative">
              <button
                type="button"
                class="toolbar-item"
                [disabled]="!pages().length"
                [attr.data-testid]="'block-tool-' + tool.kind"
                (click)="openBlockMenu(tool.kind)"
                [title]="'Añadir ' + tool.label + ' a la vista activa'"
              >
                <ng-icon [name]="tool.icon" size="15" />
                {{ tool.label }}
              </button>
              @if (blockMenu() === tool.kind) {
                <div class="bg-background absolute left-0 top-9 z-20 min-w-48 rounded-md border p-1 shadow-md">
                  @if (!store.resources().length) {
                    <p class="text-muted-foreground px-2 py-1.5 text-xs">Crea antes una entidad (vista con datos)</p>
                  }
                  @for (resource of store.resources(); track resource.name) {
                    <button
                      type="button"
                      class="hover:bg-accent block w-full rounded px-2 py-1.5 text-left text-sm"
                      [attr.data-testid]="'add-' + tool.kind + '-' + resource.name"
                      (click)="addBlock(tool.kind, resource.name)"
                    >
                      {{ resource.labelPlural }}
                    </button>
                  }
                </div>
              }
            </div>
          }
        }

        <span class="flex-1"></span>
        @if (store.lastError(); as error) {
          <span class="text-destructive max-w-80 truncate text-xs" data-testid="canvas-error">{{ error }}</span>
        }
        <!-- ajustes de PREVISUALIZACIÓN de la app (no del estudio) -->
        <div class="flex items-center gap-1 rounded-md border px-2 py-1" title="Vista previa de la app">
          <span class="text-muted-foreground mr-1 text-[10px] uppercase tracking-wide">App</span>
          @for (palette of palettes; track palette.id) {
            <button
              type="button"
              class="h-4 w-4 rounded-full border transition-transform hover:scale-110"
              [style.background]="palette.swatch"
              [class.ring-2]="preview.palette() === palette.id"
              [class.ring-offset-1]="preview.palette() === palette.id"
              [attr.title]="palette.label"
              [attr.data-testid]="'palette-' + palette.id"
              (click)="preview.palette.set(palette.id)"
            ></button>
          }
          <span class="bg-border mx-1 h-4 w-px"></span>
          <button
            type="button"
            class="text-xs"
            [attr.title]="'Tema de la app: ' + preview.theme()"
            data-testid="preview-theme"
            (click)="preview.toggleTheme()"
          >
            <ng-icon [name]="preview.theme() === 'light' ? 'lucideSun' : 'lucideMoon'" size="14" />
          </button>
          <span class="bg-border mx-1 h-4 w-px"></span>
          <button
            type="button"
            class="text-[10px] font-medium uppercase"
            title="Librería de componentes de la app"
            data-testid="preview-skin"
            (click)="preview.skin.set(preview.skin() === 'spartan' ? 'material' : 'spartan')"
          >
            {{ preview.skin() }}
          </button>
        </div>
        <button
          type="button"
          class="toolbar-item"
          [attr.title]="'Tema del estudio: ' + preview.studioTheme()"
          data-testid="studio-theme"
          (click)="preview.toggleStudioTheme()"
        >
          {{ preview.studioTheme() === 'light' ? '◐' : '◑' }}
        </button>
        <button type="button" class="toolbar-item" data-testid="toggle-schema" (click)="showSchema.set(!showSchema())">
          {{ showSchema() ? 'Ocultar diseño' : 'Ver diseño' }}
        </button>
        <studio-generate-wizard />
      </header>

      <div class="flex min-h-0 flex-1">
        <main class="canvas-surface min-w-0 flex-1 overflow-auto p-10">
          @if (showSchema()) {
            <pre
              class="bg-muted mb-4 max-h-64 overflow-auto rounded-md border p-4 text-xs"
              data-testid="schema-json"
            ><code>{{ store.exportJson() }}</code></pre>
          }
          @if (mode() === 'model') {
            <studio-model-view />
          } @else if (!pages().length) {
            <div class="flex h-full flex-col items-center justify-center text-center" data-testid="empty-canvas">
              <p class="text-muted-foreground mb-2 text-lg">Lienzo en blanco</p>
              <p class="text-muted-foreground max-w-md text-sm">
                Empieza con <strong>+ Nueva vista</strong> (en blanco o un preset), o descríbele tu aplicación al chat:
                «una web para mi frutería con stock».
              </p>
            </div>
          } @else {
            <!-- selector de VISTAS: chrome del estudio, fuera del mockup. Aquí sí
                 aparecen las fichas, que en la app se abren desde el listado. -->
            <div class="mx-auto mb-3 flex max-w-6xl flex-wrap items-center gap-1" data-testid="view-tabs">
              @for (page of pages(); track $index) {
                <button
                  type="button"
                  class="flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs"
                  [class.bg-primary]="$index === clampedTab()"
                  [class.text-primary-foreground]="$index === clampedTab()"
                  [class.border-transparent]="$index === clampedTab()"
                  [attr.data-testid]="'view-tab-' + $index"
                  (click)="activeTab.set($index)"
                >
                  @if (page.drillDown) {
                    <ng-icon name="lucideIdCard" size="12" />
                  }
                  {{ page.title }}
                </button>
              }
              @if (pages()[clampedTab()]?.drillDown) {
                <span class="text-muted-foreground ml-2 text-xs" data-testid="drilldown-hint">
                  se abre desde el listado · no aparece en el menú
                </span>
              }
            </div>
            <div
              class="preview-scope bg-background mx-auto flex min-h-[85%] max-w-6xl overflow-hidden border shadow-xl ring-1 ring-black/5"
              [style]="previewVars()"
              [attr.data-palette]="preview.palette()"
              [attr.data-skin]="preview.skin()"
              [class.dark]="preview.theme() === 'dark'"
              data-testid="preview-scope"
            >
              <aside class="bg-card flex w-56 shrink-0 flex-col border-r p-4" data-testid="mock-sidebar">
                <div class="mb-6 flex items-center gap-2 px-1">
                  <div
                    class="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-md text-xs font-bold uppercase"
                  >
                    {{ store.appName().slice(0, 2) }}
                  </div>
                  <div>
                    <p class="text-sm font-bold capitalize leading-tight">{{ store.appName() }}</p>
                    <p class="text-muted-foreground text-xs">Panel de gestión</p>
                  </div>
                </div>
                <nav class="flex flex-col gap-1">
                  @for (page of pages(); track $index) {
                    @if (!page.drillDown) {
                      <div class="group relative">
                        <button
                          type="button"
                          class="hover:bg-accent/60 w-full rounded-md px-3 py-2 text-left text-sm"
                          [class.bg-accent]="$index === clampedTab()"
                          [class.font-semibold]="$index === clampedTab()"
                          [attr.data-testid]="'nav-page-' + $index"
                          (click)="activeTab.set($index)"
                        >
                          {{ page.title }}
                        </button>
                        <button
                          type="button"
                          class="bg-destructive absolute -right-1 top-1/2 hidden h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-[10px] font-bold text-white group-hover:flex"
                          [attr.data-testid]="'nav-close-' + $index"
                          (click)="store.removePage($index)"
                        >
                          <ng-icon name="lucideX" size="11" />
                        </button>
                      </div>
                    }
                  }
                </nav>
                <span class="flex-1"></span>
                <!-- el botón de tema que llevará la app generada: aquí es funcional -->
                <button
                  type="button"
                  class="hover:bg-accent/60 mb-2 flex items-center gap-2 rounded-md px-3 py-2 text-sm"
                  data-testid="mock-theme-toggle"
                  (click)="preview.toggleTheme()"
                >
                  <ng-icon [name]="preview.theme() === 'light' ? 'lucideMoon' : 'lucideSun'" size="16" />
                  <span>{{ preview.theme() === 'light' ? 'Tema oscuro' : 'Tema claro' }}</span>
                </button>
                <div class="text-muted-foreground flex items-center gap-2 border-t px-1 pt-3 text-xs">
                  <div class="bg-muted flex h-7 w-7 items-center justify-center rounded-full font-semibold">AC</div>
                  <div>
                    <p class="text-foreground font-medium">Alfonso Cobelas</p>
                    <p>admin</p>
                  </div>
                </div>
              </aside>
              <section class="min-w-0 flex-1 p-6">
                <studio-canvas-page [pageIndex]="clampedTab()" (select)="selected.set($event)" />
              </section>
            </div>
          }
        </main>

        <aside class="bg-card flex w-80 shrink-0 flex-col border-l p-4">
          <div class="min-h-0 flex-1">
            <studio-chat-panel />
          </div>
          <studio-inspector [resource]="selected()" (close)="selected.set(null)" />
        </aside>
      </div>
    </div>
  `,
  styles: `
    .canvas-surface {
      background-color: color-mix(in oklab, var(--muted) 55%, var(--background));
      background-image: radial-gradient(
        circle,
        color-mix(in oklab, var(--foreground) 22%, transparent) 1.2px,
        transparent 1.2px
      );
      background-size: 22px 22px;
      background-position: -11px -11px;
    }
    /* La app previsualizada tiene SU PROPIO tema COMPLETO: aunque el estudio esté
       en oscuro, aquí se redefinen todos los tokens para que no se hereden. Los
       valores los pone [style] desde el catálogo — los mismos que se emitirán. */
    .preview-scope {
      --radius: 0.625rem;
      border-radius: var(--radius);
      color: var(--foreground);
    }
    /* aproximación de piel: Material redondea más, sube el peso y usa mayúsculas */
    .preview-scope[data-skin='material'] {
      --radius: 1rem;
    }
    .preview-scope[data-skin='material'] .rounded-md,
    .preview-scope[data-skin='material'] .rounded-lg,
    .preview-scope[data-skin='material'] table {
      border-radius: 0.9rem;
    }
    .preview-scope[data-skin='material'] button {
      text-transform: uppercase;
      letter-spacing: 0.03em;
      font-weight: 600;
    }
    .toolbar-item {
      border: 1px solid var(--border);
      border-radius: 0.375rem;
      padding: 0.35rem 0.75rem;
      font-size: 0.875rem;
      transition: background-color 0.15s;
    }
    .toolbar-item:hover:not(:disabled) {
      background-color: var(--accent);
    }
    .toolbar-item:disabled {
      opacity: 0.4;
    }
  `
})
export class StudioCanvasComponent {
  protected readonly store = inject(DesignStore)
  protected readonly preview = inject(PreviewSettings)
  protected readonly palettes = PREVIEW_PALETTES
  /** Tokens del tema elegido: los mismos que emitirá el generador */
  protected readonly previewVars = computed(() => previewThemeVars(this.preview.palette(), this.preview.theme()))
  protected readonly presets = VIEW_PRESETS
  protected readonly blockTools = BLOCK_TOOLS

  protected readonly mode = signal<'views' | 'model'>('views')
  protected readonly viewMenu = signal(false)
  protected readonly blockMenu = signal<BlockKind | null>(null)
  protected readonly creating = signal<string | null>(null)
  protected readonly pageTitle = signal('')
  protected readonly showSchema = signal(false)
  protected readonly activeTab = signal(0)
  protected readonly selected = signal<string | null>(null)

  protected readonly pages = computed(() => this.store.pages())
  protected readonly clampedTab = computed(() => Math.min(this.activeTab(), Math.max(this.pages().length - 1, 0)))
  protected readonly presetLabel = computed(() => this.presets.find(p => p.id === this.creating())?.label ?? '')

  protected startPage(presetId: string): void {
    this.viewMenu.set(false)
    this.creating.set(presetId)
  }

  protected confirmPage(): void {
    const preset = this.creating()
    if (!preset) return
    if (this.store.addPage(preset, this.pageTitle())) {
      this.creating.set(null)
      this.pageTitle.set('')
      this.activeTab.set(this.pages().length - 1)
    }
  }

  protected openBlockMenu(kind: BlockKind): void {
    this.blockMenu.update(current => (current === kind ? null : kind))
  }

  protected addBlock(kind: BlockKind, resource: string): void {
    this.blockMenu.set(null)
    const block = kind === 'kpis' ? { kind, resources: [resource] } : { kind, resource }
    this.store.addBlock(this.clampedTab(), block)
  }
}
