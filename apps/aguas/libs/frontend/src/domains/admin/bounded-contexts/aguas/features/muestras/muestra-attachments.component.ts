import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { firstValueFrom } from 'rxjs'
import { NgIcon, provideIcons } from '@ng-icons/core'
import { lucideFile, lucidePaperclip, lucideTrash2 } from '@ng-icons/lucide'
import { downloadBlob } from '../../../../../../shared/utils/download-file'

interface AttachmentDto {
  id: string
  fileName: string
  mimeType: string
  sizeBytes: number
  uploadedAt: string
}

/** Adjuntos de Muestras: arrastrar y soltar, listar, descargar y borrar. */
@Component({
  selector: 'app-muestras-attachments',
  imports: [NgIcon],
  providers: [provideIcons({ lucideFile, lucidePaperclip, lucideTrash2 })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mt-6">
      <h2 class="mb-2 text-sm font-semibold">Ficheros adjuntos</h2>
      <label
        class="border-input hover:bg-accent/40 flex cursor-pointer flex-col items-center rounded-lg border-2 border-dashed px-6 py-8 text-center transition-colors"
        [class.bg-accent]="dragging()"
        (dragover)="onDragOver($event)"
        (dragleave)="dragging.set(false)"
        (drop)="onDrop($event)"
      >
        <ng-icon name="lucidePaperclip" size="26" class="text-muted-foreground" />
        <span class="text-sm font-medium">Arrastra ficheros aquí o haz clic para subirlos</span>
        <span class="text-muted-foreground text-xs">PDF, imágenes o documentos · máx. 10 MB</span>
        <input type="file" class="hidden" (change)="onPick($event)" />
      </label>

      @if (error(); as message) {
        <p class="text-destructive mt-2 text-xs">{{ message }}</p>
      }

      <ul class="mt-3 space-y-1">
        @for (file of files(); track file.id) {
          <li class="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
            <button type="button" class="flex items-center gap-2 hover:underline" (click)="download(file)">
              <ng-icon name="lucideFile" size="14" class="text-muted-foreground" />
              {{ file.fileName }}
            </button>
            <span class="text-muted-foreground flex items-center gap-3 text-xs">
              {{ formatSize(file.sizeBytes) }}
              <button type="button" class="text-destructive" (click)="remove(file)">
                <ng-icon name="lucideTrash2" size="15" />
              </button>
            </span>
          </li>
        }
      </ul>
    </section>
  `
})
export class MuestraAttachmentsComponent {
  private readonly http = inject(HttpClient)
  /** Registro dueño de los ficheros: los adjuntos cuelgan del registro, no del recurso. */
  readonly muestraId = input.required<string>()

  private readonly endpoint = computed(() => `/api/v1/muestras/${this.muestraId()}/attachments`)

  protected readonly files = signal<AttachmentDto[]>([])
  protected readonly dragging = signal(false)
  protected readonly error = signal<string | null>(null)

  constructor() {
    // recarga al cambiar de registro: el input no existe aún en el constructor
    effect(() => {
      this.muestraId()
      void this.reload()
    })
  }

  protected onDragOver(event: DragEvent): void {
    event.preventDefault()
    this.dragging.set(true)
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault()
    this.dragging.set(false)
    const file = event.dataTransfer?.files?.[0]
    if (file) void this.upload(file)
  }

  protected onPick(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0]
    if (file) void this.upload(file)
  }

  protected async download(file: AttachmentDto): Promise<void> {
    const blob = await firstValueFrom(this.http.get(`${this.endpoint()}/${file.id}/download`, { responseType: 'blob' }))
    downloadBlob(blob, file.fileName)
  }

  protected async remove(file: AttachmentDto): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`${this.endpoint()}/${file.id}`))
    await this.reload()
  }

  protected formatSize(bytes: number): string {
    return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`
  }

  private async upload(file: File): Promise<void> {
    this.error.set(null)
    const body = new FormData()
    body.append('file', file)
    try {
      await firstValueFrom(this.http.post<AttachmentDto>(this.endpoint(), body))
      await this.reload()
    } catch {
      this.error.set('No se pudo subir el fichero (tipo no permitido o demasiado grande).')
    }
  }

  private async reload(): Promise<void> {
    this.files.set(await firstValueFrom(this.http.get<AttachmentDto[]>(this.endpoint())))
  }
}
