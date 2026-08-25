import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core'
import { RouterLink, RouterLinkActive } from '@angular/router'
import { NgIcon, provideIcons } from '@ng-icons/core'
import { lucideChevronDown, lucideChevronRight, lucideShieldCheck, lucideUsers } from '@ng-icons/lucide'
import { AuthService } from '../../core/services/auth.service'

/**
 * Grupo «Administración» de la barra lateral: cabecera pulsable que despliega las
 * vistas de sistema (hoy Usuarios), como el nav de dos niveles de la referencia.
 * Solo se monta con el plugin de auth y solo se ve con rol admin.
 */
@Component({
  selector: 'app-admin-nav-group',
  imports: [NgIcon, RouterLink, RouterLinkActive],
  providers: [provideIcons({ lucideChevronDown, lucideChevronRight, lucideShieldCheck, lucideUsers })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (auth.isAdmin()) {
      <div class="mt-4">
        <button
          type="button"
          class="hover:bg-accent/60 flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm"
          data-testid="admin-nav-toggle"
          [attr.aria-expanded]="open()"
          (click)="open.set(!open())"
        >
          <ng-icon name="lucideShieldCheck" class="text-muted-foreground shrink-0" size="16" />
          <span class="flex-1 text-left">Administración</span>
          <ng-icon
            [name]="open() ? 'lucideChevronDown' : 'lucideChevronRight'"
            class="text-muted-foreground shrink-0"
            size="14"
          />
        </button>
        @if (open()) {
          <nav class="ml-5 flex flex-col gap-1 border-l pl-2">
            <a
              routerLink="/users"
              routerLinkActive="bg-accent text-accent-foreground font-semibold"
              class="hover:bg-accent/60 flex items-center gap-2 rounded-md px-3 py-2 text-sm"
              data-testid="admin-nav-users"
            >
              <ng-icon name="lucideUsers" class="text-muted-foreground shrink-0" size="16" />
              Usuarios
            </a>
          </nav>
        }
      </div>
    }
  `
})
export class AdminNavGroupComponent {
  protected readonly auth = inject(AuthService)
  /** Abierto de entrada: con una sola hija, esconderla costaría un clic sin ganar nada. */
  protected readonly open = signal(true)
}
