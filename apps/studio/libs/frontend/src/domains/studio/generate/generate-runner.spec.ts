import { afterEach, describe, expect, it, vi } from 'vitest'
import { TestBed } from '@angular/core/testing'
import { CanvasNoticeService } from '../design/canvas-notice.service'
import { GenerateRunner, type GenerateRequest } from './generate-runner'

/** Un cuerpo NDJSON troceado a voluntad: así se prueba el corte a mitad de línea. */
const streaming = (chunks: string[], ok = true): typeof fetch => {
  const encoder = new TextEncoder()
  let index = 0

  return vi.fn(async () => ({
    ok,
    status: ok ? 200 : 500,
    body: ok
      ? {
          getReader: () => ({
            read: async () =>
              index < chunks.length ? { done: false, value: encoder.encode(chunks[index++]) } : { done: true }
          })
        }
      : null
  })) as unknown as typeof fetch
}

const runner = (): GenerateRunner => {
  TestBed.configureTestingModule({})
  return TestBed.inject(GenerateRunner)
}

const line = (event: Record<string, unknown>): string => `${JSON.stringify(event)}\n`

/** Lo mínimo que hay que mandar a generar; los tests que miran otra cosa parten de aquí. */
const ask = (name: string): GenerateRequest => ({
  name,
  slots: {},
  plugins: [],
  skipInstall: true,
  design: { appName: name, palette: 'ocean', resources: [], pages: [] } as unknown as GenerateRequest['design']
})

