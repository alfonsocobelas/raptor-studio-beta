import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { FormsModule } from '@angular/forms'
import { firstValueFrom } from 'rxjs'
import { downloadBlob } from '../../../shared/utils/download-file'
import { DesignStore } from '../design/design-store'
import { PreviewSettings } from '../design/preview-settings'
import { GenerateRunner } from './generate-runner'
import {
  buildCommand,
  buildDesignRequest,
  choosableSlots,
  defaultSelection,
  hasPublishableDesign,
  isDisabled,
  type ManifestProvider,
  type SlotsManifest
} from './wizard-command'

const KEBAB = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/

/**
 * Fase E: al terminar el diseño se eligen piel, motor y plugins (las opciones
 * REALES del generador) y se obtiene el artefacto: el app-schema como fichero
 * + el comando determinista de generación. El estudio no genera código.
 */
@Component({
  selector: 'studio-generate-wizard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  template: `
    <button
      type="button"
      class="bg-primary text-primary-foreground generate-cta rounded-md px-4 py-2 text-sm font-medium disabled:opacity-40"
      data-testid="open-wizard"
      [disabled]="!canPublish()"
      [title]="canPublish() ? 'Generar aplicación' : 'Diseña al menos una vista con un bloque antes de generar'"
      (click)="open.set(true)"
    >
      Generar aplicación
    </button>

    @if (open()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" data-testid="wizard-dialog">
        <div class="bg-background w-[32rem] max-w-[90vw] rounded-lg border p-6 shadow-lg">
          <h2 class="mb-4 text-lg font-semibold">Generar aplicación</h2>

          <label class="mb-1 block text-sm font-medium" for="wizard-name">Nombre (kebab-case)</label>
          <input
            id="wizard-name"
            class="border-input mb-3 w-full rounded-md border px-3 py-2 text-sm"
            name="name"
            [(ngModel)]="name"
            placeholder="mi-cliente"
            data-testid="wizard-name"
          />

          @if (manifest(); as slots) {
            <!-- una ranura = una decisión excluyente; las opciones las publica el generador -->
            <div class="mb-3 grid grid-cols-2 gap-4" data-testid="wizard-slots">
              @for (slot of choosable(); track slot.name) {
                <div>
                  <span class="mb-1 block text-sm font-medium">{{ slot.label }}</span>
                  @for (provider of slot.providers; track provider.value) {
                    <label
                      class="flex items-center gap-2 text-sm"
                      [class.opacity-40]="disabled(provider)"
                      [title]="disabled(provider) ? requirementOf(provider) : (provider.description ?? '')"
                    >
                      <input
                        type="radio"
                        [name]="slot.name"
                        [checked]="selection()[slot.name] === provider.value"
                        [disabled]="disabled(provider)"
                        (change)="choose(slot.name, provider.value)"
                        [attr.data-testid]="'slot-' + slot.name + '-' + provider.value"
                      />
                      {{ provider.label }}
                    </label>
                  }
                </div>
              }
            </div>

            @if (slots.plugins.length) {
              <span class="mb-1 block text-sm font-medium">Plugins</span>
              <div class="mb-4 flex gap-4">
                @for (plugin of slots.plugins; track plugin.name) {
                  <label class="flex items-center gap-2 text-sm" [title]="plugin.description">
                    <input
                      type="checkbox"
                      [checked]="plugins().includes(plugin.name)"
                      (change)="togglePlugin(plugin.name)"
                      [attr.data-testid]="'plugin-' + plugin.name"
                    />
                    {{ plugin.name }}
                  </label>
                }
              </div>
            }
          } @else {
            <p class="text-muted-foreground mb-4 text-sm" data-testid="wizard-slots-error">
              {{ manifestError() ?? 'Cargando opciones del generador…' }}
            </p>
          }

          <details class="mb-3">
            <summary class="text-muted-foreground cursor-pointer text-xs">Avanzado</summary>
            <div class="mt-2 space-y-2">
              <label class="flex items-center gap-2 text-sm">
                <input type="checkbox" [(ngModel)]="install" name="install" data-testid="wizard-install" />
                Instalar dependencias al generar (npm install + Spartan)
              </label>
              <input
                class="border-input w-full rounded-md border px-3 py-2 text-sm"
                name="directory"
                [(ngModel)]="directory"
                placeholder="Directorio destino (por defecto apps/<nombre>)"
                data-testid="wizard-directory"
              />
            </div>
          </details>

          @if (command(); as cmd) {
            <div class="bg-muted mb-4 rounded-md p-3">
              <p class="text-muted-foreground mb-1 text-xs">
                1. Descarga el app-schema · 2. Ejecútalo en el workspace del acelerador:
              </p>
              <code class="block break-all text-xs" data-testid="wizard-command">{{ cmd }}</code>
            </div>
          }

          <div class="flex justify-end gap-2">
            <button
              type="button"
              class="border-input rounded-md border px-3 py-2 text-sm"
              data-testid="wizard-cancel"
              (click)="open.set(false)"
            >
              Cerrar
            </button>
            <button
              type="button"
              class="border-input hover:bg-accent rounded-md border px-3 py-2 text-sm disabled:opacity-50"
              [disabled]="!valid()"
              data-testid="wizard-copy"
              (click)="copyCommand()"
            >
              {{ copied() ? 'Copiado ✓' : 'Copiar comando' }}
            </button>
            <button
              type="button"
              class="border-input hover:bg-accent rounded-md border px-3 py-2 text-sm disabled:opacity-50"
              [disabled]="!valid()"
              data-testid="wizard-download"
              (click)="download()"
            >
              Descargar schema
            </button>
            <button
              type="button"
              class="bg-primary text-primary-foreground rounded-md px-3 py-2 text-sm disabled:opacity-50"
              [disabled]="!valid() || generating()"
              data-testid="wizard-generate"
              (click)="generateHere()"
            >
              {{ generating() ? 'Generando…' : 'Generar aquí' }}
            </button>
          </div>

          @if (generating()) {
            <div class="py-6 text-center" data-testid="generate-progress">
              <div class="mb-4 flex items-center justify-center gap-3">
                <span
                  class="border-primary inline-block h-6 w-6 animate-spin rounded-full border-2 border-t-transparent"
                ></span>
                <span class="text-sm font-medium">{{ step() ?? 'Generando…' }}</span>
              </div>
              <p class="text-muted-foreground text-xs">{{ filesWritten() }} ficheros escritos · {{ seconds() }} s</p>
              @if (lastFile(); as file) {
                <p class="text-muted-foreground mt-1 truncate font-mono text-[11px]">{{ file }}</p>
              }
              <p class="text-muted-foreground mt-4 text-xs">
                Instalar dependencias es lo que más tarda (un minuto y medio); el código se escribe en segundos.
              </p>
            </div>
          }
          @if (elapsed(); as ms) {
            <p class="text-muted-foreground mt-3 text-xs" data-testid="generate-elapsed">
              Generado en {{ (ms / 1000).toFixed(1) }} s
            </p>
          }
          @if (generateOutput(); as out) {
            <pre
              class="bg-muted mt-4 max-h-48 overflow-auto rounded-md p-3 text-xs"
              [attr.data-testid]="generateOk() ? 'generate-ok' : 'generate-error'"
              >{{ out }}</pre
            >
          }
        </div>
      </div>
    }
  `,
  styles: `
    /* En noche el CTA dominante se invierte a papel y un botón blanco es lo que más
       pesa de la pantalla. Toma el naranja de la marca —el mismo #f15539— con la
       tinta oscura encima, igual que la entidad elegida del diagrama. */
    :host-context(.dark) .generate-cta:not(:disabled) {
      background-color: #f15539;
      color: var(--brand-foreground);
    }
  `
})
export class GenerateWizardComponent {
  private readonly store = inject(DesignStore)
  private readonly http = inject(HttpClient)
  private readonly preview = inject(PreviewSettings)

  /** Las opciones del generador, tal cual las publica su registro de ranuras (spec 23) */
  protected readonly manifest = signal<SlotsManifest | null>(null)
  protected readonly manifestError = signal<string | null>(null)
  protected readonly selection = signal<Record<string, string>>({})

  protected readonly open = signal(false)
  protected readonly name = signal('')
  protected readonly plugins = signal<string[]>([])
  protected readonly copied = signal(false)
  protected readonly install = signal(true)
  protected readonly directory = signal('')

  /** El progreso REAL del generador, leído por el servicio que habla con el stream. */
  private readonly runner = inject(GenerateRunner)
  protected readonly generating = this.runner.generating
  protected readonly generateOutput = this.runner.output
  protected readonly generateOk = this.runner.ok
  protected readonly elapsed = this.runner.elapsed
  protected readonly step = this.runner.step
  protected readonly filesWritten = this.runner.filesWritten
  protected readonly lastFile = this.runner.lastFile
  protected readonly seconds = this.runner.seconds

  /** Sin una vista con bloques no hay nada que generar: el botón se queda apagado. */
  protected readonly canPublish = computed(() => hasPublishableDesign(this.store.pages()))

  protected readonly choosable = computed(() => {
    const manifest = this.manifest()
    return manifest ? choosableSlots(manifest) : []
  })
  protected readonly valid = computed(() => KEBAB.test(this.name()) && this.manifest() !== null)
  protected readonly command = computed(() => {
    const manifest = this.manifest()
    return manifest && KEBAB.test(this.name())
      ? buildCommand(manifest, {
          name: this.name(),
          slots: this.selection(),
          plugins: this.plugins()
        })
      : null
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
        this.selection.update(current => ({
          ...current,
          [candidate.name]: candidate.default
        }))
      }
    }
  }

  protected disabled(provider: ManifestProvider): boolean {
    return isDisabled(provider, this.selection())
  }

  protected requirementOf(provider: ManifestProvider): string {
    return Object.entries(provider.requires ?? {})
      .map(([slot, value]) => `Requiere ${slot}=${value}`)
      .join(', ')
  }

  protected togglePlugin(plugin: string): void {
    this.plugins.update(list => (list.includes(plugin) ? list.filter(p => p !== plugin) : [...list, plugin]))
  }

  protected download(): void {
    // el artefacto de --appFile: app-schema + resource-schemas expandidos, con el nombre elegido
    const design = {
      ...(JSON.parse(this.store.exportJson()) as Record<string, unknown>),
      name: this.name()
    }
    downloadBlob(new Blob([JSON.stringify(design, null, 2)], { type: 'application/json' }), `${this.name()}.app.json`)
  }

  /** Fase F (opción 1): el backend LOCAL ejecuta el generador — sin terminal. */
  protected generateHere(): Promise<void> {
    return this.runner.run({
      name: this.name(),
      slots: this.selection(),
      plugins: this.plugins(),
      // lo que ves en el lienzo es lo que se genera (spec 18), y eso incluye la
      // memoria del negocio y los procesos: se arma en buildDesignRequest, no aquí
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

  protected async copyCommand(): Promise<void> {
    const cmd = this.command()
    if (!cmd) return
    await navigator.clipboard.writeText(cmd)
    this.copied.set(true)
    setTimeout(() => this.copied.set(false), 1500)
  }
}
