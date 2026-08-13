import { afterEach, describe, expect, it, vi } from 'vitest'
import { TestBed } from '@angular/core/testing'
import { GenerateRunner } from './generate-runner'

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

    await run.run({ name: 'taller' })

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

    await run.run({ name: 'mini' })

    expect(run.ok()).toBe(true)
    expect(run.filesWritten()).toBe(7)
  })

  it('al terminar deja de generar y suelta el paso en curso', async () => {
    vi.stubGlobal('fetch', streaming([line({ type: 'done', ok: true, files: 1, root: 'apps/mini' })]))
    const run = runner()

    await run.run({ name: 'mini' })

    expect(run.generating()).toBe(false)
    expect(run.step()).toBeNull()
  })

  it('el segundero se para al terminar: no queda nada corriendo de fondo', async () => {
    vi.useFakeTimers()
    vi.stubGlobal('fetch', streaming([line({ type: 'done', ok: true, files: 1, root: 'apps/mini' })]))
    const run = runner()

    await run.run({ name: 'mini' })
    const stopped = run.seconds()
    vi.advanceTimersByTime(5000)

    expect(run.seconds()).toBe(stopped)
    vi.useRealTimers()
  })

  it('un backend que responde mal se cuenta como fallo, con la pista de arrancarlo', async () => {
    vi.stubGlobal('fetch', streaming([], false))
    const run = runner()

    await run.run({ name: 'mini' })

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

    await run.run({ name: 'mini' })

    expect(run.ok()).toBe(false)
    expect(run.output()).toBe('error: la ranura auth exige postgres')
  })

  it('una segunda generación no arrastra el resultado de la anterior', async () => {
    vi.stubGlobal('fetch', streaming([line({ type: 'done', ok: true, files: 9, root: 'apps/uno', output: 'ok' })]))
    const run = runner()
    await run.run({ name: 'uno' })

    vi.stubGlobal('fetch', streaming([line({ type: 'progress', step: 'Validando', files: 2 })]))
    await run.run({ name: 'dos' })

    expect(run.filesWritten()).toBe(2)
    expect(run.elapsed()).toBeNull()
    expect(run.output()).toBeNull()
  })
})
