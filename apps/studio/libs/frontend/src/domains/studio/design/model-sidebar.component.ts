import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core'
import { NgIcon, provideIcons } from '@ng-icons/core'
import { lucideIdCard, lucidePlus, lucideTable } from '@ng-icons/lucide'
import { ActiveViewService } from './active-view.service'
import { DesignStore } from './design-store'
import { EntityDraftService } from './entity-draft.service'

/**
 * Raíl izquierdo del modo Modelo: lo que se puede añadir al diagrama. No hay
 * botón de relación porque la relación se crea arrastrando el asa de una caja a
 * otra — un botón que no la crea sería un adorno que miente.
 */
@Component({
  selector: 'studio-model-sidebar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIcon],
  providers: [provideIcons({ lucideIdCard, lucidePlus, lucideTable })],
  host: { '(document:keydown)': 'onShortcut($event)' },
  template: `
    <aside class="studio-rail flex h-full w-64 shrink-0 flex-col gap-6 overflow-y-auto border-r p-4">
      <section>
        <h2 class="studio-eyebrow mb-2 px-1">Añadir</h2>

        <button
          type="button"
          class="rail-verb studio-ui mb-1.5 flex w-full items-center gap-2 rounded-[7px] px-2 py-2 text-left font-semibold transition-colors"
          [class.ring-2]="draft.pending()"
          data-testid="model-add-entity"
          title="Crea la caja en el diagrama y la nombras allí mismo"
          (click)="draft.start()"
        >
          <ng-icon name="lucideTable" size="15" />
          <span class="flex-1">Entidad</span>
        </button>

        <button
          type="button"
          class="rail-verb studio-ui flex w-full items-center gap-2 rounded-[7px] px-2 py-2 text-left font-semibold transition-colors disabled:opacity-40"
          [disabled]="!selected()"
          [attr.title]="selected() ? 'Añadir una columna a ' + selected() : 'Elige antes una entidad en el diagrama'"
          data-testid="model-add-field"
          (click)="addField()"
        >
          <ng-icon name="lucideIdCard" size="15" />
          <span class="flex-1">Campo</span>
        </button>

        <p class="text-muted-foreground mt-3 px-1 text-xs" data-testid="model-add-hint">
          @if (selected(); as resource) {
            El campo se añade a la entidad elegida: <strong class="text-foreground">{{ resource }}</strong>
          } @else {
            Selecciona una entidad en el diagrama para añadirle campos.
          }
        </p>

        <p class="text-muted-foreground mt-2 px-1 text-xs" data-testid="model-relation-hint">
          Para relacionar dos entidades, arrastra del asa de una caja a la otra.
        </p>
      </section>

      <p class="text-muted-foreground mt-auto px-1 text-xs">
        Selecciona una entidad del diagrama para editar sus columnas en el inspector.
      </p>
    </aside>
  `,
  styles: `
    /* El mismo naranja macizo que la paleta de bloques de Flujos (flow-sidebar):
       los verbos de todos los raíles visten igual. El token es global (styles.css). */
    .rail-verb {
      background-color: var(--flow-accent);
      color: #fff;
    }
    .rail-verb:not(:disabled):hover {
      background-color: color-mix(in oklab, var(--flow-accent) 88%, black);
    }
  `
})
export class ModelSidebarComponent {
  private readonly store = inject(DesignStore)
  private readonly active = inject(ActiveViewService)
  protected readonly draft = inject(EntityDraftService)

  /** La entidad elegida en el diagrama: a ella se le añaden los campos. */
  protected readonly selected = computed(() => this.active.resource())

  /**
   * Atajos de teclado: E abre el alta de entidad, C añade campo. Si el
   * foco está escribiendo, no se disparan — teclear «campo» en un nombre no puede
   * crear cinco cosas por el camino.
   */
  protected onShortcut(event: KeyboardEvent): void {
    if (event.metaKey || event.ctrlKey || event.altKey) return
    // el target puede ser el propio document, que no tiene closest()
    const target = event.target instanceof HTMLElement ? event.target : null
    if (target?.closest('input, textarea, select, [contenteditable="true"]')) return

    if (event.key === 'e' || event.key === 'E') {
      event.preventDefault()
      this.draft.start()
    }
    if (event.key === 'c' || event.key === 'C') {
      event.preventDefault()
      this.addField()
    }
  }

  protected addField(): void {
    const resource = this.selected()
    if (resource) this.store.addField(resource)
  }
}
