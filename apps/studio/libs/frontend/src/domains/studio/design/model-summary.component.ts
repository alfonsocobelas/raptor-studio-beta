import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core'
import { modelEdges } from '@app/shared/domain'
import { DesignStore } from './design-store'

/**
 * El tamaño del modelo, en la barra: cuántas entidades y cuántas relaciones hay
 * dibujadas. No dice ceros —«0 relaciones» es ruido— y las relaciones se cuentan
 * derivadas de los campos `ref`, que es lo único que existe de verdad.
 */
@Component({
  selector: 'studio-model-summary',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="text-muted-foreground text-[11px] uppercase tracking-wider" data-testid="model-summary">
      {{ summary() }}
    </span>
  `
})
export class ModelSummaryComponent {
  private readonly store = inject(DesignStore)

  protected readonly summary = computed(() => {
    const entities = this.store.resources().length
    if (!entities) return 'Sin entidades'

    const relations = modelEdges(this.store.resources()).length
    const parts = [entities === 1 ? '1 entidad' : `${entities} entidades`]
    if (relations) parts.push(relations === 1 ? '1 relación' : `${relations} relaciones`)
    return parts.join(' · ')
  })
}
