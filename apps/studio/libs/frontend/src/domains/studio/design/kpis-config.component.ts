import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { AppSelect, type AppSelectOption } from '../../../shared/components/ui/select'
import { ActiveViewService } from './active-view.service'
import { DesignStore } from './design-store'

/**
 * Panel de la FILA de KPIs (spec 70, seguimiento). La fila es UN bloque con N tarjetas, así que
 * la ✕ del lienzo se llevaba las N: aquí cada tarjeta tiene la suya (reportado 2026-08-27).
 *
 * Lo editable de este bloque es qué entidades mide y en qué orden. El TÍTULO de cada tarjeta sale
 * del nombre en plural de la entidad y hoy el estudio no sabe renombrar entidades por ningún
 * sitio: por eso aquí se lee, no se escribe.
 */
@Component({
  selector: 'studio-kpis-config',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, AppSelect],
  template: `
    @if (view(); as v) {
      <section class="mb-4 border-t pt-3" data-testid="kpis-config">
        <h3 class="mb-2 text-sm font-semibold">Componente · fila de KPIs</h3>
        <div class="space-y-1.5 text-xs">
          @for (card of v.cards; track card.name; let i = $index) {
            <div class="flex items-center gap-1 rounded-md border px-2 py-1" [attr.data-testid]="'kpis-card-' + card.name">
              <span class="flex-1 truncate">{{ card.label }}</span>
              <button
                type="button"
                class="hover:bg-accent rounded px-1 disabled:opacity-30"
                title="Subir"
                [disabled]="i === 0"
                [attr.data-testid]="'kpis-up-' + card.name"
                (click)="move(i, -1)"
              >
                ↑
              </button>
              <button
                type="button"
                class="hover:bg-accent rounded px-1 disabled:opacity-30"
                title="Bajar"
                [disabled]="i === v.cards.length - 1"
                [attr.data-testid]="'kpis-down-' + card.name"
                (click)="move(i, 1)"
              >
                ↓
              </button>
              <button
                type="button"
                class="text-destructive hover:bg-destructive/10 rounded px-1 font-bold disabled:opacity-30"
                [title]="v.cards.length > 1 ? 'Quitar esta tarjeta' : 'La fila tiene que medir al menos una entidad'"
                [disabled]="v.cards.length === 1"
                [attr.data-testid]="'kpis-remove-' + card.name"
                (click)="remove(card.name)"
              >
                ✕
              </button>
            </div>
          }

          @if (v.available.length) {
            <label class="flex items-center justify-between gap-2 pt-1">
              <span>Añadir</span>
              <app-select
                class="w-[124px] shrink-0"
                size="sm"
                [options]="v.available"
                [ngModel]="''"
                [ngModelOptions]="{ standalone: true }"
                (ngModelChange)="add($event)"
                data-testid="kpis-add"
              />
            </label>
          } @else {
            <p class="text-muted-foreground pt-1 text-[10px]">Esta fila ya mide todas las entidades del modelo.</p>
          }

          <p class="text-muted-foreground pt-1 text-[10px]">
            El título de cada tarjeta es el nombre en plural de su entidad.
          </p>
        </div>
      </section>
    }
  `
})
export class KpisConfigComponent {
  private readonly store = inject(DesignStore)
  private readonly active = inject(ActiveViewService)

  protected readonly view = computed(() => {
    const pageIndex = this.active.index()
    const blocks = this.store.pages()[pageIndex]?.blocks ?? []
    const blockIndex = blocks.findIndex(block => block.kind === 'kpis')
    if (blockIndex < 0) return null

    const measured = blocks[blockIndex].resources ?? []
    const resources = this.store.resources()
    const option = (value: string, label: string): AppSelectOption => ({ value, label })

    return {
      pageIndex,
      blockIndex,
      measured,
      cards: measured.map(name => ({
        name,
        label: resources.find(r => r.name === name)?.labelPlural ?? name
      })),
      available: [
        option('', '— elige entidad'),
        ...resources.filter(r => !measured.includes(r.name)).map(r => option(r.name, r.labelPlural))
      ].filter((_, index, all) => all.length > 1 || index > 0)
    }
  })

  protected remove(resource: string): void {
    const v = this.view()
    if (v) this.store.setKpiResources(v.pageIndex, v.blockIndex, v.measured.filter(name => name !== resource))
  }

  protected add(resource: string): void {
    const v = this.view()
    if (v && resource) this.store.setKpiResources(v.pageIndex, v.blockIndex, [...v.measured, resource])
  }

  protected move(index: number, delta: number): void {
    const v = this.view()
    if (!v) return
    const target = index + delta
    if (target < 0 || target >= v.measured.length) return
    const next = [...v.measured]
    const [moved] = next.splice(index, 1)
    next.splice(target, 0, moved)
    this.store.setKpiResources(v.pageIndex, v.blockIndex, next)
  }
}
