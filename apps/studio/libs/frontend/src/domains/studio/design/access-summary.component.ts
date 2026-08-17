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
              <dd class="font-semibold">
                <span class="text-primary">{{ summary().view }}</span
                ><span class="text-muted-foreground">/{{ summary().total }}</span>
              </dd>
            </div>
            <div class="flex items-baseline justify-between" data-testid="access-summary-create">
              <dt class="text-muted-foreground">Puede crear</dt>
              <dd class="font-semibold">
                <span class="text-primary">{{ summary().create }}</span
                ><span class="text-muted-foreground">/{{ summary().total }}</span>
              </dd>
            </div>
            <div class="flex items-baseline justify-between" data-testid="access-summary-edit">
              <dt class="text-muted-foreground">Puede editar</dt>
              <dd class="font-semibold">
                <span class="text-primary">{{ summary().edit }}</span
                ><span class="text-muted-foreground">/{{ summary().total }}</span>
              </dd>
            </div>
            <div class="flex items-baseline justify-between" data-testid="access-summary-delete">
              <dt class="text-muted-foreground">Puede borrar</dt>
              <dd class="font-semibold">
                <span class="text-primary">{{ summary().delete }}</span
                ><span class="text-muted-foreground">/{{ summary().total }}</span>
              </dd>
            </div>
            <div
              class="border-border/60 mt-1 flex items-baseline justify-between border-t pt-2"
              data-testid="access-summary-full"
            >
              <dt class="text-muted-foreground">Acceso completo</dt>
              <dd class="font-semibold">
                <span class="text-emerald-600">{{ summary().full }}</span
                ><span class="text-muted-foreground">/{{ summary().total }}</span>
              </dd>
            </div>
          </dl>
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
