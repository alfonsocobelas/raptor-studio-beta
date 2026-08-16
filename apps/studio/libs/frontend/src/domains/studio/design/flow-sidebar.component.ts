import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core'
import type { FlowNodeKind } from '@raptor/schema'
import { NgIcon, provideIcons } from '@ng-icons/core'
import { lucideCircleDot, lucideDiamond, lucidePlus, lucideSquare, lucideZap } from '@ng-icons/lucide'
import { FLOW_KIND_LABELS, FLOW_KIND_STARTERS } from '@app/shared/domain'
import { ActiveViewService } from './active-view.service'
import { DesignStore } from './design-store'

interface FlowBlock {
  kind: FlowNodeKind
  icon: string
}

/**
 * Los cuatro bloques que el contrato de flujos conoce. El DISPARADOR está aunque cada
 * flujo nazca con el suyo: si lo borras tienes que poder volver a ponerlo, y la frontera
 * exige exactamente uno, así que el botón se apaga cuando el flujo ya lo tiene.
 * Sus nombres y sus textos de partida vienen del dominio, no de aquí.
 */
const FLOW_BLOCKS: FlowBlock[] = [
  { kind: 'start', icon: 'lucideZap' },
  { kind: 'step', icon: 'lucideSquare' },
  { kind: 'decision', icon: 'lucideDiamond' },
  { kind: 'end', icon: 'lucideCircleDot' }
]

/** Raíl izquierdo del modo Flujos: los bloques que se añaden y los flujos del diseño. */
@Component({
  selector: 'studio-flow-sidebar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIcon],
  providers: [provideIcons({ lucideCircleDot, lucideDiamond, lucidePlus, lucideSquare, lucideZap })],
  template: `
    <aside class="studio-rail flex h-full w-64 shrink-0 flex-col gap-6 overflow-y-auto border-r p-4">
      <section>
        <h2 class="studio-eyebrow mb-2 px-1">Bloques</h2>
        @for (block of blocks; track block.kind) {
          <button
            type="button"
            class="flow-block studio-ui mb-1.5 flex w-full items-center gap-2 rounded-[7px] border px-2 py-2 text-left transition-colors disabled:opacity-40"
            [disabled]="blocked(block)"
            [attr.data-testid]="'flow-block-' + block.kind"
            [attr.title]="blockedReason(block)"
            (click)="addBlock(block)"
          >
            <ng-icon [name]="block.icon" size="15" />
            <span class="capitalize">{{ label(block.kind) }}</span>
          </button>
        }
      </section>

      <section>
        <h2 class="studio-eyebrow mb-2 px-1">Flujos</h2>
        @for (flow of store.flows(); track flow.name) {
          <!-- La fila se parte en dos pulsables: elegir el flujo y borrarlo. Un botón dentro
               de otro sería HTML inválido, y la cruz necesita su propia zona de clic para no
               quedar a un despiste del gesto frecuente (elegir). -->
          <div class="group mb-0.5 flex items-center">
            <button
              type="button"
              class="hover:ring-foreground/25 studio-ui flex min-w-0 flex-1 items-center gap-2 rounded-[7px] px-2 py-2 text-left transition-shadow hover:ring-1"
              [class.bg-background]="flow.name === active.flow()"
              [class.font-semibold]="flow.name === active.flow()"
              [class.shadow-sm]="flow.name === active.flow()"
              [class.ring-1]="flow.name === active.flow()"
              [attr.aria-current]="flow.name === active.flow() ? 'true' : null"
              [attr.data-testid]="'flow-item-' + flow.name"
              (click)="active.selectFlow(flow.name)"
            >
              <span class="min-w-0 flex-1 truncate">{{ flow.name }}</span>
            </button>
            <!-- Solo asoma al pasar por la fila, y en gris hasta que se apunta: el rojo es
                 escaso y llega en el instante de pulsar. Se esconde con opacidad, no con
                 hidden, para que el hueco siga reservado y el nombre no se re-recorte. -->
            <button
              type="button"
              class="text-muted-foreground hover:text-destructive focus-visible:opacity-100 -mr-1 flex h-9 w-6 shrink-0 items-center justify-center text-xs leading-none opacity-0 transition-[color,opacity] group-hover:opacity-100"
              [attr.data-testid]="'flow-remove-' + flow.name"
              [attr.title]="'Borrar el flujo ' + flow.name"
              (click)="store.removeFlow(flow.name)"
            >
              ✕
            </button>
          </div>
        }
        @if (!store.flows().length) {
          <p class="text-muted-foreground px-1 py-1 text-xs" data-testid="flow-empty">Todavía no hay flujos</p>
        }

        @if (creating()) {
          <form class="mt-1 flex items-center gap-1" (submit)="onSubmit($event)">
            <input
              class="border-input w-full rounded-md border px-2 py-1 text-xs"
              name="flowName"
              placeholder="Nombre del flujo…"
              [value]="flowName()"
              (input)="onName($event)"
              data-testid="flow-new-name"
            />
            <button
              type="button"
              class="bg-primary text-primary-foreground rounded-md px-2 py-1 text-xs"
              data-testid="flow-new-ok"
              (click)="confirmFlow()"
            >
              ✓
            </button>
          </form>
        } @else {
          <button
            type="button"
            class="text-muted-foreground hover:border-foreground/45 hover:text-foreground mt-1 flex w-full items-center gap-2 studio-ui border-foreground/35 hover:bg-foreground/5 rounded-[7px] border-2 border-dashed px-2 py-2 text-left transition-colors"
            data-testid="flow-new"
            (click)="creating.set(true)"
          >
            <ng-icon name="lucidePlus" size="14" />
            Nuevo flujo
          </button>
        }
      </section>

      <p class="text-muted-foreground mt-auto px-1 text-xs">
        Los bloques nuevos caen en el centro del lienzo; enlázalos arrastrando.
      </p>
    </aside>
  `,
  styles: `
    /* El naranja de la casa, el mismo que viste el lienzo de flujos (flow-view);
       el token --flow-accent es global (styles.css).
       Los botones de bloque van en el naranja macizo, con el texto invertido:
       la paleta se ve de un vistazo como los verbos que son. */
    .flow-block {
      background-color: var(--flow-accent);
      border-color: transparent;
      color: #fff;
    }
    .flow-block:not(:disabled):hover {
      background-color: color-mix(in oklab, var(--flow-accent) 88%, black);
    }
  `
})
export class FlowSidebarComponent {
  protected readonly store = inject(DesignStore)
  protected readonly active = inject(ActiveViewService)

