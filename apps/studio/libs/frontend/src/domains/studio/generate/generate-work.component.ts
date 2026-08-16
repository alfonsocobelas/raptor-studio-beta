import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core'
import { GenerateRunner } from './generate-runner'
import { elapsedOf, overallProgress, type PhaseState } from './generate-phases'

/**
 * La obra en marcha (spec 42, maqueta 7C): las fases con su estado y su tiempo, el registro
 * técnico plegado, y en el raíl lo que se está escribiendo del diseño.
 *
 * Toda cifra sale del runner, que a su vez la sacó de la salida del generador o del reloj. Lo
 * que la maqueta pinta y no existe —los segundos restantes, publicar en un dominio, invitar al
 * equipo, avisar por correo— no está aquí ni insinuado. La barra sí estima dentro de la fase
 * en curso (`overallProgress`), pero contra tiempos MEDIDOS y sin llegar nunca al final sola.
 *
 * Se inyecta el runner en vez de recibir entradas: el estado es de la generación, no de este
 * componente, y así la pantalla se puede cerrar y reabrir sin perder nada.
 */
@Component({
  selector: 'studio-generate-work',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="min-h-0 flex-1 overflow-auto px-10 py-8">
      <div class="mx-auto max-w-3xl" data-testid="generate-step-generate">
        <h1 class="text-foreground mb-4 text-2xl font-semibold">{{ title() }}</h1>

        <div class="mb-6 flex items-center gap-4">
          <div
            class="bg-muted h-1.5 flex-1 overflow-hidden rounded-full"
            role="progressbar"
            [attr.aria-valuenow]="settled()"
            [attr.aria-valuemin]="0"
            [attr.aria-valuemax]="phases().length"
            data-testid="work-progress"
          >
            <div
              class="h-full rounded-full bg-emerald-500 transition-all duration-500"
              [style.width.%]="progress() * 100"
            ></div>
          </div>
          <span class="studio-ui text-muted-foreground shrink-0">
            {{ settled() }} de {{ phases().length }} fases
          </span>
        </div>

        <div class="mb-6 space-y-2">
          @for (phase of phases(); track phase.key) {
            <div
              class="phase-row flex items-center gap-3 rounded-lg border px-4 py-3"
              [attr.data-state]="phase.status"
              [attr.data-testid]="'phase-' + phase.key"
            >
              <span class="phase-pip" aria-hidden="true">{{ pip(phase) }}</span>
              <span class="min-w-0 flex-1">
                <span class="text-foreground block text-[13px] font-semibold">
                  {{ phase.label }}
                  @if (phase.status === 'skipped') {
                    <span class="text-muted-foreground font-normal">· omitida</span>
                  }
                </span>
                <span class="text-muted-foreground block text-[11.5px]">{{ detail(phase) }}</span>
              </span>
              @if (elapsed(phase); as ms) {
                <span class="text-muted-foreground shrink-0 font-mono text-[11.5px]">
                  {{ (ms / 1000).toFixed(0) }} s
                </span>
              }
            </div>
          }
        </div>

        <!-- el artefacto (comando y descarga) lo proyecta la pantalla: depende del manifiesto -->
        <ng-content />

        @if (runner.output(); as log) {
          <details class="studio-box" [open]="runner.outcome() === 'failed'" data-testid="work-log">
            <summary class="studio-eyebrow cursor-pointer">Registro técnico</summary>
            <pre class="mt-3 max-h-64 overflow-auto whitespace-pre-wrap font-mono text-[11px]">{{ log }}</pre>
          </details>
        }
      </div>
    </main>

    <aside class="studio-rail studio-rail-end w-80 shrink-0 overflow-auto border-l px-5 py-8" data-testid="work-meanwhile">
      <p class="studio-eyebrow mb-3">Mientras tanto</p>
      <p class="text-muted-foreground studio-ui mb-4">Esto es lo que se está escribiendo.</p>

      @for (item of runner.written(); track item.label) {
        <div
          class="studio-ui flex items-center gap-2 py-1"
          [attr.data-state]="item.done ? 'done' : 'pending'"
          [attr.data-testid]="'written-' + item.label"
        >
          <span class="written-pip" aria-hidden="true">{{ item.done ? '✓' : '·' }}</span>
          <span class="min-w-0 flex-1 truncate" [class.text-muted-foreground]="!item.done">{{ item.label }}</span>
          <span class="studio-eyebrow shrink-0">{{ kindLabel(item.kind) }}</span>
        </div>
      }
    </aside>
  `,
  styles: `
    /* La obra son DOS columnas del mismo flex que la pantalla: sin esto, el host las
       encerraría en una caja y el raíl dejaría de ser raíl. */
    :host {
      display: contents;
    }
    .phase-row[data-state='pending'],
    .phase-row[data-state='skipped'] {
      opacity: 0.5;
    }
    .phase-row[data-state='running'] {
      border-color: #c86647;
    }
    .phase-row[data-state='failed'] {
      border-color: var(--destructive);
    }
    .phase-pip {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      border: 1px solid var(--border);
      font-size: 11px;
    }
    .phase-row[data-state='done'] .phase-pip {
      background-color: var(--color-emerald-500, #10b981);
      border-color: transparent;
      color: #fff;
    }
    .phase-row[data-state='running'] .phase-pip {
      border-color: #c86647;
      color: #c86647;
    }
    .written-pip {
      width: 12px;
      text-align: center;
      color: var(--muted-foreground);
    }
    [data-state='done'] .written-pip {
      color: var(--color-emerald-500, #10b981);
    }
  `
})
export class GenerateWorkComponent {
  protected readonly runner = inject(GenerateRunner)
  protected readonly phases = this.runner.phases

  /**
   * Lo que ya no va a cambiar: cumplidas, omitidas y fallidas. Es lo que se dice en letra
   * («2 de 3 fases»), porque un número redondo no debe fingir precisión.
   */
  protected readonly settled = computed(
    () => this.phases().filter(p => p.status === 'done' || p.status === 'skipped' || p.status === 'failed').length
  )

  /**
   * El latido de la pantalla. Sin él, los cronómetros de la fase en curso serían números
   * congelados: la señal de fases solo cambia cuando el generador dice algo, y durante la
   * instalación se calla dos minutos enteros.
   */
  private readonly clock = signal(Date.now())

  constructor() {
    const tick = setInterval(() => this.clock.set(Date.now()), 1000)
    inject(DestroyRef).onDestroy(() => clearInterval(tick))
  }

  /** La barra: fases cerradas más la parte andada de la que está en curso. */
  protected readonly progress = computed(() => overallProgress(this.phases(), this.clock()))

  /** Los segundos de una fila: corriendo si está en curso, congelados en cuanto cierra. */
  protected elapsed(phase: PhaseState): number | undefined {
    return elapsedOf(phase, this.clock())
  }

  protected readonly title = computed(() => {
    if (this.runner.generating()) {
      return 'Construyendo tu aplicación'
    }
    return this.runner.outcome() === 'ok' ? 'Tu aplicación está lista' : 'La generación se detuvo'
  })

  protected pip(phase: PhaseState): string {
    if (phase.status === 'done') return '✓'
    if (phase.status === 'failed') return '✕'
    if (phase.status === 'running') return '◐'
    return '·'
  }

  /** El detalle de la fila: lo que el generador contó, o para qué sirve la fase. */
  protected detail(phase: PhaseState): string {
    if (phase.packages !== undefined) {
      return `${phase.packages} paquetes`
    }
    if (phase.files !== undefined && phase.key === 'write') {
      return `${phase.files} ficheros`
    }
    return phase.hint
  }

  protected kindLabel(kind: 'entity' | 'view' | 'module'): string {
    return kind === 'entity' ? 'entidad' : kind === 'view' ? 'vista' : 'módulo'
  }
}
