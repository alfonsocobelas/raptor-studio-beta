import { ChangeDetectionStrategy, Component, ElementRef, inject, signal } from '@angular/core'
import { NgIcon, provideIcons } from '@ng-icons/core'
import { lucideBadgeCheck, lucideChevronsUpDown, lucideLogOut } from '@ng-icons/lucide'
import { ActiveViewService } from './active-view.service'

/**
 * Pie de sesión de la maqueta: calco del session-footer que emite el plugin de auth
 * (avatar de iniciales, nombre, email y el menú con cabecera de usuario, Cuenta y
 * Cerrar sesión). El usuario es fijo: la maqueta no tiene sesión. Cuenta y Cerrar
 * sesión no navegan — cambian la vista de sistema que el lienzo dibuja.
 */
@Component({
  selector: 'app-canvas-session-footer',
  imports: [NgIcon],
  providers: [provideIcons({ lucideBadgeCheck, lucideChevronsUpDown, lucideLogOut })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:click)': 'onDocumentClick($event)',
    '(document:keydown.escape)': 'menuOpen.set(false)'
  },
  template: `
    <div class="relative mt-4 border-t pt-3">
      @if (menuOpen()) {
        <div
          class="bg-background absolute bottom-full left-0 z-30 mb-2 w-56 rounded-lg border p-1 shadow-md"
          data-testid="mock-session-menu"
        >
          <div class="flex items-center gap-2 px-2 py-1.5">
            <span
              class="bg-primary text-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-medium"
            >
              {{ initials }}
            </span>
            <div class="grid min-w-0 flex-1 text-left text-sm leading-tight">
              <span class="truncate font-medium">{{ name }}</span>
              <span class="text-muted-foreground truncate text-xs">{{ email }} · {{ role }}</span>
            </div>
          </div>
          <div class="my-1 border-t"></div>
          <button
            type="button"
            class="hover:bg-accent flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm"
            data-testid="mock-my-account"
            (click)="menuOpen.set(false); active.selectSystem('account')"
          >
            <ng-icon name="lucideBadgeCheck" size="16" />
            Cuenta
          </button>
          <button
            type="button"
            class="hover:bg-accent flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm"
            data-testid="mock-logout"
            (click)="menuOpen.set(false); active.selectSystem('login')"
          >
            <ng-icon name="lucideLogOut" size="16" />
            Cerrar sesión
          </button>
        </div>
      }
      <button
        type="button"
        class="hover:bg-accent/60 flex w-full items-center gap-2 rounded-md px-2 py-2 text-left"
        data-testid="mock-session-footer"
        [attr.aria-expanded]="menuOpen()"
        (click)="menuOpen.set(!menuOpen())"
      >
        <span
          class="bg-primary text-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-medium"
        >
          {{ initials }}
        </span>
        <span class="grid min-w-0 flex-1 text-left text-sm leading-tight">
          <span class="truncate font-medium">{{ name }}</span>
          <span class="text-muted-foreground truncate text-xs">{{ email }}</span>
        </span>
        <ng-icon name="lucideChevronsUpDown" class="text-muted-foreground ml-auto shrink-0" size="14" />
      </button>
    </div>
  `
})
export class CanvasSessionFooterComponent {
  private readonly _host = inject(ElementRef<HTMLElement>)

  protected readonly active = inject(ActiveViewService)
  protected readonly menuOpen = signal(false)

  protected onDocumentClick(event: Event): void {
    if (this.menuOpen() && !this._host.nativeElement.contains(event.target as Node)) {
      this.menuOpen.set(false)
    }
  }
  /** El usuario sembrado por el plugin de auth en toda app generada. */
  protected readonly initials = 'AL'
  protected readonly name = 'Admin Local'
  protected readonly email = 'admin@app.local'
  protected readonly role = 'Administrador'
}
