import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core'
import { NgIcon, provideIcons } from '@ng-icons/core'
import { lucideArrowUp, lucideColumns2, lucideFile, lucidePaperclip, lucideSquare, lucideX } from '@ng-icons/lucide'
import { generableHere, type DesignBlock } from '@app/shared/domain'
import { KpiCardComponent } from '../../../shared/components/kpi-card'
import { ActiveViewService } from './active-view.service'
import { BlockDragService } from './block-drag.service'
import { CanvasNoticeService } from './canvas-notice.service'
import { dropResource, placeBlock } from './block-drop'
import { DesignStore } from './design-store'
import { CanvasTableComponent } from './canvas-table.component'
import { CanvasDetailComponent } from './canvas-detail.component'
import { CanvasCardsComponent } from './canvas-cards.component'
import { mockTotal } from './mock-data'

/**
 * Una VISTA del diseño: sus bloques en orden, cada uno a ancho completo o media
 * fila (ADR-009). Hover sobre un bloque → mover, cambiar ancho y quitar.
 */
@Component({
  selector: 'studio-canvas-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [KpiCardComponent, CanvasTableComponent, CanvasDetailComponent, CanvasCardsComponent, NgIcon],
  providers: [provideIcons({ lucideArrowUp, lucideColumns2, lucideFile, lucidePaperclip, lucideSquare, lucideX })],
  template: `
    @if (page(); as current) {
      <!-- La ficha emitida NO tiene cabecera de página: su h1 es el nombre del
           registro. Ponerla aquí sería prometer una pantalla distinta. -->
      @if (!current.drillDown) {
        <header class="mb-5">
          <h1 class="text-2xl font-bold tracking-tight">{{ current.title }}</h1>
          <p class="text-muted-foreground text-sm capitalize">{{ store.appName() }}</p>
        </header>
      }

      @if (!current.blocks.length) {
        <div
          class="text-muted-foreground rounded-lg border border-dashed py-16 text-center transition-colors"
          [class.drop-zone]="dragging()"
          data-testid="empty-page"
          (dragover)="allowDrop($event)"
          (drop)="drop($event, 0)"
        >
          @if (dragging()) {
            <span class="block h-full w-full text-sm font-medium" data-testid="drop-zone-0">
              Suelta aquí el componente
            </span>
          } @else {
            <p class="mb-1 text-sm font-medium">Vista vacía</p>
            <p class="text-xs">Arrastra un componente desde la barra: tabla, KPIs, datos, galería o ficheros.</p>
          }
        </div>
      }

      <div class="flex flex-wrap gap-4">
        @for (block of current.blocks; track $index) {
          @if (dragging()) {
            <div
              class="drop-zone -mb-2 w-full rounded border border-dashed py-1.5 text-center text-[11px] transition-colors"
              [attr.data-testid]="'drop-zone-' + $index"
              (dragover)="allowDrop($event)"
              (drop)="drop($event, $index)"
            >
              Soltar aquí
            </div>
          }
          <div
            class="group relative rounded-lg transition-shadow hover:ring-2 hover:ring-primary/60"
            [class]="block.width === 'half' ? 'min-w-80 flex-1' : 'w-full'"
            [attr.data-testid]="'block-' + block.kind + '-' + $index"
            (click)="selectBlock(block)"
          >
            @if (!generable(block)) {
              <span
                class="absolute -top-2 left-3 z-10 rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-amber-800"
              >
                diseño · aún no generable
              </span>
            }

            @switch (block.kind) {
              @case ('table') {
                <studio-canvas-table [resource]="block.resource ?? ''" />
              }
              @case ('fields') {
                <studio-canvas-detail [resource]="block.resource ?? ''" />
              }
              @case ('cards') {
                <studio-canvas-cards [resource]="block.resource ?? ''" />
              }
              @case ('kpis') {
                <div
                  class="grid gap-4"
                  [style.grid-template-columns]="'repeat(' + kpiCols(block) + ', minmax(0, 1fr))'"
                >
                  @for (kpi of kpis(block); track kpi.testId) {
                    <app-kpi-card
                      [title]="kpi.title"
                      [value]="kpi.value"
                      [subtitle]="kpi.subtitle"
                      [testId]="kpi.testId"
                    />
                  }
                </div>
              }
              @case ('attachments') {
                <section>
                  <h2 class="mb-2 text-sm font-semibold">Ficheros adjuntos</h2>
                  <div
                    class="border-input bg-background flex flex-col items-center rounded-lg border-2 border-dashed px-6 py-8 text-center"
                  >
                    <ng-icon name="lucidePaperclip" size="26" class="text-muted-foreground" />
                    <p class="text-sm font-medium">Arrastra ficheros aquí o haz clic para subirlos</p>
                    <p class="text-muted-foreground text-xs">PDF, imágenes o documentos · máx. 10 MB</p>
                  </div>
                  <ul class="mt-3 space-y-1">
                    @for (file of sampleFiles; track file.name) {
                      <li class="bg-background flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                        <span class="flex items-center gap-2">
                          <ng-icon name="lucideFile" size="14" class="text-muted-foreground" />
                          {{ file.name }}
                        </span>
                        <span class="text-muted-foreground text-xs">{{ file.size }}</span>
                      </li>
                    }
                  </ul>
                </section>
              }
              @default {
                <p class="text-muted-foreground rounded-lg border p-4 text-sm">{{ block.text }}</p>
              }
            }

            <div class="absolute -right-2 -top-2 hidden gap-1 group-hover:flex">
              <button
                type="button"
                class="bg-background h-6 w-6 rounded-full border text-xs shadow"
                title="Mover arriba"
                [attr.data-testid]="'block-up-' + $index"
                (click)="move($event, $index, -1)"
              >
                <ng-icon name="lucideArrowUp" size="13" />
              </button>
              <button
                type="button"
                class="bg-background h-6 rounded-full border px-2 text-[10px] shadow"
                title="Ancho completo o media fila"
                [attr.data-testid]="'block-width-' + $index"
                (click)="toggleWidth($event, $index, block)"
              >
                <ng-icon [name]="block.width === 'half' ? 'lucideColumns2' : 'lucideSquare'" size="13" />
              </button>
              <button
                type="button"
                class="bg-destructive h-6 w-6 rounded-full text-xs font-bold text-white shadow"
                title="Quitar bloque"
                [attr.data-testid]="'block-remove-' + $index"
                (click)="remove($event, $index)"
              >
                <ng-icon name="lucideX" size="13" />
              </button>
            </div>
          </div>
        }
        <!-- el último hueco: soltar debajo de todo -->
        @if (dragging() && current.blocks.length) {
          <div
            class="drop-zone w-full rounded border border-dashed py-3 text-center text-[11px] transition-colors"
            [attr.data-testid]="'drop-zone-' + current.blocks.length"
            (dragover)="allowDrop($event)"
            (drop)="drop($event, current.blocks.length)"
          >
            Soltar aquí
          </div>
        }
      </div>
    }
  `,
  styles: `
    /* El arrastre habla en el NARANJA del estudio (#d75f3d, el de la rejilla), no en
       el primario de la app previsualizada: lo que se está haciendo es diseñar, y eso
       no debe confundirse con un color que sí viaja al código emitido. */
    .drop-zone {
      --studio-drag: #d75f3d;
      border-color: var(--studio-drag);
      background-color: var(--studio-drag);
      color: #fff;
    }
    /* El hueco bajo el puntero se oscurece un punto: sigue siendo el mismo naranja,
       pero dice cuál de todos se va a llevar el bloque. */
    .drop-zone:hover {
      background-color: color-mix(in oklab, var(--studio-drag) 85%, black);
      border-color: color-mix(in oklab, var(--studio-drag) 85%, black);
    }
  `
})
export class CanvasPageComponent {
  readonly pageIndex = input.required<number>()
  readonly select = output<string>()

