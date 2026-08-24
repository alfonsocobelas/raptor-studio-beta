import { ChangeDetectionStrategy, Component, computed, effect, inject, isDevMode, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { PreviewSettings, presetChrome } from './preview-settings'
import { previewThemeVars } from './preview-theme'
import { productMark } from './product-mark'
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
import { STUDIO_MODES } from './studio-modes'
import { StudioModeService } from './studio-mode.service'
import { ActiveViewService } from './active-view.service'
import { CanvasNoticeService, type CanvasNotice } from './canvas-notice.service'
import { DesignStore } from './design-store'
import { DesignHistoryService } from './design-history.service'
import { CanvasPageComponent } from './canvas-page.component'
import { SystemViewComponent } from './system-view.component'
import { SYSTEM_VIEWS } from './system-preview/system-views'
import { mockTotal } from './mock-data'
import { ModelViewComponent } from './model-view.component'
import { FlowViewComponent } from './flow-view.component'
import { ViewsSidebarComponent } from './views-sidebar.component'
import { ModelSidebarComponent } from './model-sidebar.component'
import { FlowSidebarComponent } from './flow-sidebar.component'
import { AccessSidebarComponent } from './access-sidebar.component'
import { AccessSummaryComponent } from './access-summary.component'
import { AccessUiService } from './access-ui.service'
import { AccessViewComponent } from './access-view.component'
import { DesignPanelComponent } from './design-panel.component'
import { ModelPanelComponent } from './model-panel.component'
import { FlowPanelComponent } from './flow-panel.component'
import { ModelSummaryComponent } from './model-summary.component'
import { CanvasHeaderComponent } from './canvas-header.component'
import { ChatPanelComponent } from '../chat/chat-panel.component'
import { GeneratePageComponent } from '../generate/generate-page.component'
import { GenerateRunner } from '../generate/generate-runner'
import { hasPublishableDesign, spelled } from '../generate/wizard-command'

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
    SystemViewComponent,
    ChatPanelComponent,
    GeneratePageComponent,
    ModelViewComponent,
    FlowViewComponent,
    ViewsSidebarComponent,
    ModelSidebarComponent,
    FlowSidebarComponent,
    AccessSidebarComponent,
    AccessSummaryComponent,
    AccessViewComponent,
    DesignPanelComponent,
    ModelPanelComponent,
    FlowPanelComponent,
    ModelSummaryComponent,
    CanvasHeaderComponent
  ],
  providers: [provideIcons(STUDIO_ICONS)],
  host: {
    '(document:click)': 'onDocumentClick($event)',
    '(document:keydown.escape)': 'designMenu.set(false)'
  },
  template: `
    <div class="flex h-screen flex-col">
      <header class="bg-card studio-chrome flex items-center gap-3 border-b px-4 py-2">
        <!-- marca del producto -->
        <div class="flex shrink-0 items-center gap-2" data-testid="product-logo">
          <svg class="size-7" viewBox="0 0 32 32" role="img" aria-label="Raptor Studio">
            <rect width="32" height="32" rx="9" [attr.fill]="mark().background" data-testid="product-mark-plate" />
            <text
              x="16"
              y="17"
              text-anchor="middle"
              dominant-baseline="central"
              font-family="Helvetica Neue, Helvetica, Arial, sans-serif"
              font-size="17"
              font-weight="700"
              [attr.fill]="mark().letter"
              data-testid="product-mark-letter"
            >
              R
            </text>
          </svg>
          <span class="studio-eyebrow self-start pt-1" data-testid="product-version" title="Versión beta">beta</span>
        </div>

        <!-- historial de diseños (spec 21): selector + indicador de guardado -->
        <div class="relative" data-menu-root="design">
          <button
            type="button"
            class="toolbar-item studio-ui flex items-center gap-1.5"
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
              class="studio-nav hover:bg-accent/60"
              [class.bg-muted]="mode() === tab.mode"
              [class.text-muted-foreground]="mode() !== tab.mode"
              [attr.data-testid]="'mode-' + tab.mode"
              (click)="mode.set(tab.mode)"
            >
              {{ tab.label }}
            </button>
          }
        </nav>

        <span class="flex-1"></span>
        @if (mode() === 'model') {
          <studio-model-summary />
        }
        @if (mode() === 'flows' && active.flow(); as flow) {
          <span class="studio-eyebrow" data-testid="flow-summary">{{ flow }}</span>
        }
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
        <!-- Sin una vista con bloques no hay nada que generar: el botón se queda apagado.
             Con la obra en segundo plano, el botón ES la obra: cuenta el tiempo y reabre. -->
        <button
          type="button"
          class="bg-primary text-primary-foreground generate-cta rounded-md px-4 py-2 text-sm font-medium disabled:opacity-40"
          data-testid="open-wizard"
          [disabled]="!canPublish() && !runner.generating()"
          [title]="
            runner.generating()
              ? 'La generación sigue en marcha: vuelve a verla'
              : canPublish()
                ? 'Generar aplicación'
                : 'Diseña al menos una vista con un bloque antes de generar'
          "
          (click)="wizardOpen.set(true)"
        >
          {{ runner.generating() ? 'Generando · ' + workClock() : 'Generar aplicación' }}
        </button>
      </header>

      @if (wizardOpen()) {
        <studio-generate-page (close)="wizardOpen.set(false)" />
      }

      <div class="flex min-h-0 flex-1">
        @if (mode() === 'views') {
          <studio-views-sidebar />
        } @else if (mode() === 'model') {
          <studio-model-sidebar />
        } @else if (mode() === 'flows') {
          <studio-flow-sidebar />
        } @else if (mode() === 'access') {
          <studio-access-sidebar />
        }
        <div
          class="relative flex min-h-0 min-w-0 flex-1 flex-col"
          [class.canvas-surface]="mode() === 'views'"
          [class.bg-background]="mode() !== 'views'"
        >
          <!-- el hueco inferior deja pasar la sombra del mockup y el alto del chat en reposo;
               justo eso y nada más, para que el chat quede pegado a la vista -->
          <main
            class="min-h-0 flex-1 overflow-auto"
            [class.px-10]="mode() === 'views'"
            [class.pb-24]="mode() === 'views'"
            [class.pt-6]="mode() === 'views'"
            [class.p-8]="mode() === 'flows'"
          >
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
              <studio-access-view />
            } @else if (active.systemView() === 'login') {
              <!-- el login es una página completa en la app real: sin shell, solo el marco temado -->
              <div
                class="preview-scope bg-background canvas-card mx-auto min-h-[85%] overflow-hidden rounded-xl border"
                [class.max-w-6xl]="!active.systemView()"
                [style]="previewVars()"
                [attr.data-palette]="preview.palette()"
                [attr.data-preset]="preview.preset()"
                [class.dark]="preview.theme() === 'dark'"
                data-testid="preview-scope"
              >
                <studio-system-view class="block w-full" viewId="login" />
              </div>
            } @else if (!pages().length && !active.systemView()) {
              <div class="flex h-full flex-col items-center justify-center text-center" data-testid="empty-canvas">
                <p class="text-muted-foreground mb-2 text-lg">Lienzo en blanco</p>
                <p class="text-muted-foreground max-w-md text-sm">
                  Empieza con <strong>Nueva vista</strong> en el panel de la izquierda, o descríbele tu aplicación al
                  chat: «una web para mi frutería con stock».
                </p>
              </div>
            } @else {
              <div
                class="preview-scope bg-background canvas-card mx-auto min-h-[85%] overflow-hidden rounded-xl border"
                [class.max-w-6xl]="!active.systemView()"
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
                    Inicio › <span class="text-foreground font-semibold">{{ activeTitle() }}</span>
                  </div>
                  <section class="min-w-0 flex-1 p-4">
                    @if (active.systemView(); as system) {
                      <studio-system-view [viewId]="system" />
                    } @else {
                      <studio-canvas-page [pageIndex]="active.index()" (select)="active.selectResource($event)" />
                    }
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
                    <button
                      type="button"
                      class="flex w-full items-center gap-2 px-4 py-2.5 text-left text-[12px]"
                      style="border-top: 1px solid var(--preview-shell-border); color: var(--preview-shell-fg)"
                      data-testid="mock-session-footer-cabina"
                      title="Mi cuenta"
                      (click)="active.selectSystem('account')"
                    >
                      <span
                        class="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold"
                        style="background: var(--preview-shell-active)"
                        >AL</span
                      >
                      <span>Admin Local</span>
                    </button>
                    <button
                      type="button"
                      class="w-full px-4 py-1.5 text-left text-[11px] opacity-80"
                      style="color: var(--preview-shell-fg)"
                      data-testid="mock-logout-cabina"
                      (click)="active.selectSystem('login')"
                    >
                      Cerrar sesión
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
                      @if (active.systemView(); as system) {
                      <studio-system-view [viewId]="system" />
                    } @else {
                      <studio-canvas-page [pageIndex]="active.index()" (select)="active.selectResource($event)" />
                    }
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
                    <!-- espejo del emitido: sección Administración (solo admin) → vista Usuarios -->
                    <p class="text-muted-foreground mt-4 px-3 text-[10px] font-semibold tracking-wide uppercase">
                      Administración
                    </p>
                    <nav class="flex flex-col gap-1">
                      <button
                        type="button"
                        class="hover:bg-accent/60 w-full rounded-md px-3 py-2 text-left text-sm"
                        [class.bg-accent]="active.systemView() === 'users'"
                        [class.font-semibold]="active.systemView() === 'users'"
                        data-testid="mock-nav-users"
                        (click)="active.selectSystem('users')"
                      >
                        Usuarios
                      </button>
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
                    <!-- pie de sesión de la maqueta (spec 63): el chip abre el menú, como el emitido -->
                    <div class="relative border-t px-1 pt-2">
                      @if (mockMenu()) {
                        <div
                          class="bg-background absolute bottom-full left-1 z-30 mb-2 w-52 rounded-lg border p-1 shadow-md"
                          data-testid="mock-session-menu"
                        >
                          <button
                            type="button"
                            class="hover:bg-accent block w-full rounded-md px-2 py-1.5 text-left text-xs"
                            data-testid="mock-my-account"
                            (click)="mockMenu.set(false); active.selectSystem('account')"
                          >
                            Cuenta
                          </button>
                          <button
                            type="button"
                            class="hover:bg-accent block w-full rounded-md px-2 py-1.5 text-left text-xs"
                            data-testid="mock-logout"
                            (click)="mockMenu.set(false); active.selectSystem('login')"
                          >
                            Cerrar sesión
                          </button>
                        </div>
                      }
                      <button
                        type="button"
                        class="text-muted-foreground hover:bg-accent/60 flex w-full items-center gap-2 rounded px-1 py-1.5 text-left text-xs"
                        data-testid="mock-session-footer"
                        [attr.aria-expanded]="mockMenu()"
                        (click)="mockMenu.set(!mockMenu())"
                      >
                        <div
                          class="bg-primary text-primary-foreground flex h-7 w-7 items-center justify-center rounded-lg font-semibold"
                        >
                          AL
                        </div>
                        <div class="min-w-0 flex-1">
                          <p class="text-foreground truncate font-medium">Admin Local</p>
                          <p class="truncate">admin&#64;app.local</p>
                        </div>
                        <ng-icon name="lucideChevronUp" size="12" />
                      </button>
                    </div>
                  </aside>
                  <section class="min-w-0 flex-1 p-6">
                    @if (active.systemView(); as system) {
                      <studio-system-view [viewId]="system" />
                    } @else {
                      <studio-canvas-page [pageIndex]="active.index()" (select)="active.selectResource($event)" />
                    }
                  </section>
                }
              </div>
            }
          </main>

          <!-- El aviso del lienzo, sobre el chat: lo que acaba de pasar y adónde ir a verlo.
               Flota (no empuja el mockup) porque un salto de layout al soltar un bloque se
               confunde con el propio resultado del gesto. -->
          @if (notice.notice(); as current) {
            <div
              class="pointer-events-none absolute inset-x-0 z-30 flex justify-center px-10"
              [class.bottom-24]="mode() === 'views'"
              [class.bottom-28]="mode() !== 'views'"
            >
              <div
                class="bg-card canvas-notice pointer-events-auto flex max-w-2xl items-center gap-3 rounded-lg border px-3 py-2 text-sm"
                data-testid="canvas-notice"
              >
                <span>{{ current.text }}</span>
                @if (current.action; as action) {
                  <button
                    type="button"
                    class="shrink-0 font-semibold underline underline-offset-2"
                    data-testid="canvas-notice-action"
                    (click)="runNotice(action)"
                  >
                    {{ action.label }}
                  </button>
                }
                <button
                  type="button"
                  class="text-muted-foreground hover:text-foreground shrink-0"
                  title="Cerrar el aviso"
                  data-testid="canvas-notice-close"
                  (click)="notice.dismiss()"
                >
                  <ng-icon name="lucideX" size="13" />
                </button>
              </div>
            </div>
          }

          <!-- el chat FLOTA sobre el lienzo, anclado al pie: se le habla de lo que se está
               mirando y no le roba alto al lienzo. Sin altura fija: vacío es una barra, y
               con conversación crece hasta su tope. -->
          <div
            class="pointer-events-none absolute inset-x-0 z-20 px-10"
            [class.bottom-3]="mode() === 'views'"
            [class.bottom-5]="mode() !== 'views'"
          >
            <!-- centrado en todos los lienzos; en los diagramas la barra es más estrecha -->
            <div
              class="bg-card chat-card pointer-events-auto mx-auto max-h-72 rounded-xl border p-3"
              [class.max-w-6xl]="mode() === 'views'"
              [class.max-w-xl]="mode() !== 'views'"
            >
              <studio-chat-panel />
            </div>
          </div>
        </div>

<!-- Accesos trae su propio panel derecho (el resumen del rol) y solo en el pivote Rol:
             el de Vistas no pinta nada ahí, y una cuarta columna sobra. -->
        @if (mode() === 'views' && active.systemView()) {
          <!-- una vista de sistema no se edita: el panel se pliega y el lienzo gana su ancho -->
        } @else if (mode() !== 'access') {
          <aside class="studio-rail studio-rail-end flex w-80 shrink-0 flex-col border-l p-4">
            @if (mode() === 'model') {
              <studio-model-panel />
            } @else if (mode() === 'flows') {
              <studio-flow-panel />
            } @else {
              <studio-design-panel />
            }
          </aside>
        } @else if (accessUi.pivot() === 'role') {
          <aside class="studio-rail studio-rail-end flex w-80 shrink-0 flex-col border-l p-4">
            <studio-access-summary />
          </aside>
        }
      </div>
    </div>
  `,
  styles: `
    /* En noche el CTA dominante se invierte a papel y un botón blanco es lo que más
       pesa de la pantalla. Toma el naranja de la marca —el mismo #f15539— con la
       tinta oscura encima, igual que la entidad elegida del diagrama. */
    :host-context(.dark) .generate-cta:not(:disabled) {
      background-color: #f15539;
      color: var(--brand-foreground);
    }
    /* Papel del lienzo: el MISMO que el de Modelo y Flujos, --background a secas
       (decisión de Alfonso, 2026-08-11: el gris cálido de docs/style oscurecía
       demasiado). Rejilla de PUNTOS con la misma geometría que allí —celda de 24px—
       pero el punto en el naranja #d75f3d al 35% —a opacidad plena la retícula cantaba
       más que la maqueta—, no en tinta. */
    :host {
      /* La tinta de la rejilla del lienzo: la comparten los puntos y el borde del chat,
         así el estudio no tiene dos naranjas distintos. */
      --canvas-ink: color-mix(in oklab, #d75f3d 35%, transparent);
    }
    .canvas-surface {
      background-color: var(--background);
      background-image: radial-gradient(circle, var(--canvas-ink) 1.4px, transparent 1.4px);
      background-size: 24px 24px;
      background-position: -12px -12px;
    }
    /* Sombreado por TODO el borde, no solo hacia abajo: un anillo de 1px que perfila
       la tarjeta y un halo simétrico que la despega del papel también por arriba y
       por los lados. Cabe entera en el padding del scroll (pt-6/px-10/pb-24), así
       el recorte del overflow no deja una línea. */
    .canvas-card {
      box-shadow:
        0 0 0 1px oklch(0 0 0 / 5%),
        0 1px 2px oklch(0 0 0 / 6%),
        0 0 20px oklch(0 0 0 / 10%),
        0 10px 32px -10px oklch(0 0 0 / 16%);
    }
    /* En noche la sombra negra se pierde contra el papel oscuro: el contorno lo hace
       un anillo claro tenue, y el halo sube de peso para que aún se lea la elevación. */
    :host-context(.dark) .canvas-card {
      box-shadow:
        0 0 0 1px oklch(1 0 0 / 12%),
        0 0 24px oklch(0 0 0 / 45%),
        0 12px 36px -10px oklch(0 0 0 / 55%);
    }
    /* El chat FLOTA sobre el lienzo, así que necesita sombra por los cuatro lados y
       algo más de contraste que una tarjeta apoyada: un halo corto lo separa del papel
       y de la rejilla del modelo. */
    .chat-card {
      border-color: var(--canvas-ink);
      box-shadow:
        0 0 0 1px oklch(0 0 0 / 4%),
        0 2px 6px oklch(0 0 0 / 8%),
        0 10px 24px -8px oklch(0 0 0 / 16%),
        0 24px 48px -20px oklch(0 0 0 / 18%);
    }
    /* El aviso comparte el halo del chat —flota sobre el mismo papel— pero se recorta en
       el naranja pleno del estudio: es la única cosa del lienzo que reclama la vista. */
    .canvas-notice {
      border-color: #d75f3d;
      box-shadow:
        0 2px 6px oklch(0 0 0 / 8%),
        0 12px 28px -10px oklch(0 0 0 / 18%);
    }
    /* En oscuro la sombra no separa nada y el naranja al 35% se apaga contra el papel
       negativo: el chat se confundía con el fondo. Probamos a separarlo por luminosidad
       (relleno más claro, borde discreto) y Alfonso lo descartó en pantalla (2026-08-12):
       aquí el borde va a naranja pleno y medio píxel más ancho. */
    :host-context(.dark) .chat-card {
      border-color: #d75f3d;
      border-width: 1.5px;
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
  /** La marca sigue al tema DEL ESTUDIO, no al de la app dibujada en el lienzo. */
  protected readonly mark = computed(() => productMark(this.preview.studioTheme()))

  protected readonly modes = STUDIO_MODES
  private readonly studioMode = inject(StudioModeService)
  protected readonly accessUi = inject(AccessUiService)
  protected readonly mode = this.studioMode.mode
  protected readonly designMenu = signal(false)
  // menú del chip de usuario de la maqueta (spec 63)
  protected readonly mockMenu = signal(false)
  protected readonly renameSlug = signal('')
  protected readonly devMode = isDevMode()
  protected readonly active = inject(ActiveViewService)
  protected readonly notice = inject(CanvasNoticeService)

  protected readonly pages = computed(() => this.store.pages())

  /** Título de la miga: la vista del diseño o, si hay una abierta, la de sistema (spec 57). */
  protected readonly activeTitle = computed(() => {
    const system = this.active.systemView()
    if (system) return SYSTEM_VIEWS.find(view => view.id === system)?.title ?? system
    return this.pages()[this.active.index()]?.title ?? ''
  })

  /** «Antes de generar» (spec 41): una capa sobre el lienzo, no una ruta ni un diálogo. */
  protected readonly wizardOpen = signal(false)
  /** La obra en segundo plano (spec 42): el botón cuenta el tiempo y el aviso pide reabrir. */
  protected readonly runner = inject(GenerateRunner)
  protected readonly workClock = computed(() => spelled(this.runner.seconds()))
  /** Sin una vista con bloques no hay nada que generar. */
  protected readonly canPublish = computed(() => hasPublishableDesign(this.store.pages()))

  /** Seguir el aviso lo cierra: ya cumplió, y su sitio lo ocupará el gesto siguiente. */
  protected runNotice(action: NonNullable<CanvasNotice['action']>): void {
    action.run()
    this.notice.dismiss()
  }

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
    // el aviso de «terminó en segundo plano» pide ver el resultado: se atiende reabriendo
    effect(() => {
      if (this.runner.viewRequested()) {
        this.runner.viewRequested.set(false)
        this.wizardOpen.set(true)
      }
    })
  }

  /** El menú de diseños se cierra al pulsar fuera; su propio clic se reconoce por la raíz. */
  protected onDocumentClick(event: Event): void {
    if (!this.designMenu()) return
    const inside = (event.target as HTMLElement | null)?.closest('[data-menu-root="design"]')
    if (!inside) this.designMenu.set(false)
  }

  protected renameDesign(): void {
    const slug = this.renameSlug().trim()
    if (!slug) return
    void this.history.rename(slug)
    this.renameSlug.set('')
    this.designMenu.set(false)
  }
}
