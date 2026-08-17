import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core'
import { applyColumn, copyRoleAccess, roleSummary, type DraftResource } from '@app/shared/domain'
import type { AccessDefinition, AccessRole } from '@raptor/schema'
import { AccessUiService } from './access-ui.service'
import { DesignStore } from './design-store'

const ROLE_LABELS = { admin: 'Administrador', user: 'Usuario', viewer: 'Consulta' } as const

/**
 * Panel derecho del pivote Rol (spec 49, mockups 30A/31B): resumen DERIVADO de la
 * matriz efectiva y acciones de columna en bloque. Nada aquí guarda estado propio:
 * lee el diseño y muta por la misma puerta que la tabla (setResourceAccess).
 */
@Component({
  selector: 'studio-access-summary',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (store.resources().length) {
      <div class="flex min-h-0 flex-col gap-6 overflow-y-auto">
        <section class="bg-background rounded-xl border p-4">
          <h2 class="studio-eyebrow mb-3">{{ roleLabel() }} · resumen</h2>
          <dl class="space-y-2 text-sm">
            <div class="flex items-baseline justify-between" data-testid="access-summary-view">
              <dt class="text-muted-foreground">Puede ver</dt>
              <dd class="text-primary font-semibold">{{ summary().view }}</dd>
            </div>
            <div class="flex items-baseline justify-between" data-testid="access-summary-create">
              <dt class="text-muted-foreground">Puede crear</dt>
              <dd class="text-primary font-semibold">{{ summary().create }}</dd>
            </div>
            <div class="flex items-baseline justify-between" data-testid="access-summary-edit">
              <dt class="text-muted-foreground">Puede editar</dt>
              <dd class="text-primary font-semibold">{{ summary().edit }}</dd>
            </div>
            <div class="flex items-baseline justify-between" data-testid="access-summary-delete">
              <dt class="text-muted-foreground">Puede borrar</dt>
              <dd class="text-primary font-semibold">{{ summary().delete }}</dd>
            </div>
            <div
              class="border-border/60 mt-1 flex items-baseline justify-between border-t pt-2"
              data-testid="access-summary-full"
            >
              <dt class="text-muted-foreground">Acceso completo</dt>
              <dd class="font-semibold text-emerald-600">{{ summary().full }} de {{ summary().total }}</dd>
            </div>
          </dl>
          <!-- proporción de entidades: acceso completo (verde) / parcial (acento) / ninguno (gris).
               El verde es el premio: solo lo gana la entidad con TODAS sus capacidades. -->
          <div class="bg-foreground/10 mt-4 flex h-1.5 overflow-hidden rounded-full" aria-hidden="true">
            <div class="bg-emerald-500" [style.width.%]="fullShare()" data-testid="access-bar-full"></div>
            <div class="bar-partial" [style.width.%]="partialShare()" data-testid="access-bar-partial"></div>
          </div>
        </section>

        @if (ui.role() !== 'admin') {
          <section>
            <h2 class="studio-eyebrow mb-2 px-1">Aplicar a toda la columna</h2>
            <div class="flex flex-wrap gap-2 px-1">
              <button type="button" class="chip" data-testid="access-grant-view" (click)="grantView()">
                Todo ver
              </button>
              <button type="button" class="chip" data-testid="access-revoke-writes" (click)="revokeWrites()">
                Nada editar
              </button>
              <button type="button" class="chip" data-testid="access-copy-from" (click)="copyFromOther()">
                Copiar de {{ otherLabel() }}
              </button>
            </div>
          </section>
        }
      </div>
    }
  `,
  styles: `
    /* El tramo parcial en el naranja de la casa: con --primary salía gris (tinta al 50%) y no se
       distinguía del hueco vacío del carril, que es justo lo que significa «sin acceso». */
    .bar-partial {
      background-color: var(--brand);
      opacity: 0.7;
    }
    .chip {
      border: 1px solid hsl(var(--border));
      border-radius: 0.5rem;
      padding: 0.375rem 0.75rem;
      font-size: 0.75rem;
      transition: background-color 0.15s;
    }
    .chip:hover {
      background: hsl(var(--foreground) / 0.05);
    }
  `
})
export class AccessSummaryComponent {
  protected readonly store = inject(DesignStore)
  protected readonly ui = inject(AccessUiService)

  protected readonly roleLabel = computed(() => ROLE_LABELS[this.ui.role()])
  protected readonly summary = computed(() => roleSummary(this.store.resources(), this.ui.role()))

  protected readonly fullShare = computed(() => this.share(this.summary().full))
  protected readonly partialShare = computed(() => this.share(this.summary().partial))

  private share(count: number): number {
    const total = this.summary().total
    return total === 0 ? 0 : (count / total) * 100
  }

  /** El rol del que se copia: el OTRO editable (a admin no se le copia, se es admin o no) */
  protected readonly otherRole = computed<AccessRole>(() => (this.ui.role() === 'user' ? 'viewer' : 'user'))
  protected readonly otherLabel = computed(() => ROLE_LABELS[this.otherRole()])

  protected grantView(): void {
    this.forEachResource(resource => applyColumn(resource, this.editableRole(), 'grant-view'))
  }

  protected revokeWrites(): void {
    this.forEachResource(resource => applyColumn(resource, this.editableRole(), 'revoke-writes'))
  }

  protected copyFromOther(): void {
    this.forEachResource(resource => copyRoleAccess(resource, this.otherRole(), this.editableRole()))
  }

  private editableRole(): AccessRole {
    // las acciones solo se pintan con user/viewer activos; el narrow es seguro
    return this.ui.role() as AccessRole
  }

  private forEachResource(next: (resource: DraftResource) => AccessDefinition): void {
    for (const resource of this.store.resources()) {
      this.store.setResourceAccess(resource.name, next(resource))
    }
  }
}