describe('GenerateRunner', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('arranca en reposo: nada que contar hasta que se genera', () => {
    const run = runner()

    expect(run.generating()).toBe(false)
    expect(run.output()).toBeNull()
    expect(run.filesWritten()).toBe(0)
  })

  it('va contando lo que el generador dice mientras trabaja', async () => {
    vi.stubGlobal(
      'fetch',
      streaming([
        line({ type: 'progress', step: 'Escribiendo el dominio', files: 12, file: 'libs/backend/orden.ts' }),
        line({ type: 'progress', step: 'Instalando dependencias', files: 40 }),
        line({ type: 'done', ok: true, files: 41, root: 'apps/taller', output: 'listo', elapsedMs: 92000 })
      ])
    )
    const run = runner()

    await run.run(ask('taller'))

    expect(run.filesWritten()).toBe(41)
    expect(run.lastFile()).toBe('libs/backend/orden.ts')
    expect(run.ok()).toBe(true)
    expect(run.elapsed()).toBe(92000)
    expect(run.output()).toContain('apps/taller')
  })

  /** El troceado del cuerpo no respeta las líneas: partir un JSON por la mitad es lo normal. */
  it('recompone un evento que llega partido en dos trozos', async () => {
    const event = line({ type: 'done', ok: true, files: 7, root: 'apps/mini', output: 'ok' })
    vi.stubGlobal('fetch', streaming([event.slice(0, 20), event.slice(20)]))
    const run = runner()

    await run.run(ask('mini'))

    expect(run.ok()).toBe(true)
    expect(run.filesWritten()).toBe(7)
  })

  it('al terminar deja de generar y suelta el paso en curso', async () => {
    vi.stubGlobal('fetch', streaming([line({ type: 'done', ok: true, files: 1, root: 'apps/mini' })]))
    const run = runner()

    await run.run(ask('mini'))

    expect(run.generating()).toBe(false)
    expect(run.step()).toBeNull()
  })

  it('el segundero se para al terminar: no queda nada corriendo de fondo', async () => {
    vi.useFakeTimers()
    vi.stubGlobal('fetch', streaming([line({ type: 'done', ok: true, files: 1, root: 'apps/mini' })]))
    const run = runner()

    await run.run(ask('mini'))
    const stopped = run.seconds()
    vi.advanceTimersByTime(5000)

    expect(run.seconds()).toBe(stopped)
    vi.useRealTimers()
  })

  it('un backend que responde mal se cuenta como fallo, con la pista de arrancarlo', async () => {
    vi.stubGlobal('fetch', streaming([], false))
    const run = runner()

    await run.run(ask('mini'))

    expect(run.ok()).toBe(false)
    expect(run.output()).toContain('500')
    expect(run.output()).toContain('studio:api')
  })

  it('un generador que falla enseña su salida, no un mensaje inventado', async () => {
    vi.stubGlobal(
      'fetch',
      streaming([line({ type: 'done', ok: false, output: 'error: la ranura auth exige postgres' })])
    )
    const run = runner()

    await run.run(ask('mini'))

    expect(run.ok()).toBe(false)
    expect(run.output()).toBe('error: la ranura auth exige postgres')
  })

  it('una segunda generación no arrastra el resultado de la anterior', async () => {
    vi.stubGlobal('fetch', streaming([line({ type: 'done', ok: true, files: 9, root: 'apps/uno', output: 'ok' })]))
    const run = runner()
    await run.run(ask('uno'))

    vi.stubGlobal('fetch', streaming([line({ type: 'progress', step: 'Validando', files: 2 })]))
    await run.run(ask('dos'))

    expect(run.filesWritten()).toBe(2)
    expect(run.elapsed()).toBeNull()
    expect(run.output()).toBeNull()
  })

  /**
   * Spec 42: el runner ya no cuenta solo ficheros, cuenta la OBRA — en qué fase va, qué piezas
   * del diseño han salido y cómo acabó todo.
   */
  describe('la obra', () => {
    // skipInstall a propósito: el pipeline post-install (spec 75) se prueba en su describe,
    // con streams secuenciados; aquí se prueba la obra clásica sin fases encadenadas
    const request: GenerateRequest = {
      name: 'boutique',
      slots: { auth: 'single-tenant', infra: 'none', database: 'postgres' },
      plugins: [],
      skipInstall: true,
      design: {
        appName: 'boutique',
        palette: 'ocean',
        resources: [
          {
            name: 'prenda',
            plural: 'prendas',
            labelSingular: 'Prenda',
            labelPlural: 'Prendas',
            gender: 'f',
            fields: []
          }
        ],
        pages: [{ title: 'Catálogo', blocks: [{ kind: 'table', resource: 'prenda' }] }]
      } as unknown as GenerateRequest['design']
    }

    const status = (run: GenerateRunner, key: string): string | undefined =>
      run.phases().find(p => p.key === key)?.status

    it('antes de arrancar ya sabe qué fases van a ocurrir', async () => {
      const run = runner()
      vi.stubGlobal('fetch', streaming([line({ type: 'progress', phase: 'prepare', step: 'Preparando' })]))

      await run.run(request)

      expect(run.phases().map(p => p.key)).toEqual(['prepare', 'write', 'install', 'fill', 'validate', 'repair'])
    })

    it('si no se instala, esa fase queda omitida desde el principio', async () => {
      const run = runner()
      vi.stubGlobal('fetch', streaming([line({ type: 'progress', phase: 'prepare' })]))

      await run.run({ ...request, skipInstall: true })

      expect(status(run, 'install')).toBe('skipped')
    })

    it('va cerrando fases conforme el generador avanza', async () => {
      const run = runner()
      vi.stubGlobal(
        'fetch',
        streaming([
          line({ type: 'progress', phase: 'prepare' }),
          line({ type: 'progress', phase: 'write', files: 40, file: 'libs/x/prenda.ts' }),
          line({ type: 'done', ok: true, files: 40, root: 'apps/boutique', output: 'listo' })
        ])
      )

      await run.run(request)

      expect(status(run, 'prepare')).toBe('done')
      expect(status(run, 'write')).toBe('done')
    })

    it('marca lo que el diseño prometía conforme aparece su código', async () => {
      const run = runner()
      vi.stubGlobal(
        'fetch',
        streaming([line({ type: 'progress', phase: 'write', files: 1, file: 'libs/frontend/x/prenda.service.ts' })])
      )

      await run.run(request)

      expect(run.written().find(i => i.label === 'Prendas')?.done).toBe(true)
      expect(run.written().find(i => i.label === 'Autenticación')?.done).toBe(false)
    })

    it('el desenlace es explícito, no se deduce de un booleano suelto', async () => {
      const run = runner()
      vi.stubGlobal('fetch', streaming([line({ type: 'done', ok: true, files: 3, root: 'apps/x', output: 'ok' })]))
      await run.run(request)
      expect(run.outcome()).toBe('ok')

      vi.stubGlobal('fetch', streaming([line({ type: 'done', ok: false, output: 'reventó' })]))
      await run.run(request)
      expect(run.outcome()).toBe('failed')
    })

    it('cancelar no es fallar: se cuenta como cancelada y lo dice', async () => {
      const run = runner()
      // un stream que no termina nunca, como una generación de verdad a mitad
      vi.stubGlobal(
        'fetch',
        vi.fn(async (_url: string, init: { signal: AbortSignal }) => ({
          ok: true,
          status: 200,
          body: {
            getReader: () => ({
              read: () =>
                new Promise((_resolve, reject) =>
                  init.signal.addEventListener('abort', () => reject(new DOMException('abortada', 'AbortError')))
                )
            })
          }
        })) as unknown as typeof fetch
      )

      const running = run.run(request)
      await Promise.resolve()
      await Promise.resolve()
      run.cancel()
      await running

      expect(run.outcome()).toBe('cancelled')
      expect(run.generating()).toBe(false)
      expect(run.output()).toContain('Cancelada')
      expect(run.ok()).toBe(false)
    })

    /** El desenlace necesita la ruta como dato, no enterrada en el texto del registro. */
    it('recuerda dónde quedó la app, y una generación nueva lo olvida', async () => {
      const run = runner()
      vi.stubGlobal('fetch', streaming([line({ type: 'done', ok: true, files: 3, root: 'apps/boutique', output: 'ok' })]))
      await run.run(request)
      expect(run.root()).toBe('apps/boutique')

      vi.stubGlobal('fetch', streaming([line({ type: 'progress', phase: 'prepare' })]))
      await run.run(request)
      expect(run.root()).toBeNull()
    })

    it('una generación nueva no arrastra el desenlace de la anterior', async () => {
      const run = runner()
      vi.stubGlobal('fetch', streaming([line({ type: 'done', ok: false, output: 'reventó' })]))
      await run.run(request)

      vi.stubGlobal('fetch', streaming([line({ type: 'progress', phase: 'prepare' })]))
      await run.run(request)

      expect(run.outcome()).toBeNull()
      expect(run.output()).toBeNull()
    })
  })

  /**
   * TASK-09 (spec 42): «seguir en segundo plano» es cerrar la capa sin tocar nada. La pantalla
   * se declara mirando (attach) o no (detach), y el final solo avisa cuando nadie miraba.
   */
  describe('el segundo plano', () => {
    /** Un stream que aguanta abierto hasta que el test lo suelta: da tiempo a irse. */
    const holdable = (done: Record<string, unknown>): { release: () => void } => {
      const encoder = new TextEncoder()
      let release: () => void = () => undefined
      const gate = new Promise<void>(resolve => (release = resolve))
      let sent = false
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => ({
          ok: true,
          status: 200,
          body: {
            getReader: () => ({
              read: async () => {
                if (sent) return { done: true }
                await gate
                sent = true
                return { done: false, value: encoder.encode(`${JSON.stringify(done)}\n`) }
              }
            })
          }
        })) as unknown as typeof fetch
      )
      return { release }
    }

    const notice = (): CanvasNoticeService => TestBed.inject(CanvasNoticeService)

    it('si nadie miraba al terminar bien, avisa con la ruta y una salida al resultado', async () => {
      const run = runner()
      const stream = holdable({ type: 'done', ok: true, files: 3, root: 'apps/boutique', output: 'ok' })

      run.attach()
      const running = run.run(ask('boutique'))
      await Promise.resolve()
      run.detach()
      stream.release()
      await running

      expect(notice().notice()?.text).toContain('apps/boutique')
      expect(notice().notice()?.action?.label).toBe('Ver el resultado')
    })

    it('seguir el aviso pide reabrir la obra', async () => {
      const run = runner()
      const stream = holdable({ type: 'done', ok: true, files: 3, root: 'apps/boutique', output: 'ok' })

      run.attach()
      const running = run.run(ask('boutique'))
      await Promise.resolve()
      run.detach()
      stream.release()
      await running
      notice().notice()?.action?.run()

      expect(run.viewRequested()).toBe(true)
    })

    it('un fallo en segundo plano también avisa, con su cara de fallo', async () => {
      const run = runner()
      const stream = holdable({ type: 'done', ok: false, output: 'reventó' })

      run.attach()
      const running = run.run(ask('boutique'))
      await Promise.resolve()
      run.detach()
      stream.release()
      await running

      expect(notice().notice()?.text).toContain('falló')
      expect(notice().notice()?.action?.label).toBe('Ver el motivo')
    })

    it('si la obra se estaba mirando, el final no grita', async () => {
      const run = runner()
      notice().dismiss()
      vi.stubGlobal('fetch', streaming([line({ type: 'done', ok: true, files: 3, root: 'apps/x', output: 'ok' })]))

      run.attach()
      await run.run(ask('mini'))

      expect(notice().notice()).toBeNull()
    })

    it('volver a mirar antes del final tampoco avisa: ya lo estás viendo', async () => {
      const run = runner()
      notice().dismiss()
      const stream = holdable({ type: 'done', ok: true, files: 3, root: 'apps/x', output: 'ok' })

      run.attach()
      const running = run.run(ask('mini'))
      await Promise.resolve()
      run.detach()
      run.attach()
      stream.release()
      await running

      expect(notice().notice()).toBeNull()
    })
  })
})

