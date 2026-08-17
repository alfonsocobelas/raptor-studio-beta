import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { AppSelect, type AppSelectOption } from '../../../shared/components/ui/select'
import {
  accessRows,
  toggleCapability,
  type AccessActorRole,
  type AccessCapabilityCell,
  type AccessTableRow
} from '@app/shared/domain'
import { AccessUiService } from './access-ui.service'
import { DesignStore } from './design-store'
import { StudioModeService } from './studio-mode.service'

const ROLE_LABELS = { admin: 'Administrador', user: 'Usuario', viewer: 'Consulta' } as const
const ROLE_ROWS: AccessActorRole[] = ['admin', 'user', 'viewer']

/**
 * La tabla central de Accesos (spec 49, mockups 30A/31B): qué puede hacer el rol activo.
 * Filas de entidad con su subtítulo derivado; celdas Ver/Crear/Editar/Borrar y un
 * conmutador por transición. Cada click persiste la matriz explícita completa. Admin
 * se mira pero no se toca: su poder no se negocia.
 */
@Component({
  selector: 'studio-access-table',
  imports: [FormsModule, AppSelect],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (!store.resources().length) {
      <div
        class="flex h-full flex-col items-center justify-center text-center"
        data-testid="access-table-empty"
      >
        <p class="text-muted-foreground mb-2 text-lg">Sin entidades todavía</p>
        <p class="text-muted-foreground max-w-md text-sm">
          Los accesos se reparten sobre el diseño: crea entidades en la pestaña <strong>Modelo</strong> y aquí
          decidirás quién ve, crea, edita y borra cada una.
        </p>
        <button
          type="button"
          class="text-primary mt-3 text-sm underline underline-offset-4"
          data-testid="access-go-model"
          (click)="modeService.mode.set('model')"
        >
          Ir al Modelo
        </button>
      </div>
    } @else if (ui.pivot() === 'entity') {
      <div class="flex h-full flex-col px-8 pt-8">
        <header class="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 class="text-2xl font-semibold">Quién puede con {{ selectedRow()?.label }}</h1>
            <p class="text-muted-foreground mt-1 text-sm">
              Una fila por rol; pulsa una celda para cambiar el permiso. {{ selectedRow()?.subtitle }}.
            </p>
          </div>
          <app-select
            class="w-56"
            controlId="access-entity"
            placeholder="Entidad"
            [options]="entityOptions()"
            [ngModel]="selectedRow()?.name ?? ''"
            [ngModelOptions]="{ standalone: true }"
            (ngModelChange)="ui.entity.set($event)"
            data-testid="access-entity-select"
          />
        </header>

        <div class="border-y">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-muted-foreground border-b">
                <th class="studio-eyebrow px-4 py-3 text-left font-normal">Rol</th>
                <th class="studio-eyebrow w-20 px-2 py-3 text-center font-normal">Ver</th>
                <th class="studio-eyebrow w-20 px-2 py-3 text-center font-normal">Crear</th>
                <th class="studio-eyebrow w-20 px-2 py-3 text-center font-normal">Editar</th>
                <th class="studio-eyebrow w-20 px-2 py-3 text-center font-normal">Borrar</th>
                @if (selectedHasTransitions()) {
                  <th class="studio-eyebrow px-4 py-3 text-left font-normal">Transiciones</th>
                }
              </tr>
            </thead>
            <tbody>
              @for (role of roleRows; track role) {
                <tr class="border-border/60 border-b last:border-b-0" [class.opacity-70]="role === 'admin'">
                  <td class="px-4 py-3.5">
                    <span class="block font-medium">{{ roleLabels[role] }}</span>
                    @if (role === 'admin') {
                      <span class="studio-eyebrow mt-0.5 block">Todo</span>
                    }
                  </td>
                  @for (cell of crudCells(selectedRow()!); track cell.capability) {
                    <td class="px-2 py-3.5 text-center">
                      <button
                        type="button"
                        class="hover:bg-foreground/5 mx-auto flex h-8 w-8 items-center justify-center rounded-md text-base leading-none transition-colors"
                        [class]="cellClasses(cell, role)"
                        [attr.aria-pressed]="granted(cell, role)"
                        [attr.aria-label]="cell.label + ' — ' + roleLabels[role]"
                        [disabled]="role === 'admin'"
                        [attr.data-testid]="'access-ecell-' + role + '-' + cell.capability"
                        (click)="toggleAs(selectedRow()!, cell, role)"
                      >
                        {{ granted(cell, role) ? '✓' : '✕' }}
                      </button>
                    </td>
                  }
                  @if (selectedHasTransitions()) {
                    <td class="px-4 py-3.5">
                      <div class="flex flex-wrap gap-1.5">
                        @for (cell of transitionCells(selectedRow()!); track cell.capability) {
                          <button
                            type="button"
                            class="rounded-full border px-2.5 py-1 text-xs transition-colors"
                            [class]="chipClasses(cell, role)"
                            [attr.aria-pressed]="granted(cell, role)"
                            [disabled]="role === 'admin'"
                            [attr.data-testid]="'access-ecell-' + role + '-' + cell.capability"
                            (click)="toggleAs(selectedRow()!, cell, role)"
                          >
                            {{ granted(cell, role) ? '✓ ' : '✕ ' }}{{ cell.label }}
                          </button>
                        }
                      </div>
                    </td>
                  }
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    } @else {
      <div class="flex h-full flex-col px-8 pt-8">
        <header class="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 class="text-2xl font-semibold">Qué puede hacer {{ roleLabel() }}</h1>
            <p class="text-muted-foreground mt-1 text-sm">
              @if (ui.role() === 'admin') {
                Admin siempre puede todo; elige otro rol para repartir permisos.
              } @else {
                Pulsa una celda para cambiar el permiso de esa entidad.
              }
            </p>
          </div>
          <div class="flex items-center gap-2">
            <input
              type="search"
              class="border-input bg-background w-44 rounded-md border px-3 py-1.5 text-sm"
              placeholder="Buscar entidad"
              [value]="ui.search()"
              (input)="onSearch($event)"
              data-testid="access-search"
            />
            <div class="bg-foreground/5 flex rounded-lg p-0.5" role="group" aria-label="Filtrar entidades">
              <button
                type="button"
                class="studio-ui rounded-md px-2.5 py-1 text-xs transition-colors"
                [class.bg-background]="!ui.onlyWithAccess()"
                [class.ring-1]="!ui.onlyWithAccess()"
                [class.ring-border]="!ui.onlyWithAccess()"
                [class.shadow-sm]="!ui.onlyWithAccess()"
                [class.font-semibold]="!ui.onlyWithAccess()"
                [class.text-muted-foreground]="ui.onlyWithAccess()"
                data-testid="access-filter-all"
                (click)="ui.onlyWithAccess.set(false)"
              >
                Todas
              </button>
              <button
                type="button"
                class="studio-ui rounded-md px-2.5 py-1 text-xs transition-colors"
                [class.bg-background]="ui.onlyWithAccess()"
                [class.ring-1]="ui.onlyWithAccess()"
                [class.ring-border]="ui.onlyWithAccess()"
                [class.shadow-sm]="ui.onlyWithAccess()"
                [class.font-semibold]="ui.onlyWithAccess()"
                [class.text-muted-foreground]="!ui.onlyWithAccess()"
                data-testid="access-filter-granted"
                (click)="ui.onlyWithAccess.set(true)"
              >
                Con acceso
              </button>
            </div>
          </div>
        </header>

        <div class="min-h-0 flex-1 overflow-auto border-y">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-muted-foreground border-b">
                <th class="studio-eyebrow px-4 py-3 text-left font-normal">Entidad</th>
                <th class="studio-eyebrow w-20 px-2 py-3 text-center font-normal">Ver</th>
                <th class="studio-eyebrow w-20 px-2 py-3 text-center font-normal">Crear</th>
                <th class="studio-eyebrow w-20 px-2 py-3 text-center font-normal">Editar</th>
                <th class="studio-eyebrow w-20 px-2 py-3 text-center font-normal">Borrar</th>
                @if (hasTransitions()) {
                  <th class="studio-eyebrow px-4 py-3 text-left font-normal">Transiciones</th>
                }
              </tr>
            </thead>
            <tbody>
              @for (row of rows(); track row.name) {
                <tr class="border-border/60 border-b last:border-b-0" [attr.data-testid]="'access-row-' + row.name">
                  <td class="px-4 py-3.5">
                    <span class="block font-medium">{{ row.label }}</span>
                    <span class="studio-eyebrow mt-0.5 block">{{ row.subtitle }}</span>
                  </td>
                  @for (cell of crudCells(row); track cell.capability) {
                    <td class="px-2 py-3.5 text-center">
                      <button
                        type="button"
                        class="hover:bg-foreground/5 mx-auto flex h-8 w-8 items-center justify-center rounded-md text-base leading-none transition-colors"
                        [class]="cellClasses(cell, ui.role())"
                        [attr.aria-pressed]="granted(cell, ui.role())"
                        [attr.aria-label]="cell.label + ' ' + row.label"
                        [disabled]="ui.role() === 'admin'"
                        [attr.data-testid]="'access-cell-' + row.name + '-' + cell.capability"
                        (click)="toggle(row, cell)"
                      >
                        {{ granted(cell, ui.role()) ? '✓' : '✕' }}
                      </button>
                    </td>
                  }
                  @if (hasTransitions()) {
                    <td class="px-4 py-3.5">
                      <div class="flex flex-wrap gap-1.5">
                        @for (cell of transitionCells(row); track cell.capability) {
                          <button
                            type="button"
                            class="rounded-full border px-2.5 py-1 text-xs transition-colors"
                            [class]="chipClasses(cell, ui.role())"
                            [attr.aria-pressed]="granted(cell, ui.role())"
                            [disabled]="ui.role() === 'admin'"
                            [attr.data-testid]="'access-cell-' + row.name + '-' + cell.capability"
                            (click)="toggle(row, cell)"
                          >
                            {{ granted(cell, ui.role()) ? '✓ ' : '✕ ' }}{{ cell.label }}
                          </button>
                        }
                      </div>
                    </td>
                  }
                </tr>
              }
            </tbody>
          </table>
        </div>

        <p class="studio-eyebrow py-3" data-testid="access-count">
          {{ rows().length }} de {{ store.resources().length }} entidades
        </p>
      </div>
    }
  `,
  styles: `
    /* El color se pinta aquí, no con utilidades: Tailwind v4 resuelve 'dark:' por preferencia del
       sistema y el estudio conmuta el tema con la clase .dark en :root, así que la única forma
       fiable de tener dos tonos por tema es :host-context(.dark). Verde jade #44BA82 (elección de
       Alfonso). Las celdas van SIN caja: la marca sola basta y la tabla respira. */
    .mark-yes {
      color: #2f9e6d;
    }
    .mark-no {
      color: #d1493f;
    }
    :host-context(.dark) .mark-yes {
      color: #44ba82;
    }
    :host-context(.dark) .mark-no {
      color: #e8695e;
    }
    .chip-yes {
      background-color: rgb(68 186 130 / 0.16);
      border-color: rgb(68 186 130 / 0.5);
      color: #2f8a62;
    }
    .chip-no {
      background-color: rgb(209 73 63 / 0.12);
      border-color: rgb(209 73 63 / 0.4);
      color: #b93f36;
    }
    :host-context(.dark) .chip-yes {
      background-color: rgb(68 186 130 / 0.26);
      border-color: rgb(68 186 130 / 0.55);
      color: #7fd7b0;
    }
    :host-context(.dark) .chip-no {
      background-color: rgb(232 105 94 / 0.22);
      border-color: rgb(232 105 94 / 0.5);
      color: #f0938b;
    }
  `
})
export class AccessTableComponent {
  protected readonly store = inject(DesignStore)
  protected readonly ui = inject(AccessUiService)
  protected readonly modeService = inject(StudioModeService)

  protected readonly roleLabel = computed(() => ROLE_LABELS[this.ui.role()])

  protected readonly rows = computed<AccessTableRow[]>(() => {
    const term = this.ui.search().trim().toLowerCase()
    const role = this.ui.role()
    return accessRows(this.store.resources())
      .filter(row => !term || row.label.toLowerCase().includes(term) || row.name.includes(term))
      .filter(row => {
        if (!this.ui.onlyWithAccess() || role === 'admin') return true
        return row.cells.some(cell => cell.capability === 'view' && cell.roles.includes(role))
      })
  })

  protected readonly hasTransitions = computed(() => this.rows().some(row => row.cells.some(c => c.kind === 'transition')))

  protected readonly roleRows = ROLE_ROWS
  protected readonly roleLabels = ROLE_LABELS

  /** La entidad del pivote Entidad: la elegida, o la primera del diseño si no hay elección. */
  protected readonly selectedRow = computed<AccessTableRow | undefined>(() => {
    const rows = accessRows(this.store.resources())
    return rows.find(row => row.name === this.ui.entity()) ?? rows[0]
  })

  protected readonly entityOptions = computed<AppSelectOption[]>(() =>
    this.store.resources().map(resource => ({ value: resource.name, label: resource.labelPlural }))
  )

  protected readonly selectedHasTransitions = computed(
    () => this.selectedRow()?.cells.some(c => c.kind === 'transition') ?? false
  )

  protected crudCells(row: AccessTableRow): AccessCapabilityCell[] {
    return row.cells.filter(cell => cell.kind === 'crud')
  }

  protected transitionCells(row: AccessTableRow): AccessCapabilityCell[] {
    return row.cells.filter(cell => cell.kind === 'transition')
  }

  protected granted(cell: AccessCapabilityCell, role: AccessActorRole): boolean {
    return role === 'admin' || cell.roles.includes(role)
  }

  /** La marca desnuda: sin caja, solo el símbolo en color (ver los estilos del componente). */
  protected cellClasses(cell: AccessCapabilityCell, role: AccessActorRole): string {
    return this.granted(cell, role) ? 'mark-yes' : 'mark-no'
  }

  /** El chip de transición sí conserva forma: lleva texto, y sin borde se leería como prosa suelta. */
  protected chipClasses(cell: AccessCapabilityCell, role: AccessActorRole): string {
    return this.granted(cell, role) ? 'chip-yes' : 'chip-no'
  }

  protected toggle(row: AccessTableRow, cell: AccessCapabilityCell): void {
    this.toggleAs(row, cell, this.ui.role())
  }

  protected toggleAs(row: AccessTableRow, cell: AccessCapabilityCell, role: AccessActorRole): void {
    if (role === 'admin') return
    const resource = this.store.resources().find(r => r.name === row.name)
    if (!resource) return
    this.store.setResourceAccess(row.name, toggleCapability(resource, cell.capability, role))
  }

  protected onSearch(event: Event): void {
    this.ui.search.set((event.target as HTMLInputElement).value)
  }

}
