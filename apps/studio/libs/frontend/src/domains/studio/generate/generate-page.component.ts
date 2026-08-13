import { ChangeDetectionStrategy, Component, EventEmitter, Output, computed, inject, signal } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { firstValueFrom } from 'rxjs'
import { downloadBlob } from '../../../shared/utils/download-file'
import { DesignStore } from '../design/design-store'
import { PreviewSettings } from '../design/preview-settings'
import { AddonCardsComponent, ChoiceCardsComponent } from './generate-cards.component'
import { mergeCatalog } from './generate-catalog'
import { GenerateRunner } from './generate-runner'
import {
  buildCommand,
  buildDesignRequest,
  defaultSelection,
  designSummary,
  isDisabled,
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
                <div data-testid="wizard-slots">
                  @for (group of catalog.groups; track group.slot) {
                    <studio-choice-cards
                      [group]="group"
                      [chosen]="selection()[group.slot]"
                      (choose)="choose(group.slot, $event)"
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
          } @else {
            <div class="mx-auto max-w-3xl" data-testid="generate-step-generate">
              <h2 class="text-foreground mb-0.5 text-[15px] font-semibold">¿Cómo se va a llamar?</h2>
              <p class="text-muted-foreground studio-ui mb-3">
                Es el nombre de la carpeta y del proyecto Nx. En kebab-case.
              </p>
              <input
                class="border-input bg-card mb-1 w-full rounded-md border px-3 py-2 text-sm"
                [value]="name()"
                (input)="name.set($any($event.target).value)"
                placeholder="mi-cliente"
                data-testid="wizard-name"
              />
              @if (!validName()) {
                <p class="text-destructive studio-ui mb-3" data-testid="wizard-name-problem">
                  Solo minúsculas, números y guiones: kebab-case, como <code>taller-sur</code>.
                </p>
              }

              @if (command(); as cmd) {
                <div class="studio-box mb-4 mt-5">
                  <p class="studio-eyebrow mb-2">El mismo resultado, desde la terminal</p>
                  <code class="block break-all font-mono text-[11.5px]" data-testid="wizard-command">{{ cmd }}</code>
                  <div class="mt-3 flex gap-2">
                    <button
                      type="button"
                      class="studio-cta border-input border"
                      data-testid="wizard-copy"
                      (click)="copyCommand()"
                    >
                      {{ copied() ? 'Copiado ✓' : 'Copiar comando' }}
                    </button>
                    <button
                      type="button"
                      class="studio-cta border-input border disabled:opacity-40"
                      [disabled]="!validName()"
                      data-testid="wizard-download"
                      (click)="download()"
                    >
                      Descargar el diseño
                    </button>
                  </div>
                </div>
              }

              <details class="mb-4">
                <summary class="text-muted-foreground studio-ui cursor-pointer">Avanzado</summary>
                <div class="mt-3 space-y-2">
                  <label class="studio-ui flex items-center gap-2">
                    <input
                      type="checkbox"
                      [checked]="install()"
                      (change)="install.set($any($event.target).checked)"
                      data-testid="wizard-install"
                    />
                    Instalar dependencias al generar (npm install + Spartan)
                  </label>
                  <input
                    class="border-input bg-card w-full rounded-md border px-3 py-2 text-sm"
                    [value]="directory()"
                    (input)="directory.set($any($event.target).value)"
                    placeholder="Directorio destino (por defecto apps/<nombre>)"
                    data-testid="wizard-directory"
                  />
                </div>
              </details>

              @if (runner.generating()) {
                <div class="studio-box text-center" data-testid="generate-progress">
                  <div class="mb-3 flex items-center justify-center gap-3">
                    <span
                      class="border-primary inline-block h-6 w-6 animate-spin rounded-full border-2 border-t-transparent"
                    ></span>
                    <span class="text-sm font-medium">{{ runner.step() ?? 'Generando…' }}</span>
                  </div>
                  <p class="text-muted-foreground studio-ui">
                    {{ runner.filesWritten() }} ficheros escritos · {{ runner.seconds() }} s
                  </p>
                  @if (runner.lastFile(); as file) {
                    <p class="text-muted-foreground mt-1 truncate font-mono text-[11px]">{{ file }}</p>
                  }
                  <p class="text-muted-foreground studio-ui mt-3">
                    Instalar dependencias es lo que más tarda (un minuto y medio); el código se escribe en segundos.
                  </p>
                </div>
              }
              @if (runner.elapsed(); as ms) {
                <p class="text-muted-foreground studio-ui mt-3" data-testid="generate-elapsed">
                  Generado en {{ (ms / 1000).toFixed(1) }} s
                </p>
              }
              @if (runner.output(); as out) {
                <pre
                  class="bg-muted mt-3 max-h-64 overflow-auto rounded-md p-3 text-xs"
                  [attr.data-testid]="runner.ok() ? 'generate-ok' : 'generate-error'"
                  >{{ out }}</pre
                >
              }
            </div>
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
            [disabled]="!canAdvance()"
            data-testid="generate-primary"
            (click)="advance()"
          >
            {{ step() === 'infra' ? 'Continuar' : runner.generating() ? 'Generando…' : 'Generar aplicación' }}
          </button>
          @if (step() === 'generate') {
            <p class="text-muted-foreground studio-ui mt-3 text-center">Se escribe en tu workspace, en local.</p>
          }
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

  protected readonly runner = inject(GenerateRunner)

  protected readonly step = signal<Step>('infra')
  protected readonly manifest = signal<SlotsManifest | null>(null)
  protected readonly manifestError = signal<string | null>(null)
  protected readonly selection = signal<Record<string, string>>({})
  protected readonly plugins = signal<string[]>([])
  /** El diseño ya tiene nombre: el asistente no lo pide en blanco como el modal viejo. */
  protected readonly name = signal(this.store.appName())
  protected readonly install = signal(true)
  protected readonly directory = signal('')
  protected readonly copied = signal(false)

  protected readonly validName = computed(() => KEBAB.test(this.name()))
  protected readonly canAdvance = computed(() =>
    this.step() === 'infra' ? this.catalog() !== null : this.validName() && !this.runner.generating()
  )
  protected readonly command = computed(() => {
    const manifest = this.manifest()
    return manifest && this.validName()
      ? buildCommand(manifest, { name: this.name(), slots: this.selection(), plugins: this.plugins() })
      : null
  })

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

  /** El botón del raíl: primero avanza de paso, luego genera. */
  protected advance(): void {
    if (this.step() === 'infra') {
      this.step.set('generate')
      return
    }
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
        flows: this.store.flows()
      }),
      skipInstall: !this.install(),
      ...(this.directory().trim() ? { directory: this.directory().trim() } : {})
    })
  }

  /** El artefacto de `--appFile`: el schema vivo con el nombre elegido. */
  protected download(): void {
    const design = {
      ...(JSON.parse(this.store.exportJson()) as Record<string, unknown>),
      name: this.name()
    }
    downloadBlob(new Blob([JSON.stringify(design, null, 2)], { type: 'application/json' }), `${this.name()}.app.json`)
  }

  protected async copyCommand(): Promise<void> {
    const command = this.command()
    if (!command) {
      return
    }
    await navigator.clipboard.writeText(command)
    this.copied.set(true)
    setTimeout(() => this.copied.set(false), 1500)
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