/**
 * Spec 45: el desenlace cuenta los pasos de negocio por rellenar y el runner sabe
 * rellenarlos por el puente — consumiendo el stream del endpoint de relleno.
 */
describe('el relleno de huecos (spec 45)', () => {
  const request: GenerateRequest = {
    name: 'boutique',
    slots: {},
    plugins: [],
    skipInstall: true,
    design: { appName: 'boutique', palette: 'ocean', resources: [], pages: [] } as unknown as GenerateRequest['design']
  }

  afterEach(() => vi.unstubAllGlobals())

  it('el done trae los huecos y el runner los deja listados como pendientes', async () => {
    vi.stubGlobal(
      'fetch',
      streaming([line({ type: 'done', ok: true, files: 3, root: '/abs/apps/boutique', slots: ['flow-cie', 'flow-envio'], output: 'ok' })])
    )
    const run = runner()

    await run.run(request)

    expect(run.slotStates()).toEqual([
      { id: 'flow-cie', status: 'pending' },
      { id: 'flow-envio', status: 'pending' }
    ])
  })

  it('fillSlots consume el stream: proponiendo → aceptado/rechazado con motivo', async () => {
    vi.stubGlobal(
      'fetch',
      streaming([line({ type: 'done', ok: true, files: 3, root: '/abs/apps/boutique', slots: ['flow-cie', 'flow-envio'], output: 'ok' })])
    )
    const run = runner()
    await run.run(request)

    vi.stubGlobal(
      'fetch',
      streaming([
        line({ type: 'pending', slots: ['flow-cie', 'flow-envio'] }),
        line({ type: 'slot', id: 'flow-cie', status: 'proposing' }),
        line({ type: 'slot', id: 'flow-cie', status: 'filled' }),
        line({ type: 'slot', id: 'flow-envio', status: 'proposing' }),
        line({ type: 'slot', id: 'flow-envio', status: 'rejected', reason: 'nadie respondió al puente' }),
        line({ type: 'done', ok: true, filled: ['flow-cie'], rejected: [{ id: 'flow-envio', reason: 'nadie respondió al puente' }], pending: ['flow-envio'] })
      ])
    )
    await run.fillSlots()

    expect(run.fillingSlots()).toBe(false)
    expect(run.slotStates()).toEqual([
      { id: 'flow-cie', status: 'filled' },
      { id: 'flow-envio', status: 'rejected', reason: 'nadie respondió al puente' }
    ])
  })

  it('con fases encadenadas el relleno manual sigue existiendo para re-ejecuciones', async () => {
    // el botón de la spec 45 no desaparece: quien quiera reintentar un hueco lo pulsa
    expect(typeof runner().fillSlots).toBe('function')
  })

  it('una generación nueva olvida los huecos de la anterior', async () => {
    vi.stubGlobal(
      'fetch',
      streaming([line({ type: 'done', ok: true, files: 3, root: '/abs/x', slots: ['flow-cie'], output: 'ok' })])
    )
    const run = runner()
    await run.run(request)

    vi.stubGlobal('fetch', streaming([line({ type: 'progress', phase: 'prepare' })]))
    await run.run(request)

    expect(run.slotStates()).toEqual([])
  })
})

