import { Injectable, signal } from '@angular/core'

/** Lo que emite el endpoint de progreso mientras genera. */
interface GenerateEvent {
  type: 'progress' | 'done'
  step?: string
  file?: string
  files?: number
  ok?: boolean
  root?: string
  output?: string
  elapsedMs?: number
}

/**
 * Fase F: el backend LOCAL ejecuta el generador —sin terminal— y va contando lo que hace en
 * NDJSON. Se lee a trozos con `fetch` y no con `HttpClient` porque hay que consumir el cuerpo
 * mientras llega: durante el minuto o dos que tarda, callar parece un cuelgue.
 *
 * Vive en un servicio y no en el componente porque en la pantalla «Antes de generar» el botón
 * que lanza está en el raíl y el progreso se pinta en el centro: dejarlo en un componente
 * obligaba a cablear entradas y salidas entre hermanos. De paso se puede probar con un `fetch`
 * falso, cosa que en el asistente viejo no se hacía.
 */
@Injectable({ providedIn: 'root' })
export class GenerateRunner {
  readonly generating = signal(false)
  readonly step = signal<string | null>(null)
  readonly filesWritten = signal(0)
  readonly lastFile = signal<string | null>(null)
  readonly seconds = signal(0)
  readonly output = signal<string | null>(null)
  readonly ok = signal(false)
  readonly elapsed = signal<number | null>(null)

  private ticker: ReturnType<typeof setInterval> | null = null

  async run(body: unknown): Promise<void> {
    this.reset()
    this.ticker = setInterval(() => this.seconds.update(value => value + 1), 1000)

    try {
      const response = await fetch('/api/v1/studio/generate/stream', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (!response.ok || !response.body) {
        throw new Error(`el backend respondió ${response.status}`)
      }

      await this.consume(response.body.getReader())
    } catch (e) {
      this.ok.set(false)
      const detail = e instanceof Error ? e.message : String(e)
      this.output.set(`✗ ${detail}\nSi el backend no está arrancado: npm run studio:api:bridge`)
    } finally {
      this.stopTicker()
      this.generating.set(false)
      this.step.set(null)
    }
  }

  private reset(): void {
    this.generating.set(true)
    this.output.set(null)
    this.elapsed.set(null)
    this.filesWritten.set(0)
    this.lastFile.set(null)
    this.seconds.set(0)
    this.step.set('Validando el diseño')
  }

  /** El troceado no respeta las líneas: lo que quede a medias espera al siguiente trozo. */
  private async consume(reader: ReadableStreamDefaultReader<Uint8Array>): Promise<void> {
    const decoder = new TextDecoder()
    let buffer = ''

    for (;;) {
      const { done, value } = await reader.read()
      if (done) {
        break
      }
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''
      for (const line of lines) {
        if (line.trim()) {
          this.apply(JSON.parse(line) as GenerateEvent)
        }
      }
    }
  }

  private apply(event: GenerateEvent): void {
    if (event.type === 'progress') {
      this.step.set(event.step ?? null)
      this.filesWritten.set(event.files ?? this.filesWritten())
      if (event.file) {
        this.lastFile.set(event.file)
      }
      return
    }
    this.ok.set(event.ok ?? false)
    this.elapsed.set(event.elapsedMs ?? null)
    this.filesWritten.set(event.files ?? this.filesWritten())
    this.output.set(
      event.ok ? `✅ Generada en ${event.root}\n\n${event.output ?? ''}` : (event.output ?? 'La generación falló.')
    )
  }

  private stopTicker(): void {
    if (this.ticker) {
      clearInterval(this.ticker)
    }
    this.ticker = null
  }
}
