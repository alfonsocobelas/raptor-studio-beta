import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core'
import { VIEW_PRESETS, type BlockKind } from '@app/shared/domain'
import { NgIcon, provideIcons } from '@ng-icons/core'
import {
  lucideChartNoAxesColumn,
  lucideIdCard,
  lucideLayoutGrid,
  lucidePaperclip,
  lucidePlus,
  lucideTable
} from '@ng-icons/lucide'
import { ActiveViewService } from './active-view.service'
import { DesignStore } from './design-store'

const SIDEBAR_ICONS = {
  lucideChartNoAxesColumn,
  lucideIdCard,
  lucideLayoutGrid,
  lucidePaperclip,
  lucidePlus,
  lucideTable
}

interface BlockTool {
  kind: BlockKind
  icon: string
  label: string
}

/**
 * Los bloques que el generador emite de verdad. Aquí no hay «gráfico» ni
 * «formulario»: mientras `BlockKind` no los tenga, ofrecerlos sería prometer
 * código que nadie escribe.
 */
const BLOCK_TOOLS: BlockTool[] = [
  { kind: 'table', icon: 'lucideTable', label: 'Tabla' },
  { kind: 'kpis', icon: 'lucideChartNoAxesColumn', label: 'KPIs' },
  { kind: 'cards', icon: 'lucideLayoutGrid', label: 'Galería' },
  { kind: 'attachments', icon: 'lucidePaperclip', label: 'Adjuntos' },
  { kind: 'fields', icon: 'lucideIdCard', label: 'Datos · ficha' }
]

/**
 * Panel izquierdo del modo Vistas: las vistas del diseño y la paleta de bloques.
 * La vista elegida no se guarda aquí: la comparte con el lienzo `ActiveViewService`.
 */
@Component({
  selector: 'studio-views-sidebar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIcon],
  providers: [provideIcons(SIDEBAR_ICONS)],
  template: `
    <aside class="bg-card flex h-full w-64 shrink-0 flex-col gap-6 overflow-y-auto border-r p-4">
      <section>
        <h2 class="text-muted-foreground mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider">
          Vistas del proyecto
        </h2>
        @for (page of pages(); track $index) {
          <button
            type="button"
            class="hover:bg-accent/60 mb-0.5 flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm"
            [class.bg-background]="$index === active.index()"
            [class.font-semibold]="$index === active.index()"
            [class.shadow-sm]="$index === active.index()"
            [class.ring-1]="$index === active.index()"
            [attr.aria-current]="$index === active.index() ? 'true' : null"
            [attr.data-testid]="'view-item-' + $index"
            [attr.title]="page.drillDown ? 'Se abre desde el listado · no aparece en el menú' : page.title"
            (click)="active.select($index)"
          >
            <ng-icon [name]="page.drillDown ? 'lucideIdCard' : 'lucideTable'" size="14" />
            {{ page.title }}
          </button>
        }
        @if (!pages().length) {
          <p class="text-muted-foreground px-1 py-1 text-xs">Todavía no hay vistas</p>
        }

        @if (creating()) {
          <form class="mt-1 flex items-center gap-1" (submit)="onSubmit($event)">
            <input
              class="border-input w-full rounded-md border px-2 py-1 text-xs"
              name="pageTitle"
              placeholder="Nombre de la vista…"
              [value]="pageTitle()"
              (input)="onTitle($event)"
              data-testid="new-page-title"
            />
            <button
              type="button"
              class="bg-primary text-primary-foreground rounded-md px-2 py-1 text-xs"
              data-testid="new-page-ok"
              (click)="confirmPage()"
            >
              ✓
            </button>
          </form>
        } @else {
          <button
            type="button"
            class="text-muted-foreground hover:bg-accent/60 mt-1 flex w-full items-center gap-2 rounded-md border border-dashed px-2 py-2 text-left text-sm"
            data-testid="tool-new-view"
            (click)="viewMenu.set(!viewMenu())"
          >
            <ng-icon name="lucidePlus" size="14" />
            Nueva vista
          </button>
          @if (viewMenu()) {
            <div class="bg-background mt-1 rounded-md border p-1 shadow-md">
              @for (preset of presets; track preset.id) {
                <button
                  type="button"
                  class="hover:bg-accent block w-full rounded px-2 py-1.5 text-left"
                  [attr.data-testid]="'preset-' + preset.id"
                  (click)="startPage(preset.id)"
                >
                  <span class="block text-sm font-medium">{{ preset.label }}</span>
                  <span class="text-muted-foreground block text-xs">{{ preset.description }}</span>
                </button>
              }
            </div>
          }
        }
      </section>

      <section>
        <h2 class="text-muted-foreground mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider">Componentes</h2>
        @for (tool of blockTools; track tool.kind) {
          <button
            type="button"
            class="hover:bg-accent/60 mb-1.5 flex w-full items-center gap-2 rounded-md border px-2 py-2 text-left text-sm disabled:opacity-40"
            [class.bg-background]="blockMenu() === tool.kind"
            [disabled]="!pages().length"
            [attr.data-testid]="'block-tool-' + tool.kind"
            [attr.title]="pages().length ? 'Añadir ' + tool.label + ' a la vista activa' : 'Crea antes una vista'"
            (click)="openBlockMenu(tool.kind)"
          >
            <ng-icon [name]="tool.icon" size="15" />
            {{ tool.label }}
          </button>
          @if (blockMenu() === tool.kind) {
            <div class="bg-background mb-1.5 rounded-md border p-1 shadow-md">
              @if (!store.resources().length) {
                <p class="text-muted-foreground px-2 py-1.5 text-xs" data-testid="block-menu-empty">
                  Crea antes una entidad (una vista con datos)
                </p>
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
        }
      </section>

      <p class="text-muted-foreground mt-auto px-1 text-xs">
        Pulsa un componente y elige la entidad, o pídelo en el chat.
      </p>
    </aside>
  `
})
export class ViewsSidebarComponent {
  protected readonly store = inject(DesignStore)
  protected readonly active = inject(ActiveViewService)

  protected readonly presets = VIEW_PRESETS
  protected readonly blockTools = BLOCK_TOOLS
  protected readonly viewMenu = signal(false)
  protected readonly blockMenu = signal<BlockKind | null>(null)
  protected readonly creating = signal<string | null>(null)
  protected readonly pageTitle = signal('')

  protected readonly pages = computed(() => this.store.pages())

  protected onTitle(event: Event): void {
    this.pageTitle.set((event.target as HTMLInputElement).value)
  }

  /** Enter en el campo crea la vista; sin prevenir, el form recargaría el estudio. */
  protected onSubmit(event: Event): void {
    event.preventDefault()
    this.confirmPage()
  }

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
      this.active.select(this.pages().length - 1)
    }
  }

  protected openBlockMenu(kind: BlockKind): void {
    this.blockMenu.update(current => (current === kind ? null : kind))
  }

  protected addBlock(kind: BlockKind, resource: string): void {
    this.blockMenu.set(null)
    const block = kind === 'kpis' ? { kind, resources: [resource] } : { kind, resource }
    this.store.addBlock(this.active.index(), block)
  }
}
