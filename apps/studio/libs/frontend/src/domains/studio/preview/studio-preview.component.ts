import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core'
import { CdkDrag, CdkDropList, type CdkDragDrop } from '@angular/cdk/drag-drop'
import { MODELS } from '@acc/generators/src/generators/resource/models/registry'
import { AppStore } from '../editor/app-store'
import { addKpiWidget, addResourcePage, movePage, paletteOf, removePage } from '../editor/app-mutations'
import { PagePreviewComponent } from './page-preview.component'
import { ChatPanelComponent } from '../chat/chat-panel.component'

/**
 * Lienzo del editor (fase C): nav reordenable por drag&drop, borrado por hover,
 * paleta derivada del catálogo y panel con el app-schema vivo. El componente no
 * tiene estado de diseño: todo son mutaciones sobre el AppStore.
 */
@Component({
  selector: 'studio-preview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PagePreviewComponent, ChatPanelComponent, CdkDropList, CdkDrag],
  template: `
    <div class="flex h-full gap-6">
      <aside class="w-56 shrink-0 border-r pr-4">
        <h2 class="text-muted-foreground mb-3 text-xs font-semibold uppercase tracking-wide">Páginas</h2>
        <nav class="flex flex-col gap-1" data-testid="studio-page-nav" cdkDropList (cdkDropListDropped)="reorder($event)">
          @for (page of pages(); track page.label + $index) {
            <div class="group relative" cdkDrag>
              <button
                type="button"
                class="w-full cursor-grab rounded-md px-3 py-2 text-left text-sm transition-colors"
                [class.bg-accent]="$index === selectedIndex()"
                [class.font-medium]="$index === selectedIndex()"
                [class.text-muted-foreground]="$index !== selectedIndex()"
                [attr.data-testid]="'studio-page-' + $index"
                (click)="select($index)"
              >
                {{ page.label }}
              </button>
              <button
                type="button"
                class="bg-destructive absolute -right-1 top-1/2 hidden h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-[10px] font-bold text-white shadow group-hover:flex"
                [attr.data-testid]="'delete-page-' + $index"
                [attr.aria-label]="'Eliminar página ' + page.label"
                (click)="deletePage($index)"
              >
                ✕
              </button>
            </div>
          }
        </nav>
        @if (store.lastError(); as error) {
          <p class="text-destructive mt-3 text-xs" data-testid="studio-error">{{ error }}</p>
        }
      </aside>

      <main class="min-w-0 flex-1">
        <header class="mb-4 flex items-start justify-between gap-4">
          <div>
            <h1 class="text-lg font-semibold">{{ selectedPage().label }}</h1>
            <p class="text-muted-foreground text-sm">Cada cambio muta el app-schema; el lienzo se re-deriva</p>
          </div>
          <button
            type="button"
            class="border-input hover:bg-accent rounded-md border px-3 py-1.5 text-sm"
            data-testid="toggle-schema"
            (click)="showSchema.set(!showSchema())"
          >
            {{ showSchema() ? 'Ocultar schema' : 'Ver schema' }}
          </button>
        </header>
        @if (showSchema()) {
          <pre
            class="bg-muted mb-4 max-h-72 overflow-auto rounded-md p-4 text-xs"
            data-testid="schema-json"
          ><code>{{ store.schemaJson() }}</code></pre>
        }
        <studio-page-preview [page]="selectedPage()" [pageIndex]="selectedIndex()" />
      </main>

      <aside class="flex w-72 shrink-0 flex-col border-l pl-4">
        <h2 class="text-muted-foreground mb-3 text-xs font-semibold uppercase tracking-wide">Paleta</h2>
        <div class="flex flex-col gap-2" data-testid="studio-palette">
          @if (palette().dashboard) {
            <button type="button" class="palette-item" data-testid="add-dashboard" (click)="addDashboard()">
              + Dashboard de KPIs
            </button>
          }
          @for (resource of palette().resourcePages; track resource) {
            <button
              type="button"
              class="palette-item"
              [attr.data-testid]="'add-page-' + resource"
              (click)="addPage(resource)"
            >
              + Página «{{ labelOf(resource) }}»
            </button>
          }
          @for (resource of palette().kpiWidgets; track resource) {
            <button
              type="button"
              class="palette-item"
              [attr.data-testid]="'add-kpi-' + resource"
              (click)="addKpi(resource)"
            >
              + KPI «{{ labelOf(resource) }}»
            </button>
          }
          @if (!palette().dashboard && !palette().resourcePages.length && !palette().kpiWidgets.length) {
            <p class="text-muted-foreground text-xs">Todo el catálogo está en el lienzo.</p>
          }
        </div>
        <div class="mt-4 min-h-0 flex-1 border-t pt-4">
          <studio-chat-panel />
        </div>
      </aside>
    </div>
  `,
  styles: `
    .palette-item {
      border: 1px dashed hsl(var(--border));
      border-radius: 0.375rem;
      padding: 0.5rem 0.75rem;
      text-align: left;
      font-size: 0.875rem;
      transition: background-color 0.15s;
    }
    .palette-item:hover {
      background-color: hsl(var(--accent));
    }
  `
})
export class StudioPreviewComponent {
  protected readonly store = inject(AppStore)
  protected readonly showSchema = signal(false)

  private readonly _selected = signal(0)
  protected readonly pages = computed(() => this.store.composition().pages)
  protected readonly selectedIndex = computed(() => Math.min(this._selected(), this.pages().length - 1))
  protected readonly selectedPage = computed(() => this.pages()[this.selectedIndex()])
  protected readonly palette = computed(() => paletteOf(this.store.definition(), MODELS))

  protected select(index: number): void {
    this._selected.set(index)
  }

  protected deletePage(index: number): void {
    this.store.apply(def => removePage(def, index))
  }

  protected reorder(event: CdkDragDrop<unknown>): void {
    if (event.previousIndex === event.currentIndex) return
    this.store.apply(def => movePage(def, event.previousIndex, event.currentIndex))
    this._selected.set(event.currentIndex)
  }

  protected addPage(resource: string): void {
    if (this.store.apply(def => addResourcePage(def, resource))) {
      this._selected.set(this.pages().length - 1)
    }
  }

  protected addKpi(resource: string): void {
    this.store.apply(def => addKpiWidget(def, resource))
  }

  protected addDashboard(): void {
    const first = this.palette().kpiWidgets[0]
    if (first) {
      this.store.apply(def => addKpiWidget(def, first))
      this._selected.set(0)
    }
  }

  protected labelOf(resource: string): string {
    return MODELS[resource]?.labels?.plural ?? resource
  }
}
