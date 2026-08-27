import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core'
import { NgTemplateOutlet } from '@angular/common'
import { NgIcon, provideIcons } from '@ng-icons/core'
import { lucideMoon, lucideSun, lucideX } from '@ng-icons/lucide'
import { ActiveViewService } from './active-view.service'
import { CanvasAdminNavGroupComponent } from './canvas-admin-nav-group.component'
import { CanvasPageComponent } from './canvas-page.component'
import { CanvasSessionFooterComponent } from './canvas-session-footer.component'
import { DesignStore } from './design-store'
import { mockTotal } from './mock-data'
import { PreviewSettings } from './preview-settings'
import { ShellDescriptor } from './shell-descriptor'
import { SystemViewComponent } from './system-view.component'
import { SYSTEM_VIEWS } from './system-preview/system-views'

/**
 * El shell de la app dibujada en el lienzo, pintado desde el descriptor de la piel (spec 69).
 *
 * Antes esto era un `@if` por piel dentro de la plantilla del lienzo. Con tres pieles nuevas
 * habrían sido cinco ramas de ~60 líneas cada una, y el espejo ya había derivado dos veces
 * respecto al emitido. Aquí hay DOS formas —raíl y banda— y lo que distingue a cada piel son los
 * campos de `ShellDescriptor`.
 *
 * El anfitrión es `display: contents` a propósito: el `<aside>` y la `<section>` tienen que
 * seguir siendo hijos DIRECTOS del flex de `.preview-scope`, o el shell se descolocaría por el
 * simple hecho de haberlo extraído a un componente.
 */
