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

/** Lo que emite el endpoint de validación (spec 75) por cada comprobación. */
interface ValidateEvent {
  type: 'check' | 'done'
  name?: string
  status?: 'running' | 'ok' | 'failed'
  ok?: boolean
  failedCheck?: string
  suspects?: string[]
  output?: string
}

/** Una comprobación de la fase de validación, tal como la pinta la fila de la obra. */
export interface CheckState {
  name: string
  status: 'running' | 'ok' | 'failed'
}

/** El veredicto de una pasada de validación, materia prima de la reparación. */
interface ValidationVerdict {
  ok: boolean
  suspects: string[]
  output: string
}

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
  /** Las comprobaciones de la fase de validación (spec 75) y cómo va cada una */
  readonly checks = signal<CheckState[]>([])
  /** La comprobación que puso el rojo, si lo hubo */
  readonly failedCheck = signal<string | null>(null)
  /** La salida del fallo de validación: el informe accionable del desenlace */
  readonly validationOutput = signal<string | null>(null)
  /** Huecos IA implicados en el fallo; vacío = el rojo es del código canónico */
  readonly suspects = signal<string[]>([])
  /** Huecos que la fase de reparación dejó arreglados y aceptados por su gate */
  readonly repaired = signal<string[]>([])
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
        // si la generación ya había terminado (hay root), lo cancelado son las fases
        // finales: la app existe y NO se borra (spec 75)
        this.output.set(
          this.root()
            ? `Cancelada durante las fases finales. La app generada en ${this.root()} se conserva.`
            : 'Cancelada. El generador se paró y el código a medias se borró.'
        )
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
      if (this.outcome() === 'cancelled') return
    } else {
      this.phases.update(phases => applySkip(phases, 'fill'))
    }

    const verdict = await this.validate()
    if (this.outcome() === 'cancelled') return

    if (!verdict.ok && verdict.suspects.length) {
      // presupuesto acotado (spec 75): UN ciclo de reparación y UNA re-validación
      this.phases.update(phases => applyEvent(phases, { phase: 'repair' }, Date.now()))
      await this.repair(verdict.output)
      if (this.outcome() === 'cancelled') return
      const second = await this.validate()
      if (this.outcome() === 'cancelled') return
      if (!second.ok) {
        this.outcome.set('failed')
        this.ok.set(false)
      }
      return
    }

    // verde, o rojo canónico (sin huecos IA implicados): en ninguno de los dos se repara —
    // lo primero no lo necesita y lo segundo se arregla en el generador, nunca a mano
    this.phases.update(phases => applySkip(phases, 'repair'))
    if (!verdict.ok) {
      this.outcome.set('failed')
      this.ok.set(false)
    }
  }

  /**
   * La fase «Reparando huecos» (spec 75): el generador re-propone SOLO los huecos IA
   * citados en el informe, cada uno bajo su gate. Aquí solo se cuenta qué quedó arreglado.
   */
  private async repair(report: string): Promise<void> {
    this.repaired.set([])
    const response = await fetch('/api/v1/studio/repair/stream', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ directory: this.requestedDir, report }),
      signal: this.aborter?.signal
    })
    if (!response.ok || !response.body) {
      throw new Error(`el backend respondió ${response.status}`)
    }
    await this.readLines(response.body.getReader(), raw => {
      const event = raw as unknown as FillEvent
      if (event.type === 'slot' && event.id && event.status === 'filled') {
        this.repaired.update(ids => [...ids, event.id as string])
      }
    })
  }

  /**
   * La fase «Validando la app» (spec 75): corre las comprobaciones que la propia app
   * declara y guarda el veredicto — incluida la atribución del rojo (huecos IA vs canon).
   */
  private async validate(): Promise<ValidationVerdict> {
    this.phases.update(phases => applyEvent(phases, { phase: 'validate' }, Date.now()))
    this.checks.set([])
    const verdict: ValidationVerdict = { ok: false, suspects: [], output: '' }

    const response = await fetch('/api/v1/studio/validate/stream', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ directory: this.requestedDir }),
      signal: this.aborter?.signal
    })
    if (!response.ok || !response.body) {
      throw new Error(`el backend respondió ${response.status}`)
    }

    await this.readLines(response.body.getReader(), raw => {
      const event = raw as ValidateEvent
      if (event.type === 'check' && event.name && event.status) {
        const check: CheckState = { name: event.name, status: event.status }
        this.checks.update(checks =>
          checks.some(c => c.name === check.name)
            ? checks.map(c => (c.name === check.name ? check : c))
            : [...checks, check]
        )
        return
      }
      if (event.type === 'done') {
        verdict.ok = event.ok ?? false
        verdict.suspects = event.suspects ?? []
        verdict.output = event.output ?? ''
        this.failedCheck.set(event.failedCheck ?? null)
        this.validationOutput.set(verdict.ok ? null : verdict.output)
        this.suspects.set(verdict.suspects)
      }
    })

    return verdict
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
        body: JSON.stringify({ directory }),
        // encadenado en la obra (spec 75) el relleno se cancela con ella; suelto va sin señal
        signal: this.aborter?.signal
      })
      if (!response.ok || !response.body) {
        throw new Error(`el backend respondió ${response.status}`)
      }
      await this.readLines(response.body.getReader(), raw => {
        const event = raw as unknown as FillEvent
        if (event.type !== 'slot' || !event.id || !event.status) return
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
      })
    } catch (e) {
      // un stream roto deja lo contado hasta ahí; los huecos siguen pendientes en disco.
      // Cancelar la obra no es un corte que avisar: quien canceló ya lo está viendo.
      if (this.outcome() !== 'cancelled') {
        const detail = e instanceof Error ? e.message : String(e)
        this.noticeService.show(`El relleno se cortó: ${detail}`)
      }
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
    this.checks.set([])
    this.failedCheck.set(null)
    this.validationOutput.set(null)
    this.suspects.set([])
    this.repaired.set([])
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
    await this.readLines(reader, event => this.apply(event as GenerateEvent))
  }

  /** El lector NDJSON común de todos los streams de la obra: parte por líneas y parsea. */
  private async readLines(
    reader: ReadableStreamDefaultReader<Uint8Array>,
    onEvent: (event: Record<string, unknown>) => void
  ): Promise<void> {
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
          onEvent(JSON.parse(line) as Record<string, unknown>)
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
