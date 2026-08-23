import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core'
import { VIEW_PRESETS, type BlockKind, type DesignBlock, type DesignPage } from '@app/shared/domain'
import { NgIcon, provideIcons } from '@ng-icons/core'
import {
  lucideCalendar,
  lucideChartNoAxesColumn,
  lucideChevronDown,
  lucideChevronRight,
  lucideClipboardList,
  lucideGripVertical,
  lucideIdCard,
  lucideLayoutGrid,
  lucidePaperclip,
  lucidePlus,
  lucideSquareDashed,
  lucideTable,
  lucideLock
} from '@ng-icons/lucide'
import { ActiveViewService } from './active-view.service'
import { BlockDragService } from './block-drag.service'
import { CanvasNoticeService } from './canvas-notice.service'
import { dropResource, placeBlock } from './block-drop'
import { DesignStore } from './design-store'
import { detailResource } from './detail-page'
import { viewIcon } from './view-icon'
import { SYSTEM_VIEWS } from './system-preview/system-views'

const SIDEBAR_ICONS = {
  lucideCalendar,
  lucideChartNoAxesColumn,
  lucideLock,
  lucideChevronDown,
  lucideChevronRight,
  lucideClipboardList,
  lucideGripVertical,
  lucideIdCard,
  lucideLayoutGrid,
  lucidePaperclip,
  lucidePlus,
  lucideSquareDashed,
  lucideTable
}

interface BlockTool {
  kind: BlockKind
  icon: string
  label: string
}

/** Una vista de la lista, ya colocada: `child` es la ficha que cuelga de un listado. */
interface ViewNode {
  page: DesignPage
  /** Índice en el diseño: es lo que selecciona y lo que nombran los testids */
  index: number
  child: boolean
  /** La vista tiene fichas colgando, así que se puede desplegar */
  expandable: boolean
  /** Sus fichas están a la vista */
  open: boolean
}

/**
 * Bloques desde los que se ABRE una ficha en la app emitida. Un panel de KPIs
 * menciona entidades pero no lleva a ninguna ficha, así que no puede ser su madre.
 */
const NAVIGATING_BLOCKS: BlockKind[] = ['table', 'cards']

/** ¿Se llega a la ficha de esta entidad desde esta vista? */
function opensDetailOf(page: DesignPage, resource: string): boolean {
  return page.blocks.some((block: DesignBlock) => NAVIGATING_BLOCKS.includes(block.kind) && block.resource === resource)
}

/**
 * Los bloques que el generador emite de verdad. Aquí no hay «gráfico»:
 * mientras `BlockKind` no lo tenga, ofrecerlo sería prometer código que
 * nadie escribe. El formulario entró con la spec 48.
 */
