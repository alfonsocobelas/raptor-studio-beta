import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { DesignStore } from './design-store'
import { CanvasPageComponent } from './canvas-page.component'
import { InspectorComponent } from './inspector.component'
import { ChatPanelComponent } from '../chat/chat-panel.component'
import { GenerateWizardComponent } from '../generate/generate-wizard.component'

/**
 * El estudio: lienzo en blanco + barra de componentes arriba + chat a la
 * derecha (con inspector de la entidad seleccionada). Nada de catálogos de
 * demo: todo lo que hay en el lienzo lo ha creado el usuario o la IA.
 */
@Component({
  selector: 'studio-canvas',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, CanvasPageComponent, InspectorComponent, ChatPanelComponent, GenerateWizardComponent],
  template: `
    <div class="flex h-screen flex-col">
      <!-- barra superior: nombre de app + componentes + acciones -->
      <header class="flex items-center gap-3 border-b px-4 py-2">
        <input
          class="w-40 rounded-md border border-transparent px-2 py-1 text-sm font-semibold hover:border-input"
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
          <button type="button" class="toolbar-item" data-testid="tool-table" (click)="naming.set(true)">
            ▦ Tabla
          </button>
          <div class="relative">
            <button
              type="button"
              class="toolbar-item"
              data-testid="tool-kpi"
              [disabled]="!store.resources().length"
              (click)="kpiMenu.set(!kpiMenu())"
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
        <!-- lienzo -->
        <main class="min-w-0 flex-1 overflow-auto p-6">
          @if (showSchema()) {
            <pre class="bg-muted mb-4 max-h-64 overflow-auto rounded-md p-4 text-xs" data-testid="schema-json"><code>{{ store.exportJson() }}</code></pre>
          }
          @if (!pages().length) {
            <div class="flex h-full flex-col items-center justify-center text-center" data-testid="empty-canvas">
              <p class="text-muted-foreground mb-2 text-lg">Lienzo en blanco</p>
              <p class="text-muted-foreground max-w-md text-sm">
                Añade una <strong>▦ Tabla</strong> desde la barra, o descríbele tu aplicación al chat:
                «una app de flotas con vehículos (matrícula, marca, fecha de alta) y conductores».
              </p>
            </div>
          } @else {
            <nav class="mb-4 flex gap-1 border-b" data-testid="page-tabs">
              @for (page of pages(); track $index) {
                <div class="group relative">
                  <button
                    type="button"
                    class="rounded-t-md px-3 py-1.5 text-sm"
                    [class.bg-accent]="$index === activeTab()"
                    [class.font-medium]="$index === activeTab()"
                    [class.text-muted-foreground]="$index !== activeTab()"
                    [attr.data-testid]="'tab-' + $index"
                    (click)="activeTab.set($index)"
                  >
                    {{ page.label }}
                  </button>
                  <button
                    type="button"
                    class="bg-destructive absolute -right-1 -top-1 hidden h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white group-hover:flex"
                    [attr.data-testid]="'tab-close-' + $index"
                    (click)="store.removePage($index)"
                  >
                    ✕
                  </button>
                </div>
              }
            </nav>
            <studio-canvas-page [pageIndex]="clampedTab()" [selected]="selected()" (select)="selected.set($event)" />
          }
        </main>

        <!-- columna derecha: chat + inspector -->
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
    .toolbar-item {
      border: 1px solid hsl(var(--border));
      border-radius: 0.375rem;
      padding: 0.35rem 0.75rem;
      font-size: 0.875rem;
      transition: background-color 0.15s;
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

  protected readonly pages = computed(() => this.store.composition().pages)
  protected readonly clampedTab = computed(() => Math.min(this.activeTab(), Math.max(this.pages().length - 1, 0)))

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
}