/**
 * Spec 75: la obra sigue sola después de instalar. Cada fase es su propio stream y el
 * runner los encadena: relleno (si hay huecos), validación y, si el rojo es de la IA,
 * reparación con una única re-validación.
 */
describe('el pipeline por fases (spec 75)', () => {
  afterEach(() => vi.unstubAllGlobals())

  const request: GenerateRequest = {
    name: 'boutique',
    slots: {},
    plugins: [],
    skipInstall: false,
    design: { appName: 'boutique', palette: 'ocean', resources: [], pages: [] } as unknown as GenerateRequest['design']
  }

  const status = (run: GenerateRunner, key: string): string | undefined =>
    run.phases().find(p => p.key === key)?.status

  /** Un fetch que sirve un stream distinto por llamada y recuerda las URLs pedidas. */
  const sequenced = (calls: string[][]): { urls: string[] } => {
    const encoder = new TextEncoder()
    const urls: string[] = []
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        urls.push(String(url))
        const chunks = calls[urls.length - 1] ?? []
        let index = 0
        return {
          ok: true,
          status: 200,
          body: {
            getReader: () => ({
              read: async () =>
                index < chunks.length ? { done: false, value: encoder.encode(chunks[index++]) } : { done: true }
            })
          }
        }
      }) as unknown as typeof fetch
    )
    return { urls }
  }

  const generated = (slots: string[]): string[] => [
    line({ type: 'progress', phase: 'install', packages: 1700 }),
    line({ type: 'done', ok: true, files: 3, root: 'apps/boutique', slots, output: 'ok' })
  ]

  describe('la fase de relleno (TASK-07)', () => {
    it('tras un done ok con huecos, el relleno arranca solo', async () => {
      const { urls } = sequenced([
        generated(['flow-cie']),
        [
          line({ type: 'slot', id: 'flow-cie', status: 'proposing' }),
          line({ type: 'slot', id: 'flow-cie', status: 'filled' }),
          line({ type: 'done', ok: true, filled: ['flow-cie'], rejected: [], pending: [] })
        ]
      ])
      const run = runner()

      await run.run(request)

      expect(urls[1]).toContain('/studio/fill-slots/stream')
      expect(run.slotStates()).toEqual([{ id: 'flow-cie', status: 'filled' }])
      expect(status(run, 'fill')).toBe('done')
    })

    it('sin huecos la fase de relleno se omite y no se llama al puente', async () => {
      const { urls } = sequenced([generated([])])
      const run = runner()

      await run.run(request)

      expect(status(run, 'fill')).toBe('skipped')
      expect(urls.filter(url => url.includes('fill-slots'))).toEqual([])
    })

    it('con skipInstall no hay pipeline: todo lo post-install queda omitido', async () => {
      const { urls } = sequenced([generated(['flow-cie'])])
      const run = runner()

      await run.run({ ...request, skipInstall: true })

      expect(status(run, 'fill')).toBe('skipped')
      expect(urls).toHaveLength(1)
    })

    it('si la generación falla, el pipeline ni arranca', async () => {
      const { urls } = sequenced([[line({ type: 'done', ok: false, output: 'reventó' })]])
      const run = runner()

      await run.run(request)

      expect(urls).toHaveLength(1)
      expect(status(run, 'fill')).toBe('pending')
    })
  })
})
