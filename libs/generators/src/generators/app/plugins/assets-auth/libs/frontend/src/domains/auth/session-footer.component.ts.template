import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core'
import { Router, RouterLink, RouterLinkActive } from '@angular/router'
import { UserRoleEnum } from '@app/shared/domain'
import { AuthService } from '../../core/services/auth.service'
import { USER_ROLE_LABELS } from '../iam/iam-labels'

/**
 * Pie de sesión de la barra lateral: quién soy, gestión de usuarios (solo admin)
 * y cerrar sesión. Solo se monta cuando la app se genera con el plugin de auth.
 */
@Component({
  selector: 'app-session-footer',
  imports: [RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mt-4 border-t pt-3">
      @if (auth.currentUser(); as user) {
        <a
          routerLink="/account"
          routerLinkActive="bg-accent text-accent-foreground"
          class="hover:bg-accent/60 block rounded-md px-3 py-2"
          data-testid="my-account"
        >
          <p class="truncate text-sm font-medium">{{ user.name }}</p>
          <p class="text-muted-foreground truncate text-xs">{{ user.email }} · {{ roleLabel() }}</p>
        </a>
        <a
          routerLink="/account"
          routerLinkActive="bg-accent text-accent-foreground font-semibold"
          class="hover:bg-accent/60 block rounded-md px-3 py-2 text-sm"
          data-testid="my-account-link"
        >
          Mi cuenta
        </a>
        <button
          type="button"
          class="hover:bg-accent/60 flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm"
          (click)="logout()"
          data-testid="logout"
        >
          Cerrar sesión
        </button>
      }
    </div>
  `
})
export class SessionFooterComponent {
  private readonly _router = inject(Router)

  protected readonly auth = inject(AuthService)
  protected readonly roleLabel = computed(() => {
    const role = this.auth.currentUser()?.role
    return role ? USER_ROLE_LABELS[role as UserRoleEnum] : ''
  })

  async logout(): Promise<void> {
    await this.auth.logout()
    await this._router.navigate(['/login'])
  }
}