const BLOCK_TOOLS: BlockTool[] = [
  { kind: 'table', icon: 'lucideTable', label: 'Tabla' },
  { kind: 'kpis', icon: 'lucideChartNoAxesColumn', label: 'KPIs' },
  { kind: 'cards', icon: 'lucideLayoutGrid', label: 'Galería' },
  { kind: 'form', icon: 'lucideClipboardList', label: 'Formulario' },
  { kind: 'calendar', icon: 'lucideCalendar', label: 'Calendario' },
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
  host: {
    '(document:click)': 'onDocumentClick($event)',
    '(document:keydown.escape)': 'closeMenus()'
  },
  template: `
    <aside class="studio-rail flex h-full w-64 shrink-0 flex-col gap-6 overflow-y-auto border-r p-4">
      <section>
        <h2 class="studio-eyebrow mb-2 px-1">Vistas del proyecto</h2>
        @for (node of tree(); track node.index) {
          <button
            type="button"
            class="hover:ring-foreground/25 mb-0.5 flex w-full items-center gap-2 studio-ui rounded-[7px] py-2 pr-2 text-left transition-shadow hover:ring-1"
            [class.pl-2]="!node.child"
            [class.ml-3]="node.child"
            [class.border-l]="node.child"
            [class.pl-3]="node.child"
            [class.bg-background]="node.index === active.index()"
            [class.font-semibold]="node.index === active.index()"
            [class.shadow-sm]="node.index === active.index()"
            [class.ring-1]="node.index === active.index()"
            [attr.aria-current]="node.index === active.index() ? 'true' : null"
            [attr.aria-expanded]="node.expandable ? (node.open ? 'true' : 'false') : null"
            [attr.data-child]="node.child ? 'true' : null"
            [attr.data-testid]="'view-item-' + node.index"
            [attr.title]="node.page.drillDown ? 'Se abre desde el listado · no aparece en el menú' : node.page.title"
            (click)="active.select(node.index)"
          >
            <ng-icon [name]="icon(node.page)" size="14" />
            <span class="min-w-0 flex-1 truncate">{{ node.page.title }}</span>
            @if (node.expandable) {
              <ng-icon
                class="text-muted-foreground"
                [name]="node.open ? 'lucideChevronDown' : 'lucideChevronRight'"
                size="13"
              />
            }
          </button>
        }
        @if (!pages().length) {
          <p class="text-muted-foreground px-1 py-1 text-xs">Todavía no hay vistas</p>
        }

        <!-- Vistas de sistema (spec 57): las regala la autenticación, no se editan ni reordenan -->
        <p class="text-muted-foreground mt-3 px-1 text-[10px] font-semibold tracking-wide uppercase">Sistema</p>
        @for (view of systemViews; track view.id) {
          <button
            type="button"
            class="hover:ring-foreground/25 mb-0.5 flex w-full items-center gap-2 studio-ui rounded-[7px] py-2 pr-2 pl-2 text-left transition-shadow hover:ring-1"
            [class.bg-background]="view.id === active.systemView()"
            [class.font-semibold]="view.id === active.systemView()"
            [class.shadow-sm]="view.id === active.systemView()"
            [class.ring-1]="view.id === active.systemView()"
            [attr.aria-current]="view.id === active.systemView() ? 'true' : null"
            [attr.data-testid]="'system-view-' + view.id"
            title="La trae la autenticación · no se edita"
            (click)="active.selectSystem(view.id)"
          >
            <ng-icon name="lucideLock" size="14" />
            <span class="min-w-0 flex-1 truncate">{{ view.title }}</span>
          </button>
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
          <div data-menu-root="view">
            <button
              type="button"
              class="text-muted-foreground hover:border-foreground/45 hover:text-foreground mt-1 flex w-full items-center gap-2 studio-ui border-foreground/35 hover:bg-foreground/5 rounded-[7px] border-2 border-dashed px-2 py-2 text-left transition-colors"
              data-testid="tool-new-view"
              (click)="viewMenu.set(!viewMenu())"
            >
              <ng-icon name="lucidePlus" size="14" />
              Nueva vista
            </button>
            @if (viewMenu()) {
              <div class="bg-background mt-1 rounded-md border p-1 shadow-md" data-testid="view-menu">
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
          </div>
        }
      </section>

      <section>
        <h2 class="studio-eyebrow mb-2 px-1">Componentes</h2>
        @for (tool of blockTools; track tool.kind) {
          <button
            type="button"
            class="block-tool bg-brand text-brand-foreground mb-1.5 flex w-full cursor-grab items-center gap-2 studio-ui rounded-[7px] px-2 py-2 text-left font-semibold transition-opacity hover:opacity-90 active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-40"
            [class.dragging]="drag.kind() === tool.kind"
            [disabled]="!ready()"
            [attr.draggable]="ready() ? 'true' : null"
            [attr.data-testid]="'block-tool-' + tool.kind"
            [attr.title]="hint(tool)"
            (dragstart)="onDragStart($event, tool.kind)"
            (dragend)="drag.end()"
            (click)="addBlock(tool.kind)"
          >
            <ng-icon [name]="tool.icon" size="15" />
            <span class="flex-1">{{ tool.label }}</span>
            <!-- el asidero: la seña de que esto se arrastra, atenuado sobre el naranja -->
            <ng-icon class="grip" name="lucideGripVertical" size="14" />
          </button>
        }
      </section>

      <p class="text-muted-foreground mt-auto px-1 text-xs">
        Arrastra un componente al lienzo —o púlsalo para dejarlo al final—, o pídelo en el chat.
      </p>
    </aside>
  `,
  styles: `
    /* Los componentes visten el mismo naranja macizo que la paleta de bloques de
       Flujos (flow-sidebar, 2026-08-15): un solo tratamiento para los verbos de todos
       los raíles, de día y de noche. Sustituye al melocotón de la comparativa de nueve
       fondos de esa misma mañana. */
    :host {
      --brand: var(--flow-accent);
      --brand-foreground: #fff;
      --drag-ink: var(--foreground);
    }
    :host-context(.dark) {
      --drag-ink: var(--brand);
    }
    /* Sobre el fondo pleno el asidero se atenúa; no puede competir con la etiqueta. */
    .block-tool .grip {
      opacity: 0.55;
    }
    .block-tool:not(:disabled):hover .grip {
      opacity: 1;
    }
    /* El que está en el aire se VACÍA en el raíl mientras dura el gesto: pierde el
       relleno y se queda en contorno sobre el fondo, así se ve de un vistazo cuál de
       los componentes es el que va volando. */
    .block-tool.dragging {
      background-color: color-mix(in oklab, var(--brand) 10%, var(--background));
      /* En claro el melocotón no da para texto: el contorno se escribe en tinta. */
      color: var(--drag-ink);
      box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--brand) 55%, transparent);
    }
    .block-tool.dragging .grip {
      opacity: 1;
    }
  `
})
export class ViewsSidebarComponent {
  protected readonly store = inject(DesignStore)
  protected readonly active = inject(ActiveViewService)
  protected readonly drag = inject(BlockDragService)
  private readonly notice = inject(CanvasNoticeService)

