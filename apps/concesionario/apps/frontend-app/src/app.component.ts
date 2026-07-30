import { ChangeDetectionStrategy, Component } from '@angular/core'
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router'
import { NAV_ITEMS } from './nav'

/**
 * Shell de la aplicación: barra lateral con una entrada por recurso y el outlet
 * donde se montan los listados generados.
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
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
  `
})
export class AppComponent {
  protected readonly appTitle = 'Dashboard'
  protected readonly navItems = NAV_ITEMS
}
