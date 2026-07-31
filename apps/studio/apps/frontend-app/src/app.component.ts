import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core'
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router'
import { toSignal } from '@angular/core/rxjs-interop'
import { filter, map } from 'rxjs'
import { HlmToasterImports } from '@spartan-ng/helm/sonner'
import { NAV_ITEMS } from './nav'

/** Rutas sin shell: las pantallas públicas de auth ocupan la página entera. */
const BARE_ROUTES = ['/login', '/forgot-password', '/reset-password', '/accept-invitation', '/studio']

/**
 * Shell de la aplicación (piel Spartan): barra lateral con una entrada por recurso,
 * el outlet donde se montan los listados generados y el toaster de sonner —
 * NotificationService emite por toast y sin este montaje los avisos no se ven.
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, HlmToasterImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (bare()) {
      <router-outlet />
    } @else {
      <div class="flex min-h-screen">
        <aside class="bg-card w-60 shrink-0 border-r p-4">
          <div class="mb-6 px-2">
            <p class="text-base font-bold tracking-tight">{{ appTitle }}</p>
            <p class="text-muted-foreground text-xs">Panel de gestión</p>
          </div>
          <nav class="flex flex-col gap-1">
            @for (item of navItems; track item.route) {
              <a
                [routerLink]="item.route"
                routerLinkActive="bg-accent text-accent-foreground font-semibold"
                class="hover:bg-accent/60 rounded-md px-3 py-2 text-sm"
              >
                {{ item.label }}
              </a>
            }
          </nav>
        </aside>
        <main class="min-w-0 flex-1 p-6">
          <router-outlet />
        </main>
      </div>
    }
    <hlm-toaster />
  `
})
export class AppComponent {
  private readonly _router = inject(Router)

  protected readonly appTitle = 'Dashboard'
  protected readonly navItems = NAV_ITEMS

  private readonly _url = toSignal(
    this._router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(event => event.urlAfterRedirects)
    ),
    { initialValue: this._router.url }
  )
  protected readonly bare = computed(() => BARE_ROUTES.some(route => this._url().startsWith(route)))
}