  protected readonly blocks = FLOW_BLOCKS
  protected readonly creating = signal(false)
  protected readonly flowName = signal('')

  protected readonly flows = computed(() => this.store.flows())

  protected label(kind: FlowNodeKind): string {
    return FLOW_KIND_LABELS[kind]
  }

  /** El flujo activo ya tiene disparador: la frontera solo admite uno. */
  private readonly conDisparador = computed(() =>
    (this.store.flows().find(flow => flow.name === this.active.flow())?.nodes ?? []).some(node => node.kind === 'start')
  )

  protected blocked(block: FlowBlock): boolean {
    return !this.active.flow() || (block.kind === 'start' && this.conDisparador())
  }

  protected blockedReason(block: FlowBlock): string {
    if (!this.active.flow()) return 'Crea antes un flujo'
    if (block.kind === 'start' && this.conDisparador()) return 'Un flujo tiene un único disparador'
    return `Añadir al flujo ${this.active.flow()}`
  }

  protected addBlock(block: FlowBlock): void {
    const flow = this.active.flow()
    if (flow && !this.blocked(block)) this.store.addFlowNode(flow, block.kind, FLOW_KIND_STARTERS[block.kind])
  }

  protected onName(event: Event): void {
    this.flowName.set((event.target as HTMLInputElement).value)
  }

  protected onSubmit(event: Event): void {
    event.preventDefault()
    this.confirmFlow()
  }

  protected confirmFlow(): void {
    const name = this.flowName().trim()
    if (!name) return
    if (!this.store.addFlow(name)) return
    this.creating.set(false)
    this.flowName.set('')
    // recién creado queda al mando: lo siguiente es dibujarlo
    this.active.selectFlow(name)
  }
}
