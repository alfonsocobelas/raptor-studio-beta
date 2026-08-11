import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core'
import type { FlowNodeKind } from '@acc/schema'
import { NgIcon, provideIcons } from '@ng-icons/core'
import { lucideCircleDot, lucideDiamond, lucidePlus, lucideSquare } from '@ng-icons/lucide'
import { ActiveViewService } from './active-view.service'
import { DesignStore } from './design-store'

interface FlowBlock {
  kind: FlowNodeKind
  label: string
  icon: string
  /** Texto con el que nace el nodo; se edita después en el inspector */
  starter: string
}

/**
 * Los bloques que el contrato de flujos conoce (spec 28): paso, decisión y fin.
 * «Inicio» no está porque cada flujo nace con el suyo, y no hay disparadores ni
 * esperas: un flujo es un diagrama que viaja como contexto, no una automatización
 * que alguien ejecute.
 */
const FLOW_BLOCKS: FlowBlock[] = [
  { kind: 'step', label: 'Paso', icon: 'lucideSquare', starter: 'Nuevo paso' },
  { kind: 'decision', label: 'Decisión', icon: 'lucideDiamond', starter: '¿Decisión?' },
  { kind: 'end', label: 'Fin', icon: 'lucideCircleDot', starter: 'Fin' }
]

/** Raíl izquierdo del modo Flujos: los bloques que se añaden y los flujos del diseño. */
@Component({
  selector: 'studio-flow-sidebar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIcon],
  providers: [provideIcons({ lucideCircleDot, lucideDiamond, lucidePlus, lucideSquare })],
  template: `
    <aside class="studio-rail flex h-full w-64 shrink-0 flex-col gap-6 overflow-y-auto p-4">
      <section>
        <h2 class="studio-eyebrow mb-2 px-1">Bloques</h2>
        @for (block of blocks; track block.kind) {
          <button
            type="button"
            class="hover:border-foreground/40 studio-ui mb-1.5 flex w-full items-center gap-2 rounded-[7px] border px-2 py-2 text-left transition-colors disabled:opacity-40"
            [disabled]="!active.flow()"
            [attr.data-testid]="'flow-block-' + block.kind"
            [attr.title]="active.flow() ? 'Añadir al flujo ' + active.flow() : 'Crea antes un flujo'"
            (click)="addBlock(block)"
          >
            <ng-icon [name]="block.icon" size="15" />
            {{ block.label }}
          </button>
        }
      </section>

      <section>
        <h2 class="studio-eyebrow mb-2 px-1">Flujos</h2>
        @for (flow of store.flows(); track flow.name) {
          <button
            type="button"
            class="hover:ring-foreground/25 studio-ui mb-0.5 flex w-full items-center gap-2 rounded-[7px] px-2 py-2 text-left transition-shadow hover:ring-1"
            [class.bg-background]="flow.name === active.flow()"
            [class.font-semibold]="flow.name === active.flow()"
            [class.shadow-sm]="flow.name === active.flow()"
            [class.ring-1]="flow.name === active.flow()"
            [attr.aria-current]="flow.name === active.flow() ? 'true' : null"
            [attr.data-testid]="'flow-item-' + flow.name"
            (click)="active.selectFlow(flow.name)"
          >
            <span class="min-w-0 flex-1 truncate">{{ flow.name }}</span>
            <span class="text-muted-foreground shrink-0 text-[10px]">{{ flow.nodes.length }}</span>
          </button>
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
            class="text-muted-foreground hover:border-foreground/40 hover:text-foreground studio-ui mt-1 flex w-full items-center gap-2 rounded-[7px] border border-dashed px-2 py-2 text-left transition-colors"
            data-testid="flow-new"
            (click)="creating.set(true)"
          >
            <ng-icon name="lucidePlus" size="14" />
            Nuevo flujo
          </button>
        }
      </section>

      <p class="text-muted-foreground mt-auto px-1 text-xs">
        Los bloques se añaden al final del flujo; enlázalos arrastrando en el lienzo.
      </p>
    </aside>
  `
})
export class FlowSidebarComponent {
  protected readonly store = inject(DesignStore)
  protected readonly active = inject(ActiveViewService)

  protected readonly blocks = FLOW_BLOCKS
  protected readonly creating = signal(false)
  protected readonly flowName = signal('')

  protected readonly flows = computed(() => this.store.flows())

  protected addBlock(block: FlowBlock): void {
    const flow = this.active.flow()
    if (flow) this.store.addFlowNode(flow, block.kind, block.starter)
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
