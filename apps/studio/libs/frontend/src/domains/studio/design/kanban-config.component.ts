import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { AppSelect, type AppSelectOption } from '../../../shared/components/ui/select'
import { ActiveViewService } from './active-view.service'
import { DesignStore } from './design-store'

/**
 * Panel del bloque KANBAN (spec 61): Columnas y Etiqueta. Segundo bloque con
 * configuración propia; mismo contrato que [[calendar-config]] — la config vive
 * en el bloque y el store la replica a la entidad.
 */
@Component({
  selector: 'studio-kanban-config',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, AppSelect],
  template: `
    @if (view(); as v) {
      <section class="mb-4 border-t pt-3" data-testid="kanban-config">
        <h3 class="mb-2 text-sm font-semibold">Componente · kanban</h3>
        <div class="space-y-2 text-xs">
          <label class="flex items-center justify-between gap-2">
            <span>Columnas</span>
            <app-select
              class="w-[124px] shrink-0"
              size="sm"
              [options]="v.columnOptions"
              [ngModel]="v.block.columnsField ?? ''"
              [ngModelOptions]="{ standalone: true }"
              (ngModelChange)="patch({ columnsField: $event })"
              data-testid="kanban-columns"
            />
          </label>
          <label class="flex items-center justify-between gap-2">
            <span>Etiqueta</span>
            <app-select
              class="w-[124px] shrink-0"
              size="sm"
              [options]="v.labelOptions"
              [ngModel]="v.block.labelField ?? ''"
              [ngModelOptions]="{ standalone: true }"
              (ngModelChange)="patch({ labelField: $event || undefined })"
              data-testid="kanban-label"
            />
          </label>
          @if (v.stateDriven) {
            <p class="text-muted-foreground">
              El campo es el estado de la entidad: mover una tarjeta disparará su transición.
            </p>
          }
        </div>
      </section>
    }
  `
})
export class KanbanConfigComponent {
  readonly resource = input<string | null>(null)

  private readonly store = inject(DesignStore)
  private readonly active = inject(ActiveViewService)

  protected readonly view = computed(() => {
    const pageIndex = this.active.index()
    const blocks = this.store.pages()[pageIndex]?.blocks ?? []
    const blockIndex = blocks.findIndex(b => b.kind === 'kanban' && b.resource === this.resource())
    const draft = this.store.resources().find(r => r.name === this.resource())
    if (blockIndex < 0 || !draft) return null

    const block = blocks[blockIndex]
    const option = (name: string, label: string): AppSelectOption => ({ value: name, label })

    return {
      pageIndex,
      blockIndex,
      block,
      stateDriven: draft.state?.field !== undefined && draft.state.field === block.columnsField,
      columnOptions: draft.fields.filter(f => f.type === 'enum').map(f => option(f.name, f.label)),
      labelOptions: draft.fields.filter(f => f.type !== 'enum').map(f => option(f.name, f.label))
    }
  })

  protected patch(change: { columnsField?: string; labelField?: string }): void {
    const v = this.view()
    if (v) this.store.setKanbanConfig(v.pageIndex, v.blockIndex, change)
  }
}
