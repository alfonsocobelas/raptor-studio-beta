import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { DesignStore } from './design-store'
import { CanvasPageComponent } from './canvas-page.component'
import { InspectorComponent } from './inspector.component'
import { ChatPanelComponent } from '../chat/chat-panel.component'
import { GenerateWizardComponent } from '../generate/generate-wizard.component'

type ToolKind = 'table' | 'kpi' | 'dashboard' | 'files'

/**
 * El estudio: barra de componentes (clic o drag&drop al lienzo), lienzo que
 * pinta la APP COMPLETA como una web real (sidebar + página) y chat a la
 * derecha con el inspector de la entidad seleccionada.
 */
@Component({
  selector: 'studio-canvas',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, CanvasPageComponent, InspectorComponent, ChatPanelComponent, GenerateWizardComponent],
  template: `
    <div class="flex h-screen flex-col">
      <header class="flex items-center gap-3 border-b px-4 py-2">
        <input
          class="hover:border-input w-40 rounded-md border border-transparent px-2 py-1 text-sm font-semibold"
          [ngModel]="store.appName()"
          (ngModelChange)="store.setAppName($event)"
          data-testid="app-name"
        />
        <div class="bg-border h-6 w-px"></div>
        @if (naming()) {
          <form class="flex items-center gap-2" (ngSubmit)="confirmTable()">
            <input
              class="border-input w-44 rounded-md border px-2 py-1 text-sm"
              name="tableName"
              placeholder="Nombre de la entidad…"
              [(ngModel)]="tableName"
              data-testid="new-table-name"
            />
            <button type="submit" class="bg-primary text-primary-foreground rounded-md px-2 py-1 text-sm" data-testid="new-table-ok">
              Crear
            </button>
            <button type="button" class="text-muted-foreground text-sm" (click)="naming.set(false)">✕</button>
          </form>
        } @else {
          <button
            type="button"
            class="toolbar-item"
            draggable="true"
            data-testid="tool-table"
            (dragstart)="dragging.set('table')"
            (dragend)="dragging.set(null)"
            (click)="naming.set(true)"
            title="Clic o arrastra al lienzo"
          >
            ▦ Tabla
          </button>
          <div class="relative">
            <button
              type="button"
              class="toolbar-item"
              draggable="true"
              data-testid="tool-kpi"
              [disabled]="!store.resources().length"
              (dragstart)="dragging.set('kpi')"
              (dragend)="dragging.set(null)"
              (click)="kpiMenu.set(!kpiMenu())"
              title="Clic o arrastra al lienzo"
            >
              ◳ KPI
            </button>
            @if (kpiMenu()) {
              <div class="bg-background absolute left-0 top-9 z-20 min-w-40 rounded-md border p-1 shadow-md">
                @for (resource of store.resources(); track resource.name) {
                  <button
                    type="button"
                    class="hover:bg-accent block w-full rounded px-2 py-1.5 text-left text-sm"
                    [attr.data-testid]="'kpi-of-' + resource.name"
                    (click)="addKpi(resource.name)"
                  >
                    {{ resource.labelPlural }}
                  </button>
                }
              </div>
            }
          </div>
          <button
            type="button"
            class="toolbar-item"
            draggable="true"
            data-testid="tool-files"
            [disabled]="!activeResource()"
            (dragstart)="dragging.set('files')"
            (dragend)="dragging.set(null)"
            (click)="addFiles()"
            title="Añade subida de ficheros a la vista activa (clic o arrastra)"
          >
            🗎 Ficheros
          </button>
          @if (!hasDashboard()) {
            <button
              type="button"
              class="toolbar-item"
              draggable="true"
              data-testid="tool-dashboard"
              [disabled]="!store.resources().length"
              (dragstart)="dragging.set('dashboard')"
              (dragend)="dragging.set(null)"
              (click)="addDashboard()"
              title="Clic o arrastra al lienzo"
            >
              ▤ Dashboard
            </button>
          }
        }
        <span class="flex-1"></span>
        @if (store.lastError(); as error) {
          <span class="text-destructive max-w-96 truncate text-xs" data-testid="canvas-error">{{ error }}</span>
        }
        <button type="button" class="toolbar-item" data-testid="toggle-schema" (click)="showSchema.set(!showSchema())">
          {{ showSchema() ? 'Ocultar diseño' : 'Ver diseño' }}
        </button>
        <studio-generate-wizard />
      </header>

      <div class="flex min-h-0 flex-1">
        <!-- lienzo: la app dibujada como una web -->
        <main
          class="canvas-surface min-w-0 flex-1 overflow-auto p-10"
          [class.ring-2]="dragging()"
          [class.ring-primary]="dragging()"
          (dragover)="$event.preventDefault()"
          (drop)="onDrop()"
          data-testid="canvas-drop"
        >
          @if (showSchema()) {
            <pre class="bg-muted mb-4 max-h-64 overflow-auto rounded-md border p-4 text-xs" data-testid="schema-json"><code>{{ store.exportJson() }}</code></pre>
          }
          @if (!pages().length) {
            <div class="flex h-full flex-col items-center justify-center text-center" data-testid="empty-canvas">
              <p class="text-muted-foreground mb-2 text-lg">Lienzo en blanco</p>
              <p class="text-muted-foreground max-w-md text-sm">
                Arrastra una <strong>▦ Tabla</strong> aquí (o haz clic en la barra), o descríbele tu aplicación al
                chat: «una web para mi frutería con stock».
              </p>
            </div>
          } @else {
            <!-- marco de la app: sidebar + página, como la web generada -->
            <div class="bg-background mx-auto flex min-h-[85%] max-w-6xl overflow-hidden rounded-xl border shadow-xl ring-1 ring-black/5">
              <aside class="bg-card flex w-56 shrink-0 flex-col border-r p-4" data-testid="mock-sidebar">
                <div class="mb-6 flex items-center gap-2 px-1">
                  <div class="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-md text-xs font-bold uppercase">
                    {{ store.appName().slice(0, 2) }}
                  </div>
                  <div>
                    <p class="text-sm font-bold capitalize leading-tight">{{ store.appName() }}</p>
                    <p class="text-muted-foreground text-xs">Panel de gestión</p>
                  </div>
                </div>
                <nav class="flex flex-col gap-1">
                  @for (page of pages(); track $index) {
                    <div class="group relative">
                      <button
                        type="button"
                        class="hover:bg-accent/60 w-full rounded-md px-3 py-2 text-left text-sm"
                        [class.bg-accent]="$index === clampedTab()"
                        [class.font-semibold]="$index === clampedTab()"
                        [attr.data-testid]="'nav-page-' + $index"
                        (click)="activeTab.set($index)"
                      >
                        {{ page.label }}
                      </button>
                      <button
                        type="button"
                        class="bg-destructive absolute -right-1 top-1/2 hidden h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-[10px] font-bold text-white group-hover:flex"
                        [attr.data-testid]="'nav-close-' + $index"
                        (click)="store.removePage($index)"
                      >
                        ✕
                      </button>
                    </div>
                  }
                </nav>
                <span class="flex-1"></span>
                <div class="text-muted-foreground flex items-center gap-2 border-t px-1 pt-3 text-xs">
                  <div class="bg-muted flex h-7 w-7 items-center justify-center rounded-full font-semibold">AC</div>
                  <div>
                    <p class="text-foreground font-medium">Alfonso Cobelas</p>
                    <p>admin</p>
                  </div>
                </div>
              </aside>
              <section class="min-w-0 flex-1 p-6">
                <studio-canvas-page [pageIndex]="clampedTab()" [selected]="selected()" (select)="selected.set($event)" />
              </section>
            </div>
          }
        </main>

        <aside class="flex w-80 shrink-0 flex-col border-l p-4">
          <div class="min-h-0 flex-1">
            <studio-chat-panel />
          </div>
          <studio-inspector [resource]="selected()" (close)="selected.set(null)" />
        </aside>
      </div>
    </div>
  `,
  styles: `
    /* lienzo tipo Figma: retícula de puntos sobre fondo neutro */
    .canvas-surface {
      /* los tokens del tema son oklch() completos: se mezclan con color-mix, no con hsl(var()) */
      background-color: color-mix(in oklab, var(--muted) 55%, var(--background));
      background-image: radial-gradient(
        circle,
        color-mix(in oklab, var(--foreground) 22%, transparent) 1.2px,
        transparent 1.2px
      );
      background-size: 22px 22px;
      background-position: -11px -11px;
    }
    .toolbar-item {
      border: 1px solid hsl(var(--border));
      border-radius: 0.375rem;
      padding: 0.35rem 0.75rem;
      font-size: 0.875rem;
      transition: background-color 0.15s;
      cursor: grab;
    }
    .toolbar-item:hover:not(:disabled) {
      background-color: hsl(var(--accent));
    }
    .toolbar-item:disabled {
      opacity: 0.4;
    }
  `
})
export class StudioCanvasComponent {
  protected readonly store = inject(DesignStore)

