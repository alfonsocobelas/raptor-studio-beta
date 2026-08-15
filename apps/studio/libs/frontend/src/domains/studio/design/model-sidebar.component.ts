import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core'
import { NgIcon, provideIcons } from '@ng-icons/core'
import { lucideIdCard, lucidePlus, lucideTable } from '@ng-icons/lucide'
import { ActiveViewService } from './active-view.service'
import { DesignStore } from './design-store'

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

        @if (creating()) {
          <form class="mb-1.5 flex items-center gap-1" (submit)="onSubmit($event)">
            <input
              class="border-input w-full rounded-md border px-2 py-1 text-xs"
              name="entityName"
              placeholder="Nombre de la entidad…"
              [value]="entityName()"
              (input)="onName($event)"
              data-testid="model-new-entity-name"
            />
            <button
              type="button"
              class="bg-primary text-primary-foreground rounded-md px-2 py-1 text-xs"
              data-testid="model-new-entity-ok"
              (click)="confirmEntity()"
            >
              ✓
            </button>
          </form>
        } @else {
          <button
            type="button"
            class="rail-verb studio-ui mb-1.5 flex w-full items-center gap-2 rounded-[7px] px-2 py-2 text-left font-semibold transition-colors"
            data-testid="model-add-entity"
            (click)="creating.set(true)"
          >
            <ng-icon name="lucideTable" size="15" />
            <span class="flex-1">Entidad</span>
            <span class="text-[9px] uppercase opacity-60">E</span>
          </button>
        }

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
          <span class="text-[9px] uppercase opacity-60">C</span>
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

  protected readonly creating = signal(false)
  protected readonly entityName = signal('')

  /** La entidad elegida en el diagrama: a ella se le añaden los campos. */
  protected readonly selected = computed(() => this.active.resource())

  /**
   * Atajos anunciados en los botones: E abre el alta de entidad, C añade campo. Si el
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
      this.creating.set(true)
    }
    if (event.key === 'c' || event.key === 'C') {
      event.preventDefault()
      this.addField()
    }
  }

  protected onName(event: Event): void {
    this.entityName.set((event.target as HTMLInputElement).value)
  }

  protected onSubmit(event: Event): void {
    event.preventDefault()
    this.confirmEntity()
  }

  /** Misma puerta que el resto del lienzo: el store valida y decide. */
  protected confirmEntity(): void {
    const label = this.entityName().trim()
    if (!label) return
    if (!this.store.addResource(label)) return
    this.creating.set(false)
    this.entityName.set('')
    // recién creada queda elegida: lo siguiente que se hace es darle campos
    const created = this.store.resources().at(-1)
    if (created) this.active.selectResource(created.name)
  }

  protected addField(): void {
    const resource = this.selected()
    if (resource) this.store.addField(resource)
  }
}
