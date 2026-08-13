import { ChangeDetectionStrategy, Component, EventEmitter, Output, computed, inject, signal } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { firstValueFrom } from 'rxjs'
import { DesignStore } from '../design/design-store'
import { PreviewSettings } from '../design/preview-settings'
import { AddonCardsComponent, ChoiceCardsComponent } from './generate-cards.component'
import { mergeCatalog } from './generate-catalog'
import { defaultSelection, designSummary, isDisabled, type SlotsManifest } from './wizard-command'

type Step = 'infra' | 'generate'

/**
 * «Antes de generar» (spec 41, maqueta 9A): la última pantalla del estudio, a pantalla
 * completa y a dos columnas — las decisiones a la izquierda, lo que vas a obtener a la
 * derecha. Sustituye al modal de 32 rem con radios nativos.
 *
 * No es una ruta: el estudio no tiene router (la navegación de primer nivel es `mode()` en
 * `studio-canvas.component`), así que es una capa sobre el lienzo que se cierra con `close`.
 *
 * Salida con decorador y no con `output()` por la misma razón que las tarjetas: el runner de
 * tests compila en JIT y ahí las señales de entrada/salida no se registran.
 */
@Component({
  selector: 'studio-generate-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ChoiceCardsComponent, AddonCardsComponent],
  host: { '(document:keydown.escape)': 'close.emit()' },
  template: `
    <div class="bg-background fixed inset-0 z-50 flex flex-col" data-testid="wizard-dialog">
      <header class="bg-card studio-chrome flex items-center gap-3 border-b px-4 py-2">
        <svg class="size-7 shrink-0" viewBox="0 0 32 32" role="img" aria-label="Raptor Studio">
          <rect width="32" height="32" rx="9" fill="#1b1917" />
          <text
            x="16"
            y="17"
            text-anchor="middle"
            dominant-baseline="central"
            font-family="Helvetica Neue, Helvetica, Arial, sans-serif"
            font-size="17"
            font-weight="700"
            fill="#f8f5f1"
          >
            R
          </text>
        </svg>
        <span class="studio-ui font-semibold">{{ store.appName() }}</span>
        <span class="text-muted-foreground studio-ui">/</span>
        <span class="text-muted-foreground studio-ui">Antes de generar</span>

        <span class="flex-1"></span>
        <nav class="flex items-center gap-2" aria-label="Pasos">
          @for (item of steps(); track item.id) {
            <button
              type="button"
              class="wizard-step studio-ui flex items-center gap-1.5"
              [attr.data-state]="item.state"
              [attr.data-testid]="'wizard-step-' + item.id"
              (click)="goTo(item.id)"
            >
              <span class="wizard-pip">{{ item.state === 'done' ? '✓' : item.ordinal }}</span>
              {{ item.label }}
            </button>
            @if (!$last) {
              <span class="bg-border h-px w-6"></span>
            }
          }
        </nav>
        <span class="flex-1"></span>

        <button type="button" class="toolbar-item studio-ui" data-testid="generate-back" (click)="close.emit()">
          Volver al lienzo
        </button>
      </header>

      <div class="flex min-h-0 flex-1">
        <main class="min-h-0 flex-1 overflow-auto px-10 py-8">
          @if (step() === 'infra') {
            <div class="mx-auto max-w-3xl" data-testid="generate-step-infra">
              @if (catalog(); as catalog) {
                @for (group of catalog.groups; track group.slot) {
                  <studio-choice-cards
                    [group]="group"
                    [chosen]="selection()[group.slot] ?? ''"
                    (choose)="choose(group.slot, $event)"
                  />
                }
                <section class="mb-6">
                  <h2 class="text-foreground mb-0.5 text-[15px] font-semibold">Complementos</h2>
                  <p class="text-muted-foreground studio-ui mb-3">Lo que la aplicación necesita alrededor.</p>
                  <studio-addon-cards [cards]="catalog.addons" [active]="plugins()" (toggle)="togglePlugin($event)" />
                </section>
              } @else {
                <p class="text-muted-foreground studio-ui" data-testid="wizard-slots-error">
                  {{ manifestError() ?? 'Cargando opciones del generador…' }}
                </p>
              }
            </div>
          } @else {
            <div class="mx-auto max-w-3xl" data-testid="generate-step-generate"></div>
          }
        </main>

        <aside class="studio-rail w-80 shrink-0 overflow-auto border-l px-5 py-8">
          <p class="studio-eyebrow mb-2">Tu aplicación</p>
          <p class="studio-ui text-foreground mb-6" data-testid="generate-summary">
            {{ summaryLine() }}
          </p>

          <p class="studio-eyebrow mb-2">La pila</p>
          <div class="mb-8" data-testid="generate-stack">
            @for (row of stack(); track row.label) {
              <div class="studio-ui flex items-baseline justify-between gap-3 border-b py-1.5 last:border-b-0">
                <span class="text-muted-foreground shrink-0">{{ row.label }}</span>
                <span class="text-foreground text-right font-medium">{{ row.value }}</span>
              </div>
            }
          </div>

          <button
            type="button"
            class="studio-cta bg-primary text-primary-foreground w-full disabled:opacity-40"
            [disabled]="!catalog()"
            data-testid="generate-primary"
            (click)="step.set('generate')"
          >
            Continuar
          </button>
        </aside>
      </div>
    </div>
  `,
  styles: `
    .wizard-step[data-state='pending'] {
      color: var(--muted-foreground);
    }
    .wizard-step[data-state='current'] {
      font-weight: 600;
    }
    .wizard-pip {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      border: 1px solid var(--border);
      font-size: 10px;
    }
    .wizard-step[data-state='done'] .wizard-pip {
      background-color: var(--foreground);
      border-color: var(--foreground);
      color: var(--background);
    }
    .wizard-step[data-state='current'] .wizard-pip {
      background-color: #f15539;
      border-color: #f15539;
      color: #fff;
    }
  `
})
export class GeneratePageComponent {
  protected readonly store = inject(DesignStore)
  private readonly http = inject(HttpClient)
  private readonly preview = inject(PreviewSettings)