  protected readonly naming = signal(false)
  protected readonly tableName = signal('')
  protected readonly kpiMenu = signal(false)
  protected readonly showSchema = signal(false)
  protected readonly activeTab = signal(0)
  protected readonly selected = signal<string | null>(null)
  protected readonly dragging = signal<ToolKind | null>(null)

  protected readonly pages = computed(() => this.store.composition().pages)
  protected readonly clampedTab = computed(() => Math.min(this.activeTab(), Math.max(this.pages().length - 1, 0)))
  protected readonly hasDashboard = computed(() => this.pages().some(p => p.kind === 'dashboard'))

  /** Drop de la barra al lienzo: mismo efecto que el clic, gesto Figma. */
  protected onDrop(): void {
    const tool = this.dragging()
    this.dragging.set(null)
    if (tool === 'table') this.naming.set(true)
    if (tool === 'kpi') this.kpiMenu.set(true)
    if (tool === 'dashboard') this.addDashboard()
    if (tool === 'files') this.addFiles()
  }

  /** Recurso de la página activa (null si es el dashboard). */
  protected readonly activeResource = computed(() => {
    const page = this.pages()[this.clampedTab()]
    return page?.kind === 'resource' ? page.resource : null
  })

  protected addFiles(): void {
    const resource = this.activeResource()
    if (resource) this.store.toggleAttachments(resource, true)
  }

  protected confirmTable(): void {
    const label = this.tableName().trim()
    if (!label) return
    if (this.store.addTable(label)) {
      this.naming.set(false)
      this.tableName.set('')
      this.activeTab.set(this.pages().length - 1)
      this.selected.set(this.store.resources().at(-1)?.name ?? null)
    }
  }

  protected addKpi(resource: string): void {
    this.kpiMenu.set(false)
    if (this.store.addKpi(resource)) this.activeTab.set(0)
  }

  protected addDashboard(): void {
    const first = this.store.resources()[0]
    if (first && this.store.addKpi(first.name)) this.activeTab.set(0)
  }
}
