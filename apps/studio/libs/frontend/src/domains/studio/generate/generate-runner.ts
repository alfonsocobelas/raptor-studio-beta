import { Injectable, inject, signal } from '@angular/core'
import { CanvasNoticeService } from '../design/canvas-notice.service'
import { applyDone, applyEvent, applySkip, initialPhases, type PhaseState } from './generate-phases'
import { markWritten, plannedItems, type WrittenItem } from './written-items'
import type { buildDesignRequest } from './wizard-command'

/** Lo que emite el endpoint de relleno (spec 45) por cada hueco. */
interface FillEvent {
  type: 'pending' | 'slot' | 'done'
  id?: string
  status?: 'proposing' | 'filled' | 'rejected'
  reason?: string
}

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
  /** Huecos flow-* que quedaron por rellenar (spec 45) */
  slots?: string[]
}

/** Lo que se manda a generar: el nombre, las ranuras y el diseño del lienzo. */
export interface GenerateRequest {
  name: string
  slots: Record<string, string>
  plugins: string[]
  design: ReturnType<typeof buildDesignRequest>
  skipInstall: boolean
  /** La infra la aprovisiona el cliente: el emitido no lleva Terraform (spec 62) */
  provisionedInfra?: boolean
  directory?: string
}

/** Cómo acabó. `null` mientras no ha acabado. */
export type GenerateOutcome = 'ok' | 'failed' | 'cancelled' | null

/** Un paso de negocio por rellenar (spec 45), con su recorrido por el puente. */
export interface SlotState {
  id: string
  status: 'pending' | 'proposing' | 'filled' | 'rejected'
  reason?: string
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
  /** Dónde quedó la app: el desenlace la enseña como dato, no enterrada en el registro. */
  readonly root = signal<string | null>(null)
  /** Las fases de la obra, declaradas antes de empezar y cerrándose conforme ocurren */
  readonly phases = signal<PhaseState[]>([])
  /** Las piezas del diseño, marcándose según sale su código */
  readonly written = signal<WrittenItem[]>([])
  readonly outcome = signal<GenerateOutcome>(null)
  /** El aviso de segundo plano pide reabrir la obra; el lienzo lo escucha y abre la capa. */
  readonly viewRequested = signal(false)
  /** Lo que se pidió generar: la pantalla reabierta reconstruye su comando desde aquí. */
  readonly requested = signal<Pick<GenerateRequest, 'name' | 'slots' | 'plugins'> | null>(null)
  /** Los pasos de negocio que quedaron por rellenar (spec 45) y su recorrido */
  readonly slotStates = signal<SlotState[]>([])
  readonly fillingSlots = signal(false)
  /** Directorio relativo de la app emitida: el endpoint de relleno lo exige del workspace */
  private requestedDir: string | null = null

  private readonly noticeService = inject(CanvasNoticeService)
  /** ¿Hay una pantalla mirando la obra? La página se declara al montarse y al morir. */
  private watching = false
  private ticker: ReturnType<typeof setInterval> | null = null
  private aborter: AbortController | null = null

  /** La pantalla de la obra está delante: el final no necesita gritar. */
  attach(): void {
    this.watching = true
  }

  /** «Seguir en segundo plano»: la capa se cierra y el final avisará por el lienzo. */
  detach(): void {
    this.watching = false
  }

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
      await this.afterInstall(request)
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
      this.notifyIfUnwatched()
    }
  }

  /**
   * El final de una obra que nadie miraba se cuenta por el lienzo. Cancelar no avisa: solo se
   * cancela desde la pantalla abierta, así que quien canceló ya lo está viendo.
   */
  private notifyIfUnwatched(): void {
    const outcome = this.outcome()
    if (this.watching || outcome === null || outcome === 'cancelled') {
      return
    }
    const view = { run: () => this.viewRequested.set(true) }
    if (outcome === 'ok') {
      this.noticeService.show(`Tu aplicación está lista en ${this.root() ?? 'el workspace'}`, {
        label: 'Ver el resultado',
        ...view
      })
      return
    }
    this.noticeService.show('La generación falló', { label: 'Ver el motivo', ...view })
  }

  /**
   * El pipeline post-install (spec 75): tras un done ok con dependencias instaladas, la
   * obra sigue sola — rellenar los huecos por el puente (si los hay). Con skipInstall no
   * hay nada que encadenar: sin node_modules no corren ni el gate ni la suite.
   */
  private async afterInstall(request: GenerateRequest): Promise<void> {
    if (request.skipInstall || this.outcome() !== 'ok') return

    if (this.slotStates().length) {
      this.phases.update(phases => applyEvent(phases, { phase: 'fill' }, Date.now()))
      await this.fillSlots()
    } else {
      this.phases.update(phases => applySkip(phases, 'fill'))
    }
  }

  /**
   * Rellena los huecos por el puente (spec 45): consume el stream del endpoint de relleno
   * y va pintando cada hueco. Cada hueco pasa su gate en el backend; aquí solo se cuenta.
   */
  async fillSlots(): Promise<void> {
    const directory = this.requestedDir
    if (!directory || this.fillingSlots() || !this.slotStates().length) return
    this.fillingSlots.set(true)
    try {
      const response = await fetch('/api/v1/studio/fill-slots/stream', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ directory })
      })
      if (!response.ok || !response.body) {
        throw new Error(`el backend respondió ${response.status}`)
      }
      const decoder = new TextDecoder()
      const reader = response.body.getReader()
      let buffer = ''
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''
        for (const raw of lines) {
          if (!raw.trim()) continue
          const event = JSON.parse(raw) as FillEvent
          if (event.type !== 'slot' || !event.id || !event.status) continue
          this.slotStates.update(states =>
            states.map(state =>
              state.id === event.id
                ? {
                    id: state.id,
                    status: event.status as SlotState['status'],
                    ...(event.reason ? { reason: event.reason } : {})
                  }
                : state
            )
          )
        }
      }
    } catch (e) {
      // un stream roto deja lo contado hasta ahí; los huecos siguen pendientes en disco
      const detail = e instanceof Error ? e.message : String(e)
      this.noticeService.show(`El relleno se cortó: ${detail}`)
    } finally {
      this.fillingSlots.set(false)
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
    this.requested.set({ name: request.name, slots: request.slots, plugins: request.plugins })
    this.requestedDir = request.directory ?? `apps/${request.name}`
    this.slotStates.set([])
    this.fillingSlots.set(false)
    this.output.set(null)
    this.elapsed.set(null)
    this.root.set(null)
    this.filesWritten.set(0)
    this.lastFile.set(null)
    this.seconds.set(0)
    this.step.set('Validando el diseño')
    this.outcome.set(null)
    this.viewRequested.set(false)
    this.phases.set(initialPhases({ skipInstall: request.skipInstall, startedAt: Date.now() }))
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
    this.root.set(event.root ?? null)
    // spec 45: los pasos de negocio que quedaron como huecos, listos para el puente
    this.slotStates.set((event.slots ?? []).map(id => ({ id, status: 'pending' as const })))
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