@Component({
  selector: 'studio-canvas-shell',
  imports: [
    NgIcon,
    NgTemplateOutlet,
    CanvasAdminNavGroupComponent,
    CanvasSessionFooterComponent,
    CanvasPageComponent,
    SystemViewComponent
  ],
  providers: [provideIcons({ lucideX, lucideMoon, lucideSun })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- El contenido del lienzo es el MISMO en todas las pieles: se escribe una vez. -->
    <ng-template #content>
      @if (active.systemView(); as system) {
        <studio-system-view [viewId]="system" />
      } @else {
        <studio-canvas-page [pageIndex]="active.index()" (select)="active.selectResource($event)" />
      }
    </ng-template>

    @if (shell().layout === 'banner') {
      <!-- Forma «banda»: réplica de files-design/suite — banda de marca + pestañas de módulo +
           miga sobre banda sombreada. Sin usuario en la banda: el real no lo lleva. -->
      <header
        class="flex h-10 shrink-0 items-center gap-3 px-4"
        style="background: var(--banner-bg); color: var(--banner-fg)"
        data-testid="mock-banner"
      >
        <span class="text-sm font-semibold capitalize tracking-wide">{{ store.appName() }}</span>
        <span class="h-4 w-px bg-current opacity-30"></span>
        <span class="text-xs opacity-70">{{ shell().banner?.subtitle }}</span>
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
      @if (shell().banner?.modules) {
        <nav class="bg-card flex shrink-0 border-b px-3" data-testid="mock-modules">
          @for (page of pages(); track $index) {
            @if (!page.drillDown) {
              <div class="group relative">
                <button
                  type="button"
                  class="text-muted-foreground border-b-[3px] border-transparent px-4 py-2 text-[12.5px]"
                  [class.border-b-primary]="$index === active.designIndex()"
                  [class.text-foreground]="$index === active.designIndex()"
                  [class.font-semibold]="$index === active.designIndex()"
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
      }
      @if (shell().statusbar === 'crumb') {
        <div
          class="text-muted-foreground shrink-0 border-b px-4 py-1.5 text-[11px]"
          style="background: var(--grid-head-bg, oklch(0.91 0.014 250))"
          data-testid="mock-breadcrumb"
        >
          Inicio › <span class="text-foreground font-semibold">{{ activeTitle() }}</span>
        </div>
      }
      <section class="min-w-0 flex-1" [class]="shell().padding">
        <ng-container [ngTemplateOutlet]="content" />
      </section>
    } @else if (rail(); as rail) {
      <!-- Forma «raíl»: la navegación vive en una columna. El neutro la pinta con bg-card y el
           borde del tema; las pieles con superficie propia usan sus tokens --shell-*. -->
      @if (rail.surface === 'shell') {
        <aside
          class="flex shrink-0 flex-col"
          [class]="rail.width"
          style="background: var(--shell-bg); border-right: 1px solid var(--shell-border)"
          data-testid="mock-sidebar"
        >
          <ng-container [ngTemplateOutlet]="railHeader" />
          <ng-container [ngTemplateOutlet]="railNav" />
          <span class="flex-1"></span>
          <ng-container [ngTemplateOutlet]="railFooter" />
        </aside>
      } @else {
        <aside
          class="preview-side bg-card flex shrink-0 flex-col border-r p-4"
          [class]="rail.width"
          data-testid="mock-sidebar"
        >
          <ng-container [ngTemplateOutlet]="railHeader" />
          <ng-container [ngTemplateOutlet]="railNav" />
          @if (shell().adminNav) {
            <!-- espejo del emitido: grupo desplegable Administración (solo admin) → vista Usuarios -->
            <app-canvas-admin-nav-group />
          }
          <span class="flex-1"></span>
          <ng-container [ngTemplateOutlet]="railFooter" />
        </aside>
      }
      @if (shell().statusbar === 'path') {
        <div class="flex min-w-0 flex-1 flex-col">
          <!-- barra de estado de la maqueta: contexto / sección, en monospace -->
          <div
            class="mono-data flex h-8 shrink-0 items-center px-5 text-[11px]"
            style="background: var(--shell-bg); border-bottom: 1px solid var(--shell-border); color: var(--shell-fg)"
            data-testid="mock-statusbar"
          >
            <span class="lowercase">{{ store.appName() }}</span>
            <span class="mx-1.5 opacity-60">/</span>
            <span class="lowercase" style="color: var(--shell-fg-strong)">
              {{ activeTitle() }}
            </span>
          </div>
          <section class="min-w-0 flex-1" [class]="shell().padding">
            <ng-container [ngTemplateOutlet]="content" />
          </section>
        </div>
      } @else {
        <section class="min-w-0 flex-1" [class]="shell().padding">
          <ng-container [ngTemplateOutlet]="content" />
        </section>
      }
    }

    <!-- ── las piezas del raíl ────────────────────────────────────────────────────────────── -->

    <ng-template #railHeader>
      @if (rail(); as rail) {
        @if (rail.header === 'eyebrow') {
          <div class="px-4 py-3" style="border-bottom: 1px solid var(--shell-border)">
            <p class="text-[13px] font-bold capitalize tracking-wide" style="color: var(--shell-fg-strong)">
              {{ store.appName() }}
            </p>
            <p class="mt-0.5 text-[10px] font-medium uppercase tracking-[0.12em]" style="color: var(--shell-fg)">
              {{ rail.eyebrow }}
            </p>
          </div>
        } @else {
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
        }
      }
    </ng-template>

    <ng-template #railNav>
      @if (rail(); as rail) {
        @if (rail.navDensity === 'house-tight') {
          <!-- La casa, apretada (spec 69): 12,5px y radio del token. Mismo marcado que el shell
               emitido de «banco». -->
          <nav class="flex flex-col gap-px p-1.5">
            @for (page of pages(); track $index) {
              @if (!page.drillDown) {
                <div class="group relative">
                  <button
                    type="button"
                    class="w-full rounded-md px-2.5 py-1 text-left text-[12.5px]"
                    [style.color]="$index === active.designIndex() ? 'var(--shell-fg-strong)' : 'var(--shell-fg)'"
                    [style.background]="$index === active.designIndex() ? 'var(--shell-active)' : ''"
                    [style.box-shadow]="$index === active.designIndex() ? 'inset 2px 0 0 var(--shell-accent)' : ''"
                    [class.font-semibold]="$index === active.designIndex()"
                    [attr.data-testid]="'nav-page-' + $index"
                    (click)="active.select($index)"
                  >
                    {{ page.title }}
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
        } @else if (rail.navDensity === 'house') {
          <!-- La métrica del propio estudio (spec 69): 13px/600, radio de 7px y el activo con el
               papel de la tarjeta y el marcador en el acento del TEMA. Mismo marcado que el
               shell emitido de la familia raptor, para que el espejo no vuelva a derivar. -->
          <nav class="flex flex-col gap-0.5 p-2">
            @for (page of pages(); track $index) {
              @if (!page.drillDown) {
                <div class="group relative">
                  <button
                    type="button"
                    class="w-full rounded-[7px] px-3 py-1.5 text-left text-[13px] font-semibold"
                    [style.color]="$index === active.designIndex() ? 'var(--shell-fg-strong)' : 'var(--shell-fg)'"
                    [style.background]="$index === active.designIndex() ? 'var(--shell-active)' : ''"
                    [style.box-shadow]="$index === active.designIndex() ? 'inset 2px 0 0 var(--shell-accent)' : ''"
                    [attr.data-testid]="'nav-page-' + $index"
                    (click)="active.select($index)"
                  >
                    {{ page.title }}
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
        } @else if (rail.navDensity === 'compact') {
          <nav class="flex flex-col gap-px p-2">
            @for (page of pages(); track $index) {
              @if (!page.drillDown) {
                <div class="group relative">
                  <button
                    type="button"
                    class="flex w-full items-center justify-between rounded-sm px-3 py-1.5 text-left text-[12.5px]"
                    [style.color]="$index === active.designIndex() ? 'var(--shell-fg-strong)' : 'var(--shell-fg)'"
                    [style.background]="$index === active.designIndex() ? 'var(--shell-active)' : ''"
                    [style.box-shadow]="$index === active.designIndex() ? 'inset 2px 0 0 var(--primary)' : ''"
                    [class.font-semibold]="$index === active.designIndex()"
                    [attr.data-testid]="'nav-page-' + $index"
                    (click)="active.select($index)"
                  >
                    <span>{{ page.title }}</span>
                    <!-- contador por recurso, la seña del centro de operaciones (maqueta skindemo) -->
                    @if (rail.counters && pageCount($index); as count) {
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
        } @else {
          <nav class="flex flex-col gap-1">
            @for (page of pages(); track $index) {
              @if (!page.drillDown) {
                <div class="group relative">
                  <button
                    type="button"
                    class="hover:bg-accent/60 w-full rounded-md px-3 py-2 text-left text-sm"
                    [class.bg-accent]="$index === active.designIndex()"
                    [class.font-semibold]="$index === active.designIndex()"
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
        }
      }
    </ng-template>

    <ng-template #railFooter>
      @if (rail(); as rail) {
        @if (rail.footer === 'inline') {
          <button
            type="button"
            class="flex items-center gap-2 px-4 py-2.5 text-[12px]"
            style="border-top: 1px solid var(--shell-border); color: var(--shell-fg)"
            data-testid="mock-theme-toggle"
            (click)="preview.toggleTheme()"
          >
            {{ preview.theme() === 'light' ? '🌙' : '☀️' }}
            <span>{{ preview.theme() === 'light' ? 'Tema oscuro' : 'Tema claro' }}</span>
          </button>
          <button
            type="button"
            class="flex w-full items-center gap-2 px-4 py-2.5 text-left text-[12px]"
            style="border-top: 1px solid var(--shell-border); color: var(--shell-fg)"
            data-testid="mock-session-footer-cabina"
            title="Mi cuenta"
            (click)="active.selectSystem('account')"
          >
            <span
              class="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold"
              style="background: var(--shell-active)"
              >AL</span
            >
            <span>Admin Local</span>
          </button>
          <button
            type="button"
            class="w-full px-4 py-1.5 text-left text-[11px] opacity-80"
            style="color: var(--shell-fg)"
            data-testid="mock-logout-cabina"
            (click)="active.selectSystem('login')"
          >
            Cerrar sesión
          </button>
        } @else {
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
          <!-- pie de sesión de la maqueta (spec 63): calco del session-footer emitido -->
          <app-canvas-session-footer />
        }
      }
    </ng-template>
  `,
  styles: `
    /* El shell no es una caja: sus hijos son los del flex de .preview-scope. Sin esto, extraer
       el shell a un componente habría metido un contenedor de más y descolocado el raíl. */
    :host {
      display: contents;
    }
  `
})
export class CanvasShellComponent {
  readonly shell = input.required<ShellDescriptor>()

  protected readonly store = inject(DesignStore)
  protected readonly preview = inject(PreviewSettings)
  protected readonly active = inject(ActiveViewService)

  protected readonly rail = computed(() => this.shell().rail)
  protected readonly pages = computed(() => this.store.pages())

  /** Título de la miga: la vista del diseño o, si hay una abierta, la de sistema (spec 57). */
  protected readonly activeTitle = computed(() => {
    const system = this.active.systemView()
    if (system) return SYSTEM_VIEWS.find(view => view.id === system)?.title ?? system
    return this.pages()[this.active.index()]?.title ?? ''
  })

  protected pageCount(index: number): string {
    const page = this.pages()[index]
    const resource = page?.blocks.find(block => block.resource)?.resource
    if (!resource) return ''
    const position = this.store.resources().findIndex(r => r.name === resource)
    if (position < 0) return ''
    const total = mockTotal(position)
    return total >= 1000 ? `${(total / 1000).toFixed(1)}k` : String(total)
  }
}
