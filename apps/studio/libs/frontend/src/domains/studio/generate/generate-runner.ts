import { Injectable, signal } from '@angular/core'
import { applyDone, applyEvent, initialPhases, type PhaseState } from './generate-phases'
import { markWritten, plannedItems, type WrittenItem } from './written-items'
import type { buildDesignRequest } from './wizard-command'

/** Lo que emite el endpoint de progreso mientras genera. */
interface GenerateEvent {
  type: 'progress' | 'done'
  phase?: string
  step?: string
  file?: string
  files?: number
  packages?: number
  ok?: boolean
  root?: string
  output?: string
  elapsedMs?: number
}

/** Lo que se manda a generar: el nombre, las ranuras y el diseño del lienzo. */
export interface GenerateRequest {
  name: string
  slots: Record<string, string>
  plugins: string[]
  design: ReturnType<typeof buildDesignRequest>
  skipInstall: boolean
  directory?: string
}

/** Cómo acabó. `null` mientras no ha acabado. */
export type GenerateOutcome = 'ok' | 'failed' | 'cancelled' | null

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
  /** Las fases de la obra, declaradas antes de empezar y cerrándose conforme ocurren */
  readonly phases = signal<PhaseState[]>([])
  /** Las piezas del diseño, marcándose según sale su código */
  readonly written = signal<WrittenItem[]>([])
  readonly outcome = signal<GenerateOutcome>(null)

  private ticker: ReturnType<typeof setInterval> | null = null
  private aborter: AbortController | null = null

  async run(request: GenerateRequest): Promise<void> {
    this.reset(request)
    this.aborter = new AbortController()
    this.ticker = setInterval(() => this.seconds.update(value => value + 1), 1000)

    try {
      const response = await fetch('/api/v1/studio/generate/stream', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(request),
        signal: this.aborter.signal
      })

      if (!response.ok || !response.body) {
        throw new Error(`el backend respondió ${response.status}`)
      }

      await this.consume(response.body.getReader())
    } catch (e) {
      this.ok.set(false)
      // cancelar no es fallar: el usuario lo pidió y el backend ya está parando el generador
      if (this.outcome() === 'cancelled') {
        this.output.set('Cancelada. El generador se paró y el código a medias se borró.')
      } else {
        this.outcome.set('failed')
        const detail = e instanceof Error ? e.message : String(e)
        this.output.set(`✗ ${detail}\nSi el backend no está arrancado: npm run studio:api:bridge`)
      }
    } finally {
      this.stopTicker()
      this.aborter = null
      this.generating.set(false)
      this.step.set(null)
      this.phases.update(phases => applyDone(phases, Date.now(), this.outcome() === 'ok'))
    }
  }

  /**
   * Abortar el `fetch` cierra la respuesta, y eso es lo que el backend escucha para matar al
   * generador y borrar lo escrito a medias: no hace falta un endpoint de cancelación.
   */
  cancel(): void {
    if (!this.generating()) {
      return
    }
    this.outcome.set('cancelled')
    this.aborter?.abort()
  }

  private reset(request: GenerateRequest): void {
    this.generating.set(true)
    this.output.set(null)
    this.elapsed.set(null)
    this.filesWritten.set(0)
    this.lastFile.set(null)
    this.seconds.set(0)
    this.step.set('Validando el diseño')
    this.outcome.set(null)
    this.phases.set(initialPhases({ skipInstall: request.skipInstall }))
    this.written.set(
      plannedItems({
        resources: request.design.resources,
        pages: request.design.pages,
        slots: request.slots,
        plugins: request.plugins
      })
    )
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
      this.phases.update(phases =>
        applyEvent(phases, { phase: event.phase, files: event.files, packages: event.packages }, Date.now())
      )
      if (event.file) {
        this.lastFile.set(event.file)
        this.written.update(items => markWritten(items, event.file as string))
      }
      return
    }
    this.ok.set(event.ok ?? false)
    this.outcome.set(event.ok ? 'ok' : 'failed')
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
