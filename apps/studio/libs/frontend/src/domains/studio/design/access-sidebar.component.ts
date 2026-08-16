import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core'
import { resolveAccess, type AccessDefinition, type AccessRole } from '@raptor/schema'
import type { DraftResource } from '@app/shared/domain'
import { DesignStore } from './design-store'
import { StudioModeService } from './studio-mode.service'

interface AccessRow {
  /** 'view' | 'manage' | verbo de la transición */
  capability: string
  label: string
  roles: AccessRole[]
}

interface AccessSection {
  resource: DraftResource
  rows: AccessRow[]
}

/**
 * Raíl del modo Accesos (spec 46): la matriz actor→capacidad por entidad. Filas Ver /
 * Gestionar / cada transición de su máquina; columnas Usuario y Consulta editables y
 * Admin fija y atenuada (admin es implícito y no se negocia). Cada click persiste la
 * matriz EXPLÍCITA completa — lo marcado es lo que hay, sin defectos escondidos.
 */
@Component({
  selector: 'studio-access-sidebar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <aside class="studio-rail flex h-full w-72 shrink-0 flex-col gap-6 overflow-y-auto border-r p-4">
      @if (!sections().length) {
        <div class="text-muted-foreground px-1 py-2 text-xs" data-testid="access-empty">
          Todavía no hay entidades. Créalas en la pestaña <strong>Modelo</strong> y aquí repartirás quién ve, quién
          gestiona y quién ejecuta cada transición.
          <button
            type="button"
            class="text-primary mt-2 block underline underline-offset-4"
            data-testid="access-go-model"
            (click)="modeService.mode.set('model')"
          >
            Ir al Modelo
          </button>
        </div>
      }
      @for (section of sections(); track section.resource.name) {
        <section [attr.data-testid]="'access-entity-' + section.resource.name">
          <h2 class="studio-eyebrow mb-2 px-1">{{ section.resource.labelPlural }}</h2>
          <table class="w-full text-xs">
            <thead>
              <tr class="text-muted-foreground">
                <th class="px-1 py-1 text-left font-normal">Capacidad</th>
                <th class="w-10 px-1 py-1 text-center font-normal opacity-50" title="Admin siempre puede todo">
                  Admin
                </th>
                <th class="w-10 px-1 py-1 text-center font-normal">Usuario</th>
                <th class="w-10 px-1 py-1 text-center font-normal">Consulta</th>
              </tr>
            </thead>
            <tbody>
              @for (row of section.rows; track row.capability) {
                <tr class="border-border/60 border-t">
                  <td class="truncate px-1 py-1.5" [title]="row.label">{{ row.label }}</td>
                  <td class="px-1 py-1.5 text-center opacity-50">
                    <input
                      type="checkbox"
                      checked
                      disabled
                      [attr.data-testid]="'access-' + section.resource.name + '-' + row.capability + '-admin'"
                    />
                  </td>
                  @for (role of editableRoles; track role) {
                    <td class="px-1 py-1.5 text-center">
                      <input
                        type="checkbox"
                        class="accent-primary"
                        [checked]="row.roles.includes(role)"
                        [attr.data-testid]="'access-' + section.resource.name + '-' + row.capability + '-' + role"
                        (change)="toggle(section.resource, row.capability, role)"
                      />
                    </td>
                  }
                </tr>
              }
            </tbody>
          </table>
        </section>
      }

      @if (sections().length) {
        <p class="text-muted-foreground mt-auto px-1 text-xs">
          Admin siempre puede todo. Lo demás lo decide esta matriz, y viaja hasta la app generada.
        </p>
      }
    </aside>
  `
})
export class AccessSidebarComponent {
  protected readonly store = inject(DesignStore)
  protected readonly modeService = inject(StudioModeService)

  protected readonly editableRoles: AccessRole[] = ['user', 'viewer']

  protected readonly sections = computed<AccessSection[]>(() =>
    this.store.resources().map(resource => {
      const resolved = resolveAccess(resource)
      return {
        resource,
        rows: [
          { capability: 'view', label: `Ver ${resource.labelPlural}`, roles: resolved.view },
          { capability: 'manage', label: `Gestionar ${resource.labelPlural}`, roles: resolved.manage },
          ...(resource.state?.transitions ?? []).map(transition => ({
            capability: transition.name,
            label: transition.label,
            roles: resolved.transitions[transition.name] ?? []
          }))
        ]
      }
    })
  )

  protected toggle(resource: DraftResource, capability: string, role: AccessRole): void {
    const resolved = resolveAccess(resource)
    const flip = (roles: AccessRole[], target: string): AccessRole[] => {
      if (capability !== target) return roles
      const next = roles.includes(role) ? roles.filter(r => r !== role) : [...roles, role]
      // orden estable user→viewer: el emitido no debe depender del orden de los clicks
      return this.editableRoles.filter(r => next.includes(r))
    }

    const access: AccessDefinition = {
      view: flip(resolved.view, 'view'),
      manage: flip(resolved.manage, 'manage'),
      ...(resource.state
        ? {
            transitions: Object.fromEntries(
              (resource.state.transitions ?? []).map(transition => [
                transition.name,
                flip(resolved.transitions[transition.name] ?? [], transition.name)
              ])
            )
          }
        : {})
    }
    this.store.setResourceAccess(resource.name, access)
  }
}
