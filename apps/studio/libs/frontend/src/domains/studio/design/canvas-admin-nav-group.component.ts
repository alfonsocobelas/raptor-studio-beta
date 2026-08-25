import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core'
import { NgIcon, provideIcons } from '@ng-icons/core'
import { lucideChevronDown, lucideChevronRight, lucideShieldCheck, lucideUsers } from '@ng-icons/lucide'
import { ActiveViewService } from './active-view.service'

/**
 * Grupo «Administración» de la maqueta: espejo del admin-nav-group que emite el plugin de
 * auth — cabecera pulsable con chevron que despliega las vistas de sistema. Aquí las hijas
 * no navegan: seleccionan la vista de sistema que el lienzo dibuja al lado.
 */
@Component({
  selector: 'app-canvas-admin-nav-group',
  imports: [NgIcon],
  providers: [provideIcons({ lucideChevronDown, lucideChevronRight, lucideShieldCheck, lucideUsers })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mt-4">
      <button
        type="button"
        class="hover:bg-accent/60 flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm"
        data-testid="mock-admin-toggle"
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
          <button
            type="button"
            class="hover:bg-accent/60 flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm"
            [class.bg-accent]="active.systemView() === 'users'"
            [class.font-semibold]="active.systemView() === 'users'"
            data-testid="mock-nav-users"
            (click)="active.selectSystem('users')"
          >
            <ng-icon name="lucideUsers" class="text-muted-foreground shrink-0" size="16" />
            Usuarios
          </button>
        </nav>
      }
    </div>
  `
})
export class CanvasAdminNavGroupComponent {
  protected readonly active = inject(ActiveViewService)
  /** Desplegado de entrada, como el emitido: con una sola hija, esconderla no gana nada. */
  protected readonly open = signal(true)
}
