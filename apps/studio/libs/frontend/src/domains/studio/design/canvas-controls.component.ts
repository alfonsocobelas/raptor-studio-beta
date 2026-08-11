import { ChangeDetectionStrategy, Component, computed, inject, output } from '@angular/core'
import { NgIcon, provideIcons } from '@ng-icons/core'
import { lucideMaximize, lucideMinus, lucidePlus } from '@ng-icons/lucide'
import { CanvasViewportService, type CanvasId } from './canvas-viewport.service'
import { StudioModeService } from './studio-mode.service'

/** Controles de cámara del lienzo: alejar, el porcentaje (que vuelve al 100%), acercar y encajar. */
@Component({
  selector: 'studio-canvas-controls',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIcon],
  providers: [provideIcons({ lucideMaximize, lucideMinus, lucidePlus })],
  template: `
    <div class="bg-card canvas-card flex items-center gap-0.5 rounded-[9px] border p-0.5" data-testid="canvas-controls">
      <button
        type="button"
        class="hover:bg-accent/60 flex size-7 items-center justify-center rounded-[7px] transition-colors"
        title="Alejar"
        data-testid="canvas-zoom-out"
        (click)="viewport.zoomBy(canvas(), 1 / step, center())"
      >
        <ng-icon name="lucideMinus" size="14" />
      </button>
      <button
        type="button"
        class="studio-ui hover:bg-accent/60 min-w-12 rounded-[7px] px-1.5 py-1 tabular-nums transition-colors"
        title="Volver al 100%"
        data-testid="canvas-zoom-level"
        (click)="viewport.resetZoom(canvas())"
      >
        {{ percent() }}
      </button>
      <button
        type="button"
        class="hover:bg-accent/60 flex size-7 items-center justify-center rounded-[7px] transition-colors"
        title="Acercar"
        data-testid="canvas-zoom-in"
        (click)="viewport.zoomBy(canvas(), step, center())"
      >
        <ng-icon name="lucidePlus" size="14" />
      </button>
      <span class="bg-border mx-0.5 h-4 w-px"></span>
      <button
        type="button"
        class="hover:bg-accent/60 flex size-7 items-center justify-center rounded-[7px] transition-colors"
        title="Ajustar al contenido"
        data-testid="canvas-fit"
        (click)="fit.emit()"
      >
        <ng-icon name="lucideMaximize" size="13" />
      </button>
    </div>
  `
})
export class CanvasControlsComponent {
  protected readonly viewport = inject(CanvasViewportService)

  private readonly studioMode = inject(StudioModeService)

  /** El lienzo es el modo: estos controles solo salen sobre un diagrama. */
  protected readonly canvas = computed<CanvasId>(() => (this.studioMode.mode() === 'flows' ? 'flows' : 'model'))

  /** Encajar necesita medir el lienzo, y eso lo sabe quien lo pinta. */
  readonly fit = output<void>()

  protected readonly step = 1.25

  /** Los botones amplían por el centro del área visible; la rueda, por el cursor. */
  protected readonly center = computed(() => ({ x: 0, y: 0 }))

  protected readonly percent = computed(() => `${Math.round(this.viewport.of(this.canvas())().zoom * 100)}%`)
}
