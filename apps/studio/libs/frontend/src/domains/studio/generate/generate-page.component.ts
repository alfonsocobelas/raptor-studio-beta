import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  EventEmitter,
  Output,
  computed,
  inject,
  signal
} from '@angular/core'
import { HttpClient } from '@angular/common/http'
import type { PortsDefinition } from '@raptor/schema'
import { firstValueFrom } from 'rxjs'
import { DesignStore } from '../design/design-store'
import { PreviewSettings } from '../design/preview-settings'
import { productMark } from '../design/product-mark'
import { AddonCardsComponent, ChoiceCardsComponent } from './generate-cards.component'
import { mergeCatalog } from './generate-catalog'
import { GenerateRunner } from './generate-runner'
import { GenerateWorkComponent } from './generate-work.component'
import {
  buildDesignRequest,
  defaultSelection,
  designSummary,
  isDisabled,
  spelled,
  type SlotsManifest
} from './wizard-command'

type Step = 'infra' | 'generate'

const KEBAB = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/

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
  imports: [ChoiceCardsComponent, AddonCardsComponent, GenerateWorkComponent],
  host: { '(document:keydown.escape)': 'close.emit()' },
  template: `
    <div class="bg-background fixed inset-0 z-50 flex flex-col" data-testid="wizard-dialog">
      <header class="bg-card studio-chrome flex items-center gap-3 border-b px-4 py-2">
        <svg class="size-7 shrink-0" viewBox="0 0 32 32" role="img" aria-label="Raptor Studio">
          <rect width="32" height="32" rx="9" [attr.fill]="mark().background" data-testid="generate-mark-plate" />
          <text
            x="16"
            y="17"
            text-anchor="middle"
            dominant-baseline="central"
            font-family="Helvetica Neue, Helvetica, Arial, sans-serif"
            font-size="17"
            font-weight="700"
            [attr.fill]="mark().letter"
            data-testid="generate-mark-letter"
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
              <span
                class="wizard-pip"
                [class.bg-emerald-500]="item.state === 'done'"
                [class.border-emerald-500]="item.state === 'done'"
                [attr.data-testid]="'wizard-pip-' + item.id"
                >{{ item.state === 'done' ? '✓' : item.ordinal }}</span
              >
              {{ item.label }}
            </button>
            @if (!$last) {
              <!-- el tramo se pinta cuando lo que hay AL OTRO LADO ya está cumplido. Con cuerpo
                   (2px y redondeado): a 1px el verde no se veía. -->
              <span
                class="h-0.5 w-9 rounded-full"
                [class.bg-emerald-500]="steps()[$index + 1].state === 'done'"
                [class.bg-border]="steps()[$index + 1].state !== 'done'"
                [attr.data-testid]="'wizard-line-' + item.id"
              ></span>
            }
          }
        </nav>
        <span class="flex-1"></span>

        <button
          type="button"
          class="toolbar-item"
          [attr.title]="'Tema del estudio: ' + preview.studioTheme()"
          data-testid="generate-theme"
          (click)="preview.toggleStudioTheme()"
        >
          {{ preview.studioTheme() === 'light' ? '◐' : '◑' }}
        </button>
        @if (runner.generating()) {
          <span class="studio-eyebrow" data-testid="work-clock">Generando · {{ clock() }}</span>
          <button type="button" class="toolbar-item studio-ui" data-testid="work-cancel" (click)="runner.cancel()">
            Cancelar
          </button>
          <button type="button" class="toolbar-item studio-ui" data-testid="work-background" (click)="close.emit()">
            Seguir en segundo plano
          </button>
        } @else {
          <button type="button" class="toolbar-item studio-ui" data-testid="generate-back" (click)="close.emit()">
            Volver al lienzo
          </button>
        }
      </header>

      <div class="flex min-h-0 flex-1">
        @if (step() === 'infra') {
          <main class="min-h-0 flex-1 overflow-auto px-10 py-8">
            <div class="mx-auto max-w-3xl" data-testid="generate-step-infra">
              @if (catalog(); as catalog) {
                <div data-testid="wizard-slots">
                  @for (group of catalog.groups; track group.slot) {
                    <studio-choice-cards
                      [group]="group"
                      [chosen]="selection()[group.slot]"
                      [toggled]="provisionedInfra()"
                      (choose)="choose(group.slot, $event)"
                      (toggledChange)="provisionedInfra.set($event)"
                    />
                  }
                </div>
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
          </main>
          <aside class="studio-rail studio-rail-end w-80 shrink-0 overflow-auto border-l px-5 py-8">
            <!-- el nombre vive con el recibo de lo que vas a generar, no en una pantalla aparte -->
            <p class="studio-eyebrow mb-2">Cómo se va a llamar</p>
            <input
              class="border-input bg-card studio-ui mb-1 w-full rounded-md border px-2.5 py-1.5"
              [value]="name()"
              (input)="name.set($any($event.target).value)"
              placeholder="mi-cliente"
              data-testid="wizard-name"
            />
            @if (!validName()) {
              <p class="text-destructive studio-ui mb-4" data-testid="wizard-name-problem">
                Solo minúsculas, números y guiones: kebab-case, como <code>taller-sur</code>.
              </p>
            } @else {
              <p class="text-muted-foreground studio-ui mb-6">La carpeta y el proyecto Nx se llamarán así.</p>
            }

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

            <details class="mb-4">
              <summary class="text-muted-foreground studio-ui cursor-pointer">Avanzado</summary>
              <div class="mt-3 space-y-2">
                <label class="studio-ui flex items-start gap-2">
                  <input
                    type="checkbox"
                    class="mt-0.5"
                    [checked]="install()"
                    (change)="install.set($any($event.target).checked)"
                    data-testid="wizard-install"
                  />
                  Instalar dependencias al generar
                </label>
                <input
                  class="border-input bg-card studio-ui w-full rounded-md border px-2.5 py-1.5"
                  [value]="directory()"
                  (input)="directory.set($any($event.target).value)"
                  placeholder="Directorio destino"
                  data-testid="wizard-directory"
                />

                <!-- puertos: el generador no puede sondear la máquina, así que se declaran aquí -->
                <p class="studio-eyebrow mt-4 mb-1">Puertos en local</p>
                <p class="text-muted-foreground studio-ui mb-2">
                  Vacío = el de siempre. Cámbialos si ya tienes otra aplicación corriendo.
                </p>
                @for (port of portFields; track port.key) {
                  <label class="studio-ui flex items-center justify-between gap-3">
                    <span class="text-muted-foreground">{{ port.label }}</span>
                    <input
                      type="number"
                      class="border-input bg-card studio-ui w-24 rounded-md border px-2.5 py-1.5 text-right"
                      [value]="portValue(port.key)"
                      (input)="setPort(port.key, $any($event.target).value)"
                      [placeholder]="port.fallback"
                      [attr.data-testid]="'wizard-port-' + port.key"
                    />
                  </label>
                }
              </div>
            </details>

            <button
              type="button"
              class="studio-cta bg-primary text-primary-foreground w-full disabled:opacity-40"
              [disabled]="!canGenerate()"
              data-testid="generate-primary"
              (click)="generate()"
            >
              Generar aplicación
            </button>
            <p class="text-muted-foreground studio-ui mt-3 text-center">Se escribe en tu workspace, en local.</p>
          </aside>
        } @else {
          <studio-generate-work>
            <!-- el desenlace: la obra acaba y AQUÍ mismo está la ruta, cómo arrancarla o por qué paró -->
            @if (runner.outcome(); as outcome) {
              <div class="studio-box outcome mb-4" [attr.data-state]="outcome" data-testid="generate-outcome">
                @if (outcome === 'ok') {
                  <p class="text-foreground mb-1 text-[15px] font-semibold">
                    Tu aplicación está en <code class="font-mono">{{ runner.root() }}</code>
                  </p>
                  <p class="text-muted-foreground studio-ui mb-4">{{ receipt() }}</p>
                  <p class="studio-eyebrow mb-2">Para verla funcionar</p>
                  <pre
                    class="bg-muted overflow-auto rounded-md p-3 font-mono text-[11.5px]"
                    data-testid="generate-run-hint"
                  >
cd {{ runner.root() }}
make local-setup   # postgres + npm install + seed
make api           # http://localhost:3000/api/v1
make web           # http://localhost:4200</pre
                  >
                  @if (runner.slotStates().length) {
                    <!-- los pasos de negocio que quedaron como huecos (spec 45): el puente los rellena bajo gate -->
                    <div class="mt-4 border-t pt-4" data-testid="fill-slots-section">
                      <p class="studio-eyebrow mb-1">Pasos de negocio por rellenar</p>
                      <p class="text-muted-foreground studio-ui mb-3">
                        La IA los rellena por el puente (hace falta una sesión respondiendo
                        <code class="font-mono">tmp/studio-bridge</code>) y cada uno pasa su gate: si algo falla, el
                        hueco queda vacío y la app intacta.
                      </p>
                      @for (slot of runner.slotStates(); track slot.id) {
                        <div
                          class="studio-ui flex items-center gap-2 py-1"
                          [attr.data-status]="slot.status"
                          [attr.data-testid]="'slot-' + slot.id"
                        >
                          <span aria-hidden="true">{{ slotPip(slot.status) }}</span>
                          <span class="min-w-0 flex-1 truncate font-mono text-[11.5px]">{{ slot.id }}</span>
                          <span class="text-muted-foreground shrink-0">{{ slotLabel(slot.status) }}</span>
                        </div>
                        @if (slot.reason) {
                          <p class="text-muted-foreground ml-6 text-xs">{{ slot.reason }}</p>
                        }
                      }
                      <button
                        type="button"
                        class="studio-cta border-input mt-3 border disabled:opacity-50"
                        [disabled]="runner.fillingSlots()"
                        data-testid="fill-slots-run"
                        (click)="runner.fillSlots()"
                      >
                        {{ runner.fillingSlots() ? 'Rellenando…' : 'Rellenar con IA (puente)' }}
                      </button>
                    </div>
                  }
                } @else {
                  <p class="text-foreground mb-1 text-[15px] font-semibold">
                    {{ outcome === 'cancelled' ? 'Cancelada' : 'La generación falló' }}
                  </p>
                  <p class="text-muted-foreground studio-ui mb-3">
                    {{
                      outcome === 'cancelled'
                        ? 'El generador se paró y el código a medias se borró. No queda nada a medias.'
                        : 'El registro técnico de abajo cuenta el motivo. Puedes ajustar las decisiones y volver a intentarlo.'
                    }}
                  </p>
                  <button
                    type="button"
                    class="studio-cta border-input border"
                    data-testid="outcome-back"
                    (click)="step.set('infra')"
                  >
                    Volver a las decisiones
                  </button>
                }
              </div>
            }
          </studio-generate-work>
        }
      </div>
    </div>
  `,
  styles: `
    /* En noche --primary es casi blanco y el botón se lee como APAGADO, justo el contrario
       de lo que es. Toma el naranja de la marca, como el CTA del lienzo y las tarjetas elegidas. */
    :host-context(.dark) [data-testid='generate-primary']:not(:disabled) {
      background-color: var(--brand);
      color: var(--brand-foreground);
    }
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
    /* El verde de lo cumplido llega por utilidad (bg-emerald-500, el mismo del indicador de
       guardado del lienzo); aquí solo la tinta que va encima. */
    .wizard-step[data-state='done'] .wizard-pip {
      color: #fff;
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
  protected readonly preview = inject(PreviewSettings)
  /** La marca no se hereda con el `.dark`: se invierte por cálculo, como en el lienzo. */
  protected readonly mark = computed(() => productMark(this.preview.studioTheme()))

  /** Cerrar la capa es cosa del lienzo, que es quien la abrió. */
  @Output() readonly close = new EventEmitter<void>()

  protected readonly runner = inject(GenerateRunner)

  /** Reabrir con la obra en marcha (o acabada) es volver a verla, no empezar decisiones. */
  private readonly resuming = this.runner.generating() || this.runner.outcome() !== null
  protected readonly step = signal<Step>(this.resuming ? 'generate' : 'infra')
  protected readonly manifest = signal<SlotsManifest | null>(null)
  protected readonly manifestError = signal<string | null>(null)
  protected readonly selection = signal<Record<string, string>>({})
  /** Checkbox de infra aprovisionada (spec 62); solo cuenta con una nube elegida. */
  protected readonly provisionedInfra = signal(false)
  protected readonly plugins = signal<string[]>(this.resuming ? (this.runner.requested()?.plugins ?? []) : [])
  /** El diseño ya tiene nombre; al reanudar manda lo GENERADO, para que el comando no mienta. */
  protected readonly name = signal(
    this.resuming ? (this.runner.requested()?.name ?? this.store.appName()) : this.store.appName()
  )
  protected readonly install = signal(true)
  protected readonly directory = signal('')

  protected readonly validName = computed(() => KEBAB.test(this.name()))
  /** «1 min 12 s» mientras dura: el mismo segundero que lleva el runner, en palabras. */
  protected readonly clock = computed(() => spelled(this.runner.seconds()))

  /** El recibo del desenlace bueno: «120 ficheros · 1 min 32 s», medidos, no estimados. */
  protected readonly receipt = computed(() => {
    const files = `${this.runner.filesWritten()} ficheros`
    const ms = this.runner.elapsed()
    return ms === null ? files : `${files} · ${spelled(Math.round(ms / 1000))}`
  })

  /** Sin manifiesto no se sabe qué generar; sin nombre válido no hay dónde escribirlo. */
  protected readonly canGenerate = computed(() => this.catalog() !== null && this.validName())

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
    // la pantalla se declara mirando la obra: mientras esté montada, el final no avisa fuera
    this.runner.attach()
    inject(DestroyRef).onDestroy(() => this.runner.detach())
  }

  /** Sin manifiesto no hay formulario: el estudio no se inventa las opciones del generador. */
  private async loadManifest(): Promise<void> {
    try {
      const manifest = await firstValueFrom(this.http.get<SlotsManifest>('/api/v1/studio/generate/slots'))
      this.manifest.set(manifest)
      // el preset elegido en el lienzo manda: lo que se ve dibujado es lo que se genera.
      // Al reanudar mandan las ranuras de lo generado: el comando debe reproducirlo.
      const requested = this.resuming ? this.runner.requested() : null
      this.selection.set({ ...defaultSelection(manifest), design: this.preview.preset(), ...(requested?.slots ?? {}) })
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

  /** Los cuatro puertos que la app emitida publica en local, con el defecto del generador. */
  protected readonly portFields = [
    { key: 'api' as const, label: 'API', fallback: '3000' },
    { key: 'web' as const, label: 'Web', fallback: '4200' },
    { key: 'postgres' as const, label: 'Postgres', fallback: '5433' },
    { key: 'postgresTest' as const, label: 'Postgres de test', fallback: '5434' }
  ]

  protected portValue(key: keyof PortsDefinition): string {
    return String(this.store.ports()?.[key] ?? '')
  }

  /**
   * Un puerto vacío (o no numérico) no viaja: se borra la clave, y si no queda ninguna se
   * quita `ports` del diseño entero para que el emitido vuelva a los defectos del generador.
   */
  protected setPort(key: keyof PortsDefinition, raw: string): void {
    const parsed = Number.parseInt(raw.trim(), 10)
    const { [key]: _previous, ...rest } = this.store.ports() ?? {}
    const next: PortsDefinition = Number.isFinite(parsed) ? { ...rest, [key]: parsed } : rest
    this.store.setPorts(Object.keys(next).length ? next : undefined)
  }

  /** El botón del raíl arranca la obra y lleva a verla: son el mismo gesto. */
  protected generate(): void {
    this.step.set('generate')
    void this.runner.run({
      name: this.name(),
      slots: this.selection(),
      plugins: this.plugins(),
      // lo que ves en el lienzo es lo que se genera (spec 18), y eso incluye la memoria del
      // negocio y los procesos: se arma en buildDesignRequest, no aquí
      design: buildDesignRequest({
        name: this.name(),
        resources: this.store.resources(),
        pages: this.store.pages(),
        palette: this.preview.palette(),
        brief: this.store.brief(),
        flows: this.store.flows(),
        ports: this.store.ports()
      }),
      skipInstall: !this.install(),
      // solo viaja con una nube del cliente: marcado y vuelto a raptor, no significa nada
      ...(this.provisionedInfra() && this.selection()['infra'] !== 'raptor' ? { provisionedInfra: true } : {}),
      ...(this.directory().trim() ? { directory: this.directory().trim() } : {})
    })
  }

  protected slotPip(status: string): string {
    return status === 'filled' ? '✓' : status === 'rejected' ? '✕' : status === 'proposing' ? '◐' : '·'
  }

  protected slotLabel(status: string): string {
    return status === 'filled'
      ? 'relleno y aceptado'
      : status === 'rejected'
        ? 'rechazado'
        : status === 'proposing'
          ? 'proponiendo…'
          : 'pendiente'
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
