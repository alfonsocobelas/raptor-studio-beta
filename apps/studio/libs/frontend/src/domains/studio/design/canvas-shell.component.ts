import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core'
import { NgTemplateOutlet } from '@angular/common'
import { NgIcon, provideIcons } from '@ng-icons/core'
import { lucideMoon, lucideSun, lucideX } from '@ng-icons/lucide'
import { ActiveViewService } from './active-view.service'
import { CanvasAdminNavGroupComponent } from './canvas-admin-nav-group.component'
import { CanvasPageComponent } from './canvas-page.component'
import { CanvasSessionFooterComponent } from './canvas-session-footer.component'
import { DesignStore } from './design-store'
import { PreviewSettings } from './preview-settings'
import { ShellDescriptor } from './shell-descriptor'
import { SystemViewComponent } from './system-view.component'

/**
 * El shell de la app dibujada en el lienzo, pintado desde el descriptor de la piel (spec 69).
 *
 * Hay UNA forma —el raíl del neutro— desde que se retiraron las cinco pieles (2026-08-27); lo que
 * queda parametrizado es el ancho del raíl, el relleno del contenido y si lleva el grupo de
 * administración. Las ramas de la banda de marca, el raíl a contraste, los contadores y las
 * barras de estado se fueron con sus pieles: era marcado inalcanzable, y el espejo del emitido ya
 * había derivado dos veces por sostener copias de más.
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
    <!-- El contenido del lienzo no depende del shell: se escribe una vez. -->
    <ng-template #content>
      @if (active.systemView(); as system) {
        <studio-system-view [viewId]="system" />
      } @else {
        <studio-canvas-page [pageIndex]="active.index()" (select)="active.selectResource($event)" />
      }
    </ng-template>

    <!-- La navegación vive en una columna, con bg-card y el borde del tema. -->
    <aside
      class="preview-side bg-card flex shrink-0 flex-col border-r p-4"
      [class]="shell().railWidth"
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
    <section class="min-w-0 flex-1" [class]="shell().padding">
      <ng-container [ngTemplateOutlet]="content" />
    </section>

    <!-- ── las piezas del raíl ────────────────────────────────────────────────────────────── -->

    <ng-template #railHeader>
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
    </ng-template>

    <ng-template #railNav>
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
    </ng-template>

    <ng-template #railFooter>
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

  protected readonly pages = computed(() => this.store.pages())
}
