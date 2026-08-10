import { ChangeDetectionStrategy, Component, computed, inject, isDevMode, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { PreviewSettings, presetChrome } from './preview-settings'
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
import { STUDIO_MODES, type StudioMode } from './studio-modes'
import { ActiveViewService } from './active-view.service'
import { DesignStore } from './design-store'
import { DesignHistoryService } from './design-history.service'
import { CanvasPageComponent } from './canvas-page.component'
import { mockTotal } from './mock-data'
import { ModelViewComponent } from './model-view.component'
import { FlowViewComponent } from './flow-view.component'
import { ViewsSidebarComponent } from './views-sidebar.component'
import { DesignPanelComponent } from './design-panel.component'
import { CanvasHeaderComponent } from './canvas-header.component'
import { ChatPanelComponent } from '../chat/chat-panel.component'
import { GenerateWizardComponent } from '../generate/generate-wizard.component'

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
    ChatPanelComponent,
    GenerateWizardComponent,
    ModelViewComponent,
    FlowViewComponent,
    ViewsSidebarComponent,
    DesignPanelComponent,
    CanvasHeaderComponent
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
        </div>

        <!-- historial de diseños (spec 21): selector + indicador de guardado -->
        <div class="relative">
          <button
            type="button"
            class="toolbar-item flex items-center gap-1.5"
            data-testid="design-menu-toggle"
            (click)="designMenu.set(!designMenu())"
          >
            <span
              class="inline-block h-2 w-2 rounded-full"
              [class.bg-emerald-500]="history.saveState() === 'saved'"
              [class.bg-amber-500]="history.saveState() === 'saving'"
              [class.bg-destructive]="history.saveState() === 'error'"
              [class.bg-muted-foreground]="history.saveState() === 'idle'"
              [attr.data-testid]="'save-state-' + history.saveState()"
              [attr.title]="'Guardado: ' + history.saveState()"
            ></span>
            {{ store.appName() }}
          </button>
          @if (designMenu()) {
            <div class="bg-background absolute left-0 top-9 z-30 w-72 rounded-md border p-1 shadow-md">
              @for (design of history.designs(); track design.slug) {
                <div class="group flex items-center">
                  <button
                    type="button"
                    class="hover:bg-accent flex-1 rounded px-2 py-1.5 text-left text-sm"
                    [class.font-semibold]="design.slug === history.activeSlug()"
                    [attr.data-testid]="'design-open-' + design.slug"
                    (click)="designMenu.set(false); history.select(design.slug)"
                  >
                    {{ design.appName }}
                    <span class="text-muted-foreground block text-xs">{{ design.slug }}</span>
                  </button>
                  <button
                    type="button"
                    class="text-destructive hidden px-2 text-xs group-hover:block"
                    [attr.data-testid]="'design-delete-' + design.slug"
                    title="Borrar diseño"
                    (click)="history.remove(design.slug)"
                  >
                    ✕
                  </button>
                </div>
              }
              @if (!history.designs().length) {
                <p class="text-muted-foreground px-2 py-1.5 text-xs">Aún no hay diseños guardados</p>
              }
              <div class="my-1 border-t"></div>
              <button
                type="button"
                class="hover:bg-accent block w-full rounded px-2 py-1.5 text-left text-sm"
                data-testid="design-new"
                (click)="designMenu.set(false); history.createNew()"
              >
                + Nuevo diseño
              </button>
              <form class="flex items-center gap-1 px-2 py-1.5" (ngSubmit)="renameDesign()">
                <input
                  class="border-input w-full rounded border px-1.5 py-0.5 text-xs"
                  name="designSlug"
                  placeholder="renombrar a… (kebab-case)"
                  [(ngModel)]="renameSlug"
                  data-testid="design-rename-input"
                />
                <button type="submit" class="bg-primary text-primary-foreground rounded px-1.5 py-0.5 text-xs">
                  ✓
                </button>
              </form>
              @if (history.lastProblem(); as problem) {
                <p class="text-destructive px-2 pb-1 text-xs" data-testid="design-problem">{{ problem }}</p>
              }
            </div>
          }
        </div>
        <div class="bg-border h-6 w-px"></div>

        <!-- navegación de primer nivel: la vista va primera (lavado de cara 2026-08-10) -->
        <nav class="flex items-center gap-1" data-testid="studio-modes">
          @for (tab of modes; track tab.mode) {
            <button
              type="button"
              class="hover:bg-accent/60 rounded-md px-3 py-1 text-sm"
              [class.bg-accent]="mode() === tab.mode"
              [class.font-semibold]="mode() === tab.mode"
              [class.text-muted-foreground]="mode() !== tab.mode"
              [attr.data-testid]="'mode-' + tab.mode"
              (click)="mode.set(tab.mode)"
            >
              {{ tab.label }}
            </button>
          }
        </nav>

        <span class="flex-1"></span>
        @if (store.lastError(); as error) {
          <span class="text-destructive max-w-80 truncate text-xs" data-testid="canvas-error">{{ error }}</span>
        }
        <button
          type="button"
          class="toolbar-item"
          [attr.title]="'Tema del estudio: ' + preview.studioTheme()"
          data-testid="studio-theme"
          (click)="preview.toggleStudioTheme()"
        >
          {{ preview.studioTheme() === 'light' ? '◐' : '◑' }}
        </button>
        <studio-generate-wizard />
      </header>

      <div class="flex min-h-0 flex-1">
        @if (mode() === 'views') {
          <studio-views-sidebar />
        }
        <div class="canvas-surface flex min-h-0 min-w-0 flex-1 flex-col">
          <!-- pb-10: sin ese aire el scroll recorta la sombra inferior y el mockup se funde con el chat -->
          <main class="min-h-0 flex-1 overflow-auto px-10 pb-10 pt-6">
            <!-- Punto de lectura del schema para los smoke tools. Solo en dev: en un
                 build de producción el JSON no llega nunca al DOM del cliente. -->
            @if (devMode) {
              <pre hidden data-testid="schema-json">{{ store.exportJson() }}</pre>
            }
            @if (mode() === 'views') {
              <studio-canvas-header />
            }
            @if (mode() === 'model') {
              <studio-model-view (select)="active.selectResource($event)" />
            } @else if (mode() === 'flows') {
              <studio-flow-view />
            } @else if (mode() === 'access') {
              <div
                class="flex h-full flex-col items-center justify-center text-center"
                data-testid="access-placeholder"
              >
                <p class="text-muted-foreground mb-2 text-lg">Accesos</p>
                <p class="text-muted-foreground max-w-md text-sm">
                  Quién entra y qué puede hacer. Todavía no está: se diseña en la siguiente tanda.
                </p>
              </div>
            } @else if (!pages().length) {
              <div class="flex h-full flex-col items-center justify-center text-center" data-testid="empty-canvas">
                <p class="text-muted-foreground mb-2 text-lg">Lienzo en blanco</p>
                <p class="text-muted-foreground max-w-md text-sm">
                  Empieza con <strong>Nueva vista</strong> en el panel de la izquierda, o descríbele tu aplicación al
                  chat: «una web para mi frutería con stock».
                </p>
              </div>
            } @else {
              <div
                class="preview-scope bg-background canvas-card mx-auto min-h-[85%] max-w-6xl overflow-hidden rounded-xl border"
                [class.flex]="preview.preset() !== 'suite'"
                [class.flex-col]="preview.preset() === 'suite'"
                [style]="previewVars()"
                [attr.data-palette]="preview.palette()"
                [attr.data-preset]="preview.preset()"
                [class.dark]="preview.theme() === 'dark'"
                data-testid="preview-scope"
              >
                @if (preview.preset() === 'suite') {
                  <!-- Shell «suite», réplica de files-design/suite: banda de marca + pestañas de
                     módulo + miga sobre banda sombreada. Sin usuario en la banda: el real no lo lleva. -->
                  <header
                    class="flex h-10 shrink-0 items-center gap-3 px-4"
                    style="background: var(--preview-banner-bg); color: var(--preview-banner-fg)"
                    data-testid="mock-banner"
                  >
                    <span class="text-sm font-semibold capitalize tracking-wide">{{ store.appName() }}</span>
                    <span class="h-4 w-px bg-current opacity-30"></span>
                    <span class="text-xs opacity-70">Panel de gestión</span>
                    <span class="flex-1"></span>
                    <button
                      type="button"
                      class="text-xs opacity-70"
                      data-testid="mock-theme-toggle"
                      (click)="preview.toggleTheme()"
                    >
                      {{ preview.theme() === 'light' ? '🌙' : '☀️' }}
                    </button>
                  </header>
                  <nav class="bg-card flex shrink-0 border-b px-3" data-testid="mock-modules">
                    @for (page of pages(); track $index) {
                      @if (!page.drillDown) {
                        <div class="group relative">
                          <button
                            type="button"
                            class="text-muted-foreground border-b-[3px] border-transparent px-4 py-2 text-[12.5px]"
                            [class.border-b-primary]="$index === active.index()"
                            [class.text-foreground]="$index === active.index()"
                            [class.font-semibold]="$index === active.index()"
                            [attr.data-testid]="'nav-page-' + $index"
                            (click)="active.select($index)"
                          >
                            {{ page.title }}
                          </button>
                          <button
                            type="button"
                            class="bg-destructive absolute -right-1 top-1 hidden h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white group-hover:flex"
                            [attr.data-testid]="'nav-close-' + $index"
                            (click)="store.removePage($index)"
                          >
                            <ng-icon name="lucideX" size="10" />
                          </button>
                        </div>
                      }
                    }
                  </nav>
                  <div
                    class="text-muted-foreground shrink-0 border-b px-4 py-1.5 text-[11px]"
                    style="background: var(--preview-grid-head, oklch(0.91 0.014 250))"
                    data-testid="mock-breadcrumb"
                  >
                    Inicio › <span class="text-foreground font-semibold">{{ pages()[active.index()]?.title }}</span>
                  </div>
                  <section class="min-w-0 flex-1 p-4">
                    <studio-canvas-page [pageIndex]="active.index()" (select)="active.selectResource($event)" />
                  </section>
                } @else if (preview.preset() === 'cabina') {
                  <!-- Shell «cabina», réplica de files-design/cabina: barra a contraste, cabecera
                     con subtítulo uppercase y el activo con barra izquierda — sin logo ni usuario. -->
                  <aside
                    class="flex w-56 shrink-0 flex-col"
                    style="background: var(--preview-shell-bg); border-right: 1px solid var(--preview-shell-border)"
                    data-testid="mock-sidebar"
                  >
                    <div class="px-4 py-3" style="border-bottom: 1px solid var(--preview-shell-border)">
                      <p
                        class="text-[13px] font-bold capitalize tracking-wide"
                        style="color: var(--preview-shell-fg-strong)"
                      >
                        {{ store.appName() }}
                      </p>
                      <p
                        class="mt-0.5 text-[10px] font-medium uppercase tracking-[0.12em]"
                        style="color: var(--preview-shell-fg)"
                      >
                        Centro de operaciones
                      </p>
                    </div>
                    <nav class="flex flex-col gap-px p-2">
                      @for (page of pages(); track $index) {
                        @if (!page.drillDown) {
                          <div class="group relative">
                            <button
                              type="button"
                              class="flex w-full items-center justify-between rounded-sm px-3 py-1.5 text-left text-[12.5px]"
                              [style.color]="
                                $index === active.index() ? 'var(--preview-shell-fg-strong)' : 'var(--preview-shell-fg)'
                              "
                              [style.background]="$index === active.index() ? 'var(--preview-shell-active)' : ''"
                              [style.box-shadow]="$index === active.index() ? 'inset 2px 0 0 var(--primary)' : ''"
                              [class.font-semibold]="$index === active.index()"
                              [attr.data-testid]="'nav-page-' + $index"
                              (click)="active.select($index)"
                            >
                              <span>{{ page.title }}</span>
                              <!-- contador por recurso, la seña del centro de operaciones (maqueta skindemo) -->
                              @if (pageCount($index); as count) {
                                <span class="mono-data text-[10.5px] opacity-70">{{ count }}</span>
                              }
                            </button>
                            <button
                              type="button"
                              class="bg-destructive absolute -right-1 top-1/2 hidden h-4 w-4 -translate-y-1/2 items-center justify-center rounded-full text-[9px] font-bold text-white group-hover:flex"
                              [attr.data-testid]="'nav-close-' + $index"
                              (click)="store.removePage($index)"
                            >
                              <ng-icon name="lucideX" size="10" />
                            </button>
                          </div>
                        }
                      }
                    </nav>
                    <span class="flex-1"></span>
                    <button
                      type="button"
                      class="flex items-center gap-2 px-4 py-2.5 text-[12px]"
                      style="border-top: 1px solid var(--preview-shell-border); color: var(--preview-shell-fg)"
                      data-testid="mock-theme-toggle"
                      (click)="preview.toggleTheme()"
                    >
                      {{ preview.theme() === 'light' ? '🌙' : '☀️' }}
                      <span>{{ preview.theme() === 'light' ? 'Tema oscuro' : 'Tema claro' }}</span>
                    </button>
                  </aside>
                  <div class="flex min-w-0 flex-1 flex-col">
                    <!-- barra de estado de la maqueta: contexto / sección, en monospace -->
                    <div
                      class="mono-data flex h-8 shrink-0 items-center px-5 text-[11px]"
                      style="background: var(--preview-shell-bg); border-bottom: 1px solid var(--preview-shell-border); color: var(--preview-shell-fg)"
                      data-testid="mock-statusbar"
                    >
                      <span class="lowercase">{{ store.appName() }}</span>
                      <span class="mx-1.5 opacity-60">/</span>
                      <span class="lowercase" style="color: var(--preview-shell-fg-strong)">
                        {{ pages()[active.index()]?.title }}
                      </span>
                    </div>
                    <section class="min-w-0 flex-1 p-5">
                      <studio-canvas-page [pageIndex]="active.index()" (select)="active.selectResource($event)" />
                    </section>
                  </div>
                } @else {
                  <aside
                    class="preview-side bg-card flex w-56 shrink-0 flex-col border-r p-4"
                    data-testid="mock-sidebar"
                  >
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
                              [class.bg-accent]="$index === active.index()"
                              [class.font-semibold]="$index === active.index()"
                              [attr.data-testid]="'nav-page-' + $index"
                              (click)="active.select($index)"
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
                    <studio-canvas-page [pageIndex]="active.index()" (select)="active.selectResource($event)" />
                  </section>
                }
              </div>
            }
          </main>

          <!-- el chat pertenece al lienzo: se le habla de lo que se está mirando. Sin
               altura fija: vacío es una barra, y con conversación crece hasta su tope. -->
          <div class="mx-auto mb-6 mt-3 w-full max-w-6xl shrink-0 px-10">
            <div class="bg-card canvas-card max-h-72 rounded-xl border p-3">
              <studio-chat-panel />
            </div>
          </div>
        </div>

        <aside class="bg-card flex w-80 shrink-0 flex-col border-l p-4">
          <studio-design-panel />
        </aside>
      </div>
    </div>
  `,
  styles: `
    /* Fondo liso: el mockup es el protagonista y la cuadrícula de puntos le competía. */
    .canvas-surface {
      background-color: color-mix(in oklab, var(--muted) 45%, var(--background));
    }
    /* El mockup flota sobre el papel: sombra ancha y difusa, no la de un dropdown. */
    .canvas-card {
      box-shadow:
        0 1px 2px oklch(0 0 0 / 7%),
        0 12px 32px -8px oklch(0 0 0 / 18%),
        0 32px 64px -16px oklch(0 0 0 / 14%);
    }
    /* La app previsualizada tiene SU PROPIO tema COMPLETO: aunque el estudio esté
       en oscuro, aquí se redefinen todos los tokens para que no se hereden. Los
       valores los pone [style] desde el catálogo — los mismos que se emitirán. */
    .preview-scope {
      --radius: 0.625rem;
      border-radius: var(--radius);
      color: var(--foreground);
    }
    /* Los shells de cabina y suite no se tiñen: se CAMBIAN (réplica de files-design/<preset>).
       El cromo de componentes vive en el styles.css global del estudio, mismo mecanismo que
       la app emitida — desde aquí la encapsulación no alcanza a los componentes hijos. */
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
  protected readonly history = inject(DesignHistoryService)
  protected readonly preview = inject(PreviewSettings)
  // el cromo del preset se suma a los tokens del tema: mismo [style], una sola pasada
  protected readonly previewVars = computed(() => ({
    ...previewThemeVars(this.preview.palette(), this.preview.theme()),
    ...presetChrome(this.preview.preset(), this.preview.theme())
  }))

  protected readonly modes = STUDIO_MODES
  protected readonly mode = signal<StudioMode>('views')
  protected readonly designMenu = signal(false)
  protected readonly renameSlug = signal('')
  protected readonly devMode = isDevMode()
  protected readonly active = inject(ActiveViewService)

  protected readonly pages = computed(() => this.store.pages())

  /**
   * Contador de la barra lateral de cabina. Mismo total de mockup que usan los KPIs y la
   * paginación, así que el lienzo no se contradice consigo mismo. Solo para vistas con recurso.
   */
  protected pageCount(index: number): string {
    const page = this.pages()[index]
    const resource = page?.blocks.find(block => block.resource)?.resource
    if (!resource) return ''
    const position = this.store.resources().findIndex(r => r.name === resource)
    if (position < 0) return ''
    const total = mockTotal(position)
    return total >= 1000 ? `${(total / 1000).toFixed(1)}k` : String(total)
  }

  constructor() {
    // restaurar el diseño activo y poblar el selector; sin API local el lienzo sigue
    void this.history.init()
  }

  protected renameDesign(): void {
    const slug = this.renameSlug().trim()
    if (!slug) return
    void this.history.rename(slug)
    this.renameSlug.set('')
    this.designMenu.set(false)
  }
}