  protected readonly presets = VIEW_PRESETS
  protected readonly systemViews = SYSTEM_VIEWS
  protected readonly blockTools = BLOCK_TOOLS
  protected readonly viewMenu = signal(false)
  protected readonly creating = signal<string | null>(null)
  protected readonly pageTitle = signal('')

  protected readonly pages = computed(() => this.store.pages())

  /** Un componente solo se puede soltar si hay dónde (una vista) y de qué (una entidad). */
  protected readonly ready = computed(() => this.pages().length > 0 && this.store.resources().length > 0)

  /**
   * Las vistas en árbol: cada ficha va detrás del listado desde el que se abre, sangrada,
   * porque en la app emitida se llega a ella desde ahí y nunca desde el menú. La madre es
   * la vista con una tabla o una galería de su entidad; una ficha sin listado se queda al
   * final sin sangrar, porque no cuelga de nada.
   *
   * Las fichas van PLEGADAS: se despliegan al seleccionar su madre (o la propia ficha),
   * así la lista enseña la navegación de la app y no todas sus pantallas a la vez.
   */
  protected readonly tree = computed<ViewNode[]>(() => {
    const pages = this.store.pages().map((page, index) => ({ page, index }))
    const children = pages.filter(entry => entry.page.drillDown)
    const active = this.active.index()
    const placed = new Set<number>()
    const nodes: ViewNode[] = []

    for (const parent of pages.filter(entry => !entry.page.drillDown)) {
      const own = children.filter(child => {
        const resource = detailResource(child.page)
        return !placed.has(child.index) && resource && opensDetailOf(parent.page, resource)
      })
      own.forEach(child => placed.add(child.index))

      const open = own.some(child => child.index === active) || parent.index === active
      nodes.push({ ...parent, child: false, expandable: own.length > 0, open })
      if (open) {
        for (const child of own) nodes.push({ ...child, child: true, expandable: false, open: false })
      }
    }
    for (const child of children) {
      if (!placed.has(child.index)) nodes.push({ ...child, child: false, expandable: false, open: false })
    }
    return nodes
  })

  /**
   * El desplegable abierto se cierra al pulsar en cualquier otro sitio. Los clics del
   * propio botón y de su menú se reconocen por su `data-menu-root`: sin eso el clic que
   * abre el menú llegaría aquí y lo cerraría en el mismo gesto.
   */
  protected onDocumentClick(event: Event): void {
    if (!this.viewMenu()) return
    const root = (event.target as HTMLElement | null)?.closest('[data-menu-root]')?.getAttribute('data-menu-root')
    if (root === 'view') return
    this.closeMenus()
  }

  protected closeMenus(): void {
    this.viewMenu.set(false)
  }

  /** El icono dice qué hay en la vista: un panel de KPIs no se dibuja como tabla. */
  protected icon(page: DesignPage): string {
    return viewIcon(page)
  }

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

  /** El arrastre lo lleva el servicio; al `dataTransfer` solo se le da carga para que el gesto exista. */
  protected onDragStart(event: DragEvent, kind: BlockKind): void {
    event.dataTransfer?.setData('text/plain', kind)
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'copy'
    this.drag.start(kind)
  }

  /**
   * Atajo del arrastre: pulsar deja el bloque al final de la vista activa, con la
   * misma entidad que le daría el lienzo. Sin menú: la entidad sale del contexto.
   */
  protected addBlock(kind: BlockKind): void {
    const page = this.pages()[this.active.index()]
    const resource = dropResource(page, this.active.resource(), this.store.resources())
    if (!resource) return
    placeBlock({ store: this.store, notice: this.notice, active: this.active }, this.active.index(), kind, resource)
  }

  protected hint(tool: BlockTool): string {
    if (!this.pages().length) return 'Crea antes una vista'
    if (!this.store.resources().length) return 'Crea antes una entidad (una vista con datos)'
    return `Arrastra ${tool.label} al lienzo`
  }
}
