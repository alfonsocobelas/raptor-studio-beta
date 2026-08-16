import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import type { AccessActorRole } from '@app/shared/domain'
import { AccessUiService, type AccessPivot } from './access-ui.service'

interface RoleCard {
  role: AccessActorRole
  label: string
  initial: string
  /** El subtítulo de la tarjeta; solo admin lo tiene (su poder no se negocia) */
  note?: string
}

/** Los tres actores fijos del modelo de accesos (spec 46); admin es implícito y total. */
const ROLE_CARDS: RoleCard[] = [
  { role: 'admin', label: 'Administrador', initial: 'A', note: 'Todo' },
  { role: 'user', label: 'Usuario', initial: 'U' },
  { role: 'viewer', label: 'Consulta', initial: 'C' }
]

const PIVOTS: { pivot: AccessPivot; label: string }[] = [
  { pivot: 'role', label: 'Rol' },
  { pivot: 'entity', label: 'Entidad' },
  { pivot: 'diagram', label: 'Diagrama' }
]

/**
 * Raíl del modo Accesos (spec 49, mockups 30A/31B): la lista de roles — el activo se
 * resalta y gobierna la tabla central — y el conmutador de pivote. La matriz se edita
 * en la tabla; aquí solo se elige desde qué ángulo mirarla.
 */
@Component({
  selector: 'studio-access-sidebar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <aside class="studio-rail flex h-full w-64 shrink-0 flex-col gap-6 overflow-y-auto border-r p-4">
      <section>
        <h2 class="studio-eyebrow mb-2 px-1">Roles</h2>
        @for (card of roleCards; track card.role) {
          <button
            type="button"
            class="hover:ring-foreground/25 studio-ui mb-1.5 flex w-full items-center gap-3 rounded-[9px] border px-3 py-2.5 text-left transition-shadow hover:ring-1"
            [class.role-card-active]="card.role === ui.role()"
            [class.bg-background]="card.role === ui.role()"
            [class.border-transparent]="card.role !== ui.role()"
            [attr.aria-current]="card.role === ui.role() ? 'true' : null"
            [attr.data-testid]="'access-role-' + card.role"
            (click)="ui.role.set(card.role)"
          >
            <!-- la inicial va SIEMPRE en el naranja de marca; el rol activo se distingue por el
                 borde y el anillo de su tarjeta, no por invertir la insignia -->
            <span
              class="role-badge flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-sm font-semibold"
              aria-hidden="true"
            >
              {{ card.initial }}
            </span>
            <span class="min-w-0">
              <span class="block truncate font-medium">{{ card.label }}</span>
              @if (card.note) {
                <span class="studio-eyebrow block">{{ card.note }}</span>
              }
            </span>
          </button>
        }
      </section>

      <section>
        <h2 class="studio-eyebrow mb-2 px-1">Ver la tabla por</h2>
        <div class="bg-foreground/5 flex rounded-lg p-0.5" role="group" aria-label="Ver la tabla por">
          @for (option of pivots; track option.pivot) {
            <button
              type="button"
              class="studio-ui flex-1 rounded-md px-2 py-1.5 text-center text-xs transition-colors"
              [class.bg-background]="option.pivot === ui.pivot()"
              [class.ring-1]="option.pivot === ui.pivot()"
              [class.ring-border]="option.pivot === ui.pivot()"
              [class.shadow-sm]="option.pivot === ui.pivot()"
              [class.font-semibold]="option.pivot === ui.pivot()"
              [class.text-muted-foreground]="option.pivot !== ui.pivot()"
              [attr.aria-current]="option.pivot === ui.pivot() ? 'true' : null"
              [attr.data-testid]="'access-pivot-' + option.pivot"
              (click)="ui.pivot.set(option.pivot)"
            >
              {{ option.label }}
            </button>
          }
        </div>
      </section>

      <p class="text-muted-foreground mt-auto px-1 text-xs">Admin siempre puede todo; su fila no es editable.</p>
    </aside>
  `,
  styles: `
    /* Recuadro de la inicial en el naranja terracota #C86647 que eligió Alfonso, con la letra en
       blanco encima (blanco fijo, no --brand-foreground: en oscuro ese token es tinta). Va en CSS y no con utilidades para no depender de --primary, que en claro es
       tinta casi negra. Mismo tono de día y de noche: es una insignia, no un estado. */
    /* El rol elegido se marca con el MISMO terracota de su insignia; --primary daría tinta negra
       de día y blanco de noche, que es lo que se veía antes. */
    .role-card-active {
      border-color: #c86647;
      box-shadow: 0 0 0 1px #c86647;
    }
    .role-badge {
      background-color: #c86647;
      color: #ffffff;
    }
  `
})
export class AccessSidebarComponent {
  protected readonly ui = inject(AccessUiService)
  protected readonly roleCards = ROLE_CARDS
  protected readonly pivots = PIVOTS
}
