import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { FormsModule } from '@angular/forms'
import { firstValueFrom } from 'rxjs'
import { downloadBlob } from '../../../shared/utils/download-file'
import { AppStore } from '../editor/app-store'
import {
  DATABASE_OPTIONS,
  PLUGIN_OPTIONS,
  UI_OPTIONS,
  buildAppFile,
  buildCommand,
  type WizardOptions
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
      class="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-medium"
      data-testid="open-wizard"
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

          <div class="mb-3 grid grid-cols-2 gap-4">
            <div>
              <span class="mb-1 block text-sm font-medium">Componentes</span>
              @for (option of uiOptions; track option) {
                <label class="flex items-center gap-2 text-sm">
                  <input type="radio" name="ui" [value]="option" [(ngModel)]="ui" [attr.data-testid]="'ui-' + option" />
                  {{ option }}
                </label>
              }
            </div>
            <div>
              <span class="mb-1 block text-sm font-medium">Base de datos</span>
              @for (option of databaseOptions; track option) {
                <label class="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="database"
                    [value]="option"
                    [(ngModel)]="database"
                    [attr.data-testid]="'db-' + option"
                  />
                  {{ option }}
                </label>
              }
            </div>
          </div>

          <span class="mb-1 block text-sm font-medium">Plugins</span>
          <div class="mb-4 flex gap-4">
            @for (plugin of pluginOptions; track plugin) {
              <label class="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  [checked]="plugins().includes(plugin)"
                  (change)="togglePlugin(plugin)"
                  [attr.data-testid]="'plugin-' + plugin"
                />
                {{ plugin }}
              </label>
            }
          </div>

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

          @if (generateOutput(); as out) {
            <pre
              class="bg-muted mt-4 max-h-48 overflow-auto rounded-md p-3 text-xs"
              [attr.data-testid]="generateOk() ? 'generate-ok' : 'generate-error'"
            >{{ out }}</pre>
          }
        </div>
      </div>
    }
  `
})
export class GenerateWizardComponent {
  private readonly store = inject(AppStore)
  private readonly http = inject(HttpClient)

  protected readonly uiOptions = UI_OPTIONS
  protected readonly databaseOptions = DATABASE_OPTIONS
  protected readonly pluginOptions = PLUGIN_OPTIONS

  protected readonly open = signal(false)
  protected readonly name = signal('')
  protected readonly ui = signal<WizardOptions['ui']>('spartan')
  protected readonly database = signal<WizardOptions['database']>('postgres')
  protected readonly plugins = signal<string[]>([])
  protected readonly copied = signal(false)
  protected readonly install = signal(true)
  protected readonly directory = signal('')
  protected readonly generating = signal(false)
  protected readonly generateOutput = signal<string | null>(null)
  protected readonly generateOk = signal(false)

  protected readonly valid = computed(() => KEBAB.test(this.name()))
  protected readonly command = computed(() =>
    this.valid()
      ? buildCommand({ name: this.name(), ui: this.ui(), database: this.database(), plugins: this.plugins() })
      : null
  )

  protected togglePlugin(plugin: string): void {
    this.plugins.update(list => (list.includes(plugin) ? list.filter(p => p !== plugin) : [...list, plugin]))
  }

  protected download(): void {
    const file = buildAppFile(this.store.definition(), this.name())
    downloadBlob(new Blob([file.content], { type: 'application/json' }), file.filename)
  }

  /** Fase F (opción 1): el backend LOCAL ejecuta el generador — sin terminal. */
  protected async generateHere(): Promise<void> {
    this.generating.set(true)
    this.generateOutput.set(null)
    try {
      const result = await firstValueFrom(
        this.http.post<{ ok: boolean; output: string; root: string }>('/api/v1/studio/generate', {
          name: this.name(),
          ui: this.ui(),
          database: this.database(),
          plugins: this.plugins(),
          schema: this.store.definition(),
          skipInstall: !this.install(),
          ...(this.directory().trim() ? { directory: this.directory().trim() } : {})
        })
      )
      this.generateOk.set(result.ok)
      this.generateOutput.set(result.ok ? `✅ Generada en ${result.root}\n\n${result.output}` : result.output)
    } catch (e) {
      this.generateOk.set(false)
      const detail =
        typeof e === 'object' && e !== null && 'error' in e
          ? ((e as { error?: { message?: string } }).error?.message ?? 'backend local no disponible')
          : String(e)
      this.generateOutput.set(`✗ ${detail}\nSi el backend no está arrancado: npm run studio:api (o usa descarga + comando).`)
    } finally {
      this.generating.set(false)
    }
  }

  protected async copyCommand(): Promise<void> {
    const cmd = this.command()
    if (!cmd) return
    await navigator.clipboard.writeText(cmd)
    this.copied.set(true)
    setTimeout(() => this.copied.set(false), 1500)
  }
}