  protected readonly store = inject(DesignStore)
  protected readonly drag = inject(BlockDragService)
  private readonly notice = inject(CanvasNoticeService)
  protected readonly view = inject(ActiveViewService)
  protected readonly page = computed(() => this.store.pages()[this.pageIndex()])

  protected readonly sampleFiles = [
    { name: 'albaran-julio.pdf', size: '182 KB' },
    { name: 'foto-lote-0412.jpg', size: '1,4 MB' }
  ]

  /** Los huecos solo existen mientras hay algo en el aire. */
  protected readonly dragging = computed(() => this.drag.kind() !== null)

  /** Sin cortar el `dragover` el navegador rechaza el `drop`: es la forma de decir «aquí sí». */
  protected allowDrop(event: Event): void {
    event.preventDefault()
  }

  /**
   * Soltar: el bloque cae en el hueco elegido con la entidad que le dicta el contexto
   * (la de la vista). Sin entidad en el modelo no hay nada que dibujar, así que no cae nada.
   */
  protected drop(event: Event, at: number): void {
    event.preventDefault()
    const kind = this.drag.kind()
    this.drag.end()
    if (!kind) return
    const resource = dropResource(this.page(), this.view.resource(), this.store.resources())
    if (!resource) return
    placeBlock({ store: this.store, notice: this.notice, active: this.view }, this.pageIndex(), kind, resource, at)
  }

  /** El aviso «aún no generable» depende de la VISTA: ver generableHere. */
  protected generable(block: DesignBlock): boolean {
    const page = this.page()
    return page ? generableHere(page, block) : true
  }

  protected kpis(block: DesignBlock): { title: string; value: number; subtitle?: string; testId: string }[] {
    return (block.resources ?? []).map((resource, index) => {
      const draft = this.store.resources().find(r => r.name === resource)
      return {
        title: draft?.labelPlural ?? resource,
        value: mockTotal(index),
        subtitle: `Total de ${draft?.labelPlural.toLowerCase() ?? resource}`,
        testId: `kpi-${resource}`
      }
    })
  }

  protected kpiCols(block: DesignBlock): number {
    return Math.min(Math.max((block.resources ?? []).length, 2), 4)
  }

  protected selectBlock(block: DesignBlock): void {
    if (block.resource) this.select.emit(block.resource)
  }

  protected move(event: Event, index: number, delta: number): void {
    event.stopPropagation()
    const target = index + delta
    if (target >= 0) this.store.moveBlock(this.pageIndex(), index, target)
  }

  protected toggleWidth(event: Event, index: number, block: DesignBlock): void {
    event.stopPropagation()
    this.store.setBlockWidth(this.pageIndex(), index, block.width === 'half' ? 'full' : 'half')
  }

  protected remove(event: Event, index: number): void {
    event.stopPropagation()
    this.store.removeBlock(this.pageIndex(), index)
  }
}