  /** Cerrar la capa es cosa del lienzo, que es quien la abrió. */
  @Output() readonly close = new EventEmitter<void>()

  protected readonly step = signal<Step>('infra')
  protected readonly manifest = signal<SlotsManifest | null>(null)
  protected readonly manifestError = signal<string | null>(null)
  protected readonly selection = signal<Record<string, string>>({})
  protected readonly plugins = signal<string[]>([])

  /** Las tarjetas: lo que el manifiesto publica, vestido por el catálogo. */
  protected readonly catalog = computed(() => {
    const manifest = this.manifest()
    return manifest ? mergeCatalog(manifest, this.selection()) : null
  })

  protected readonly steps = computed(() => [
    { id: 'views' as const, ordinal: 1, label: 'Vistas', state: 'done' },
    { id: 'infra' as const, ordinal: 2, label: 'Infraestructura', state: this.stateOf('infra') },
    { id: 'generate' as const, ordinal: 3, label: 'Generar', state: this.stateOf('generate') }
  ])

  /** «1 vista · 1 bloque · 1 entidad · preset Cabina» */
  protected readonly summaryLine = computed(() => {
    const counted = designSummary(this.store.pages(), this.store.resources())
    return [
      plural(counted.views, 'vista', 'vistas'),
      plural(counted.blocks, 'bloque', 'bloques'),
      plural(counted.resources, 'entidad', 'entidades'),
      `preset ${this.presetLabel()}`
    ].join(' · ')
  })

  /** Lo elegido, en filas etiqueta→valor: es el recibo de las decisiones de la izquierda. */
  protected readonly stack = computed(() => {
    const catalog = this.catalog()
    if (!catalog) {
      return []
    }
    const active = catalog.addons.filter(addon => this.plugins().includes(addon.value))
    return [
      ...catalog.groups.map(group => ({
        label: group.label,
        value: group.cards.find(card => card.value === this.selection()[group.slot])?.title ?? '—'
      })),
      { label: 'Complementos', value: active.length ? active.map(addon => addon.title).join(', ') : 'Ninguno' }
    ]
  })

  constructor() {
    void this.loadManifest()
  }

  /** Sin manifiesto no hay formulario: el estudio no se inventa las opciones del generador. */
  private async loadManifest(): Promise<void> {
    try {
      const manifest = await firstValueFrom(this.http.get<SlotsManifest>('/api/v1/studio/generate/slots'))
      this.manifest.set(manifest)
      // el preset elegido en el lienzo manda: lo que se ve dibujado es lo que se genera
      this.selection.set({ ...defaultSelection(manifest), design: this.preview.preset() })
    } catch {
      this.manifestError.set(
        'No se pudieron cargar las opciones del generador. Arranca el backend local: npm run studio:api'
      )
    }
  }

  protected choose(slot: string, provider: string): void {
    this.selection.update(current => ({ ...current, [slot]: provider }))
    // cambiar de ranura puede invalidar lo elegido en otra (mongo deja fuera auth single-tenant)
    const manifest = this.manifest()
    if (!manifest) {
      return
    }
    for (const candidate of manifest.slots) {
      const chosen = candidate.providers.find(p => p.value === this.selection()[candidate.name])
      if (chosen && isDisabled(chosen, this.selection())) {
        this.selection.update(current => ({ ...current, [candidate.name]: candidate.default }))
      }
    }
  }

  protected togglePlugin(plugin: string): void {
    this.plugins.update(list => (list.includes(plugin) ? list.filter(p => p !== plugin) : [...list, plugin]))
  }

  /** El primer paso no es un paso de esta pantalla: es el lienzo, y volver es cerrarla. */
  protected goTo(step: 'views' | Step): void {
    if (step === 'views') {
      this.close.emit()
      return
    }
    this.step.set(step)
  }

  private stateOf(step: Step): string {
    if (this.step() === step) {
      return 'current'
    }
    return step === 'infra' ? 'done' : 'pending'
  }

  /** El preset se decide en el lienzo; aquí solo se enseña, con el nombre que le da el manifiesto. */
  private presetLabel(): string {
    const chosen = this.preview.preset()
    const slot = this.manifest()?.slots.find(candidate => candidate.name === 'design')
    const label = slot?.providers.find(candidate => candidate.value === chosen)?.label ?? chosen
    return label.split(' (')[0]
  }
}

function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`
}
