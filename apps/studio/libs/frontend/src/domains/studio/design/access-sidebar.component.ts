import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core'
import type { AccessActorRole } from '@app/shared/domain'
import { AccessUiService, type AccessPivot } from './access-ui.service'
import { DesignStore } from './design-store'

interface RoleCard {
  role: AccessActorRole
  label: string
  initial: string
  /** El subtítulo de la tarjeta; solo admin lo tiene (su poder no se negocia) */
  note?: string
  /** Un rol declarado en el diseño (spec 76): se puede quitar */
  custom?: boolean
}

/** Los tres actores fijos del modelo de accesos (spec 46); admin es implícito y total. */
const FIXED_CARDS: RoleCard[] = [
  { role: 'admin', label: 'Administrador', initial: 'A', note: 'Todo' },
  { role: 'user', label: 'Usuario', initial: 'U' },
  { role: 'viewer', label: 'Consulta', initial: 'C' }
]

const PIVOTS: { pivot: AccessPivot; label: string }[] = [
  { pivot: 'role', label: 'Rol' },
  { pivot: 'entity', label: 'Entidad' }
]

/**
 * Raíl del modo Accesos (spec 49, mockups 30A/31B): la lista de roles — el activo se
 * resalta y gobierna la tabla central — y el conmutador de pivote. Desde la spec 76 la
 * lista crece: «+ Nuevo rol» declara roles personalizados de la app (el nombre kebab
 * sale de la etiqueta, como el de una entidad) y cada uno se puede quitar. La matriz se
 * edita en la tabla; aquí solo se elige desde qué ángulo mirarla.
 */
@Component({
  selector: 'studio-access-sidebar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <aside class="studio-rail flex h-full w-64 shrink-0 flex-col gap-6 overflow-y-auto border-r p-4">
      <section>
        <h2 class="studio-eyebrow mb-2 px-1">Roles</h2>
        @for (card of roleCards(); track card.role) {
          <div class="relative mb-1.5">
            <button
              type="button"
              class="hover:ring-foreground/25 studio-ui flex w-full items-center gap-3 rounded-[9px] border px-3 py-2.5 text-left transition-shadow hover:ring-1"
              [class.role-card-active]="card.role === ui.role()"
              [class.bg-background]="card.role === ui.role()"
              [class.border-transparent]="card.role !== ui.role()"
              [class.pr-9]="card.custom"
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
            @if (card.custom) {
              <button
                type="button"
                class="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-xs transition-colors"
                [attr.aria-label]="'Quitar el rol ' + card.label"
                [attr.data-testid]="'access-role-remove-' + card.role"
                (click)="remove(card.role)"
              >
                ✕
              </button>
            }
          </div>
        }

        @if (adding()) {
          <div class="border-border mt-2 rounded-[9px] border p-2.5" data-testid="access-role-new">
            <label class="studio-eyebrow mb-1 block" for="access-role-new-label">Nuevo rol</label>
            <input
              id="access-role-new-label"
              type="text"
              class="border-input bg-background w-full rounded-md border px-2.5 py-1.5 text-sm"
              placeholder="Perito, Tramitador…"
              [value]="newLabel()"
              (input)="onLabel($event)"
              (keydown.enter)="confirm()"
              data-testid="access-role-new-label"
            />
            @if (addError()) {
              <p class="mt-1.5 text-xs text-red-600" data-testid="access-role-new-error">{{ addError() }}</p>
            }
            <div class="mt-2 flex gap-2">
              <button
                type="button"
                class="bg-foreground text-background flex-1 rounded-md px-2 py-1.5 text-xs font-semibold"
                data-testid="access-role-new-confirm"
                (click)="confirm()"
              >
                Añadir
              </button>
              <button
                type="button"
                class="text-muted-foreground hover:text-foreground rounded-md px-2 py-1.5 text-xs transition-colors"
                data-testid="access-role-new-cancel"
                (click)="adding.set(false)"
              >
                Cancelar
              </button>
            </div>
          </div>
        } @else {
          <button
            type="button"
            class="text-muted-foreground hover:text-foreground border-border/70 hover:border-border mt-1 flex w-full items-center justify-center gap-1.5 rounded-[9px] border border-dashed px-3 py-2 text-sm transition-colors"
            data-testid="access-role-add"
            (click)="openForm()"
          >
            + Nuevo rol
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
    /* El terracota #C86647 lo pipeteó Alfonso de SU pantalla (Display P3): para que su cuentagotas
       lea ese valor hay que declararlo en P3 — escrito en sRGB, sobre P3 se lee #BC6B4F. El hex
       queda como fallback para navegadores sin color(). Letra en blanco fijo (no
       --brand-foreground: en oscuro ese token es tinta). Va en CSS y no con utilidades para no depender de --primary, que en claro es
       tinta casi negra. Mismo tono de día y de noche: es una insignia, no un estado. */
    /* El rol elegido se marca con el MISMO terracota de su insignia; --primary daría tinta negra
       de día y blanco de noche, que es lo que se veía antes. */
    .role-card-active {
      border-color: #c86647;
      border-color: color(display-p3 0.7843 0.4 0.2784);
      box-shadow: 0 0 0 1px color(display-p3 0.7843 0.4 0.2784);
    }
    .role-badge {
      background-color: #c86647;
      background-color: color(display-p3 0.7843 0.4 0.2784);
      color: #ffffff;
    }
  `
})
export class AccessSidebarComponent {
  protected readonly ui = inject(AccessUiService)
  protected readonly store = inject(DesignStore)
  protected readonly pivots = PIVOTS

  protected readonly roleCards = computed<RoleCard[]>(() => [
    ...FIXED_CARDS,
    ...this.store.roles().map(role => ({
      role: role.name,
      label: role.label,
      initial: (role.label.trim()[0] ?? '?').toUpperCase(),
      custom: true
    }))
  ])

  protected readonly adding = signal(false)
  protected readonly newLabel = signal('')
  protected readonly addError = signal<string | null>(null)

  protected openForm(): void {
    this.newLabel.set('')
    this.addError.set(null)
    this.adding.set(true)
  }

  protected onLabel(event: Event): void {
    this.newLabel.set((event.target as HTMLInputElement).value)
  }

  /** El nombre kebab sale de la etiqueta, igual que el de una entidad del Modelo. */
  protected confirm(): void {
    const label = this.newLabel().trim()
    const name = kebab(label)
    if (!this.store.addRole({ name, label })) {
      this.addError.set(this.store.lastError())
      return
    }
    this.adding.set(false)
    this.addError.set(null)
    this.ui.role.set(name)
  }

  /** Quitar el rol también lo limpia de todas las matrices (lo hace el store). */
  protected remove(name: string): void {
    if (!this.store.removeRole(name)) return
    if (this.ui.role() === name) this.ui.role.set('user')
  }
}

function kebab(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}
