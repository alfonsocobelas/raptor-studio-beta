import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TestBed } from '@angular/core/testing'
import { provideHttpClient } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { DesignStore } from '../design/design-store'
import { PreviewSettings } from '../design/preview-settings'
import { GeneratePageComponent } from './generate-page.component'
import { GenerateRunner } from './generate-runner'
import type { SlotsManifest } from './wizard-command'

const manifest: SlotsManifest = {
  slots: [
    {
      name: 'database',
      label: 'Base de datos',
      default: 'postgres',
      providers: [
        { value: 'postgres', label: 'PostgreSQL (TypeORM)' },
        { value: 'mongo', label: 'MongoDB (Mongoose)' }
      ]
    },
    {
      name: 'design',
      label: 'Preset visual',
      default: 'actual',
      providers: [
        { value: 'actual', label: 'Actual (neutro)' },
        { value: 'cabina', label: 'Cabina (centro de operaciones)' }
      ]
    },
    {
      name: 'infra',
      label: 'Infraestructura',
      default: 'none',
      providers: [
        { value: 'none', label: 'Ninguna' },
        { value: 'azure', label: 'Azure' }
      ]
    },
    {
      name: 'auth',
      label: 'Autenticación',
      default: 'none',
      providers: [
        { value: 'none', label: 'Ninguna' },
        { value: 'single-tenant', label: 'Single-tenant', requires: { database: 'postgres' } }
      ]
    }
  ],
  plugins: [{ name: 'email', description: 'Emails' }]
}

describe('GeneratePageComponent', () => {
  let http: HttpTestingController
  let store: DesignStore
  let preview: PreviewSettings

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] })
    http = TestBed.inject(HttpTestingController)
    store = TestBed.inject(DesignStore)
    preview = TestBed.inject(PreviewSettings)
  })
  afterEach(() => http.verify())

  /**
   * Monta la pantalla y responde a la carga del manifiesto, como haría el studio-api. Es
   * asíncrona porque el componente lo espera con `firstValueFrom`: sin dejar correr las
   * microtareas, la pantalla se queda en «Cargando opciones del generador…».
   */
  const mount = async (served: SlotsManifest | 'error' = manifest) => {
    const fixture = TestBed.createComponent(GeneratePageComponent)
    fixture.detectChanges()
    const request = http.expectOne('/api/v1/studio/generate/slots')
    if (served === 'error') {
      request.flush('nope', { status: 500, statusText: 'Server Error' })
    } else {
      request.flush(served)
    }
    await Promise.resolve()
    fixture.detectChanges()
    return fixture
  }

  const at = (fixture: { nativeElement: HTMLElement }, testid: string): HTMLElement | null =>
    fixture.nativeElement.querySelector(`[data-testid="${testid}"]`)

  const text = (fixture: { nativeElement: HTMLElement }): string => fixture.nativeElement.textContent ?? ''

  describe('la cabecera', () => {
    /**
     * La capa hereda el `.dark` del documento (lo pone PreviewSettings), pero la MARCA no se
     * hereda: se invierte por cálculo. Estaba cableada a mano y se quedaba igual en noche.
     */
    it('la marca sigue al tema del estudio, como en el lienzo', async () => {
      const fixture = await mount()

      expect(at(fixture, 'generate-mark-plate')?.getAttribute('fill')).toBe('#1b1917')
      expect(at(fixture, 'generate-mark-letter')?.getAttribute('fill')).toBe('#f15539')

      preview.toggleStudioTheme()
      fixture.detectChanges()

      // en noche se invierte: la pastilla toma el naranja y la R, la tinta
      expect(at(fixture, 'generate-mark-plate')?.getAttribute('fill')).toBe('#f15539')
      expect(at(fixture, 'generate-mark-letter')?.getAttribute('fill')).toBe('#1b1917')
    })

    it('se puede cambiar el tema sin volver al lienzo', async () => {
      const fixture = await mount()

      at(fixture, 'generate-theme')?.click()
      fixture.detectChanges()

      expect(preview.studioTheme()).toBe('dark')
      expect(document.documentElement.classList.contains('dark')).toBe(true)
      preview.toggleStudioTheme()
    })

    it('lleva el nombre del diseño y dónde está', async () => {
      store.setAppName('taller-sur')

      expect(text(await mount())).toContain('taller-sur')
      expect(text(await mount())).toContain('Antes de generar')
    })

    it('marca el paso de infraestructura, con las vistas ya cumplidas', async () => {
      const fixture = await mount()

      expect(at(fixture, 'wizard-step-views')?.getAttribute('data-state')).toBe('done')
      expect(at(fixture, 'wizard-step-infra')?.getAttribute('data-state')).toBe('current')
      expect(at(fixture, 'wizard-step-generate')?.getAttribute('data-state')).toBe('pending')
    })

    /** Lo cumplido se lee de un vistazo por el color, no por el icono: verde es «hecho». */
    it('los pasos cumplidos se ponen verdes, y la línea que los une también', async () => {
      const fixture = await mount()
      const green = (testid: string): boolean => at(fixture, testid)?.classList.contains('bg-emerald-500') === true

      // en el paso 2: solo Vistas está cumplido
      expect(green('wizard-pip-views')).toBe(true)
      expect(green('wizard-pip-infra')).toBe(false)
      expect(green('wizard-line-views')).toBe(false)

      at(fixture, 'generate-primary')?.click()
      fixture.detectChanges()

      // en el paso 3: Vistas e Infraestructura, y la línea entre ambos
      expect(green('wizard-pip-views')).toBe(true)
      expect(green('wizard-pip-infra')).toBe(true)
      expect(green('wizard-line-views')).toBe(true)
      // la línea que entra en el paso en curso NO se pinta: ese tramo no está hecho
      expect(green('wizard-line-infra')).toBe(false)
      expect(green('wizard-pip-generate')).toBe(false)
    })

    it('volver al lienzo cierra la pantalla', async () => {
      const fixture = await mount()
      let closed = false
      fixture.componentInstance.close.subscribe(() => (closed = true))

      at(fixture, 'generate-back')?.click()

      expect(closed).toBe(true)
    })

    it('escape también cierra: es una capa, no una ruta', async () => {
      const fixture = await mount()
      let closed = false
      fixture.componentInstance.close.subscribe(() => (closed = true))

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
      fixture.detectChanges()

      expect(closed).toBe(true)
    })

    it('pulsar el paso de las vistas vuelve al lienzo', async () => {
      const fixture = await mount()
      let closed = false
      fixture.componentInstance.close.subscribe(() => (closed = true))

      at(fixture, 'wizard-step-views')?.click()

      expect(closed).toBe(true)
    })
  })

  describe('las decisiones', () => {
    it('pinta las ranuras elegibles del manifiesto, con el alojamiento primero', async () => {
      const fixture = await mount()
      const headings = [...fixture.nativeElement.querySelectorAll('h2')].map(h => h.textContent?.trim())

      expect(headings).toEqual(['¿Dónde quieres alojarla?', 'Base de datos', 'Autenticación', 'Complementos'])
    })

    it('el preset visual no se pregunta: lo manda el lienzo', async () => {
      const fixture = await mount()

      expect(at(fixture, 'slot-design-cabina')).toBeNull()
    })

    it('arranca con lo que el manifiesto trae por defecto', async () => {
      const fixture = await mount()

      expect(at(fixture, 'slot-infra-none')?.getAttribute('aria-checked')).toBe('true')
      expect(at(fixture, 'slot-database-postgres')?.getAttribute('aria-checked')).toBe('true')
    })

    it('elegir un proveedor lo marca', async () => {
      const fixture = await mount()

      at(fixture, 'slot-infra-azure')?.click()
      fixture.detectChanges()

      expect(at(fixture, 'slot-infra-azure')?.getAttribute('aria-checked')).toBe('true')
      expect(at(fixture, 'slot-infra-none')?.getAttribute('aria-checked')).toBe('false')
    })

    /** Mongo deja fuera a single-tenant: la ranura incompatible vuelve a su defecto. */
    it('cambiar una ranura corrige la que queda incompatible', async () => {
      const fixture = await mount()
      at(fixture, 'slot-auth-single-tenant')?.click()
      fixture.detectChanges()

      at(fixture, 'slot-database-mongo')?.click()
      fixture.detectChanges()

      expect(at(fixture, 'slot-auth-none')?.getAttribute('aria-checked')).toBe('true')
      expect(at(fixture, 'slot-auth-single-tenant')?.hasAttribute('disabled')).toBe(true)
    })

    it('los complementos del manifiesto se pueden marcar y desmarcar', async () => {
      const fixture = await mount()

      at(fixture, 'plugin-email')?.click()
      fixture.detectChanges()
      expect(at(fixture, 'plugin-email')?.getAttribute('aria-checked')).toBe('true')

      at(fixture, 'plugin-email')?.click()
      fixture.detectChanges()
      expect(at(fixture, 'plugin-email')?.getAttribute('aria-checked')).toBe('false')
    })

    it('los que aún no existen salen apagados', async () => {
      const fixture = await mount()

      expect(at(fixture, 'plugin-redis')?.hasAttribute('disabled')).toBe(true)
      expect(at(fixture, 'soon-redis')).not.toBeNull()
    })

    it('sin manifiesto no hay formulario, sino el motivo y cómo arreglarlo', async () => {
      const fixture = await mount('error')

      expect(at(fixture, 'wizard-slots-error')?.textContent).toContain('studio:api')
      expect(at(fixture, 'slot-infra-azure')).toBeNull()
    })
  })

  describe('el raíl', () => {
    beforeEach(() => {
      store.addResource('Prenda')
      store.addPage('blank', 'Prendas')
      store.addBlock(0, { kind: 'table', resource: 'prenda' })
    })

    it('resume lo que va a salir: vistas, bloques y entidades', async () => {
      const summary = at(await mount(), 'generate-summary')?.textContent ?? ''

      expect(summary).toContain('1 vista')
      expect(summary).toContain('1 bloque')
      expect(summary).toContain('1 entidad')
    })

    it('enseña el preset del lienzo, que aquí no se elige', async () => {
      preview.preset.set('cabina')

      expect(at(await mount(), 'generate-summary')?.textContent).toContain('Cabina')
    })

    it('lista la pila elegida con la etiqueta de cada ranura', async () => {
      const fixture = await mount()
      at(fixture, 'slot-infra-azure')?.click()
      fixture.detectChanges()

      const stack = at(fixture, 'generate-stack')?.textContent ?? ''
      expect(stack).toContain('Infraestructura')
      expect(stack).toContain('Azure')
      expect(stack).toContain('PostgreSQL')
    })

    it('sin complementos activos la pila lo dice, en vez de callar', async () => {
      expect(at(await mount(), 'generate-stack')?.textContent).toContain('Ninguno')
    })

    it('con complementos activos los nombra', async () => {
      const fixture = await mount()

      at(fixture, 'plugin-email')?.click()
      fixture.detectChanges()

      expect(at(fixture, 'generate-stack')?.textContent).toContain('Correo saliente')
    })

    it('el botón arranca la obra y deja atrás las decisiones', async () => {
      const fixture = await mount()

      expect(at(fixture, 'generate-primary')?.textContent).toContain('Generar aplicación')
      at(fixture, 'generate-primary')?.click()
      fixture.detectChanges()

      expect(at(fixture, 'wizard-step-generate')?.getAttribute('data-state')).toBe('current')
      expect(at(fixture, 'slot-infra-azure')).toBeNull()
    })

    it('sin manifiesto no se puede continuar', async () => {
      expect(at(await mount('error'), 'generate-primary')?.hasAttribute('disabled')).toBe(true)
    })
  })

  describe('el paso de generar', () => {
    /**
     * El botón del raíl arranca la obra, así que para ver el paso 3 hay que generar. El
     * comando y la descarga viven en el DESENLACE (spec 42), no mientras se construye: hay
     * que dejar que la generación termine antes de mirarlos.
     */
    const mountStep3 = async () => {
      stubGenerate()
      const fixture = await mount()
      at(fixture, 'generate-primary')?.click()
      await settle()
      fixture.detectChanges()
      return fixture
    }

    const type = (fixture: { nativeElement: HTMLElement }, testid: string, value: string): void => {
      const field = fixture.nativeElement.querySelector(`[data-testid="${testid}"]`) as HTMLInputElement
      field.value = value
      field.dispatchEvent(new Event('input'))
    }

    /** Un NDJSON de una sola línea: ver el resultado sin levantar el studio-api. */
    const stubGenerate = (): { body: () => Record<string, unknown> } => {
      const calls: string[] = []
      const encoder = new TextEncoder()
      const done = JSON.stringify({
        type: 'done',
        ok: true,
        files: 120,
        root: 'apps/mi-app',
        output: 'listo',
        elapsedMs: 4200
      })
      vi.stubGlobal(
        'fetch',
        vi.fn(async (_url: string, init: { body: string }) => {
          calls.push(init.body)
          let sent = false
          return {
            ok: true,
            status: 200,
            body: {
              getReader: () => ({
                read: async () => {
                  if (sent) return { done: true }
                  sent = true
                  return { done: false, value: encoder.encode(`${done}\n`) }
                }
              })
            }
          }
        })
      )
      return { body: () => JSON.parse(calls[0]) as Record<string, unknown> }
    }

    /** El stream se lee a trozos: unas cuantas microtareas y ya ha terminado. */
    const settle = async (): Promise<void> => {
      for (let i = 0; i < 6; i++) await Promise.resolve()
    }

    afterEach(() => vi.unstubAllGlobals())

    /** El nombre y lo avanzado viven en el RAÍL del paso 2 (spec 42): el paso 3 es la obra. */
    it('el nombre está en el raíl, precargado con el del diseño', async () => {
      store.setAppName('taller-sur')

      const fixture = await mount()

      expect((at(fixture, 'wizard-name') as HTMLInputElement).value).toBe('taller-sur')
      expect(at(fixture, 'generate-step-infra')?.contains(at(fixture, 'wizard-name'))).toBe(false)
    })

    it('el comando lleva las ranuras elegidas', async () => {
      stubGenerate()
      const fixture = await mount()
      at(fixture, 'slot-infra-azure')?.click()
      at(fixture, 'generate-primary')?.click()
      await settle()
      fixture.detectChanges()

      const command = at(fixture, 'wizard-command')?.textContent ?? ''
      expect(command).toContain('npx nx g @acc/generators:app')
      expect(command).toContain('--infra=azure')
      expect(command).toContain('--plugins=none')
    })

    it('un nombre que no es kebab-case no deja generar, y lo dice', async () => {
      const fixture = await mount()

      type(fixture, 'wizard-name', 'Mi App')
      fixture.detectChanges()

      expect(at(fixture, 'generate-primary')?.hasAttribute('disabled')).toBe(true)
      expect(at(fixture, 'wizard-name-problem')?.textContent).toContain('kebab-case')
    })

    it('sin nombre válido no se llega a generar nada', async () => {
      const sent = stubGenerate()
      const fixture = await mount()

      type(fixture, 'wizard-name', '')
      fixture.detectChanges()
      at(fixture, 'generate-primary')?.click()
      await settle()

      expect(() => sent.body()).toThrow()
      expect(at(fixture, 'generate-step-generate')).toBeNull()
    })

    it('copiar deja el comando en el portapapeles', async () => {
      const writeText = vi.fn(() => Promise.resolve())
      Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
      const fixture = await mountStep3()

      at(fixture, 'wizard-copy')?.click()

      expect(writeText).toHaveBeenCalledWith(expect.stringContaining('npx nx g @acc/generators:app'))
    })

    it('el botón del raíl genera y lleva a ver la obra de una vez', async () => {
      const sent = stubGenerate()
      const fixture = await mount()

      expect(at(fixture, 'generate-primary')?.textContent).toContain('Generar aplicación')
      at(fixture, 'generate-primary')?.click()
      await settle()
      fixture.detectChanges()

      expect(at(fixture, 'generate-step-generate')).not.toBeNull()
      expect(sent.body()).toMatchObject({ name: 'mi-app', skipInstall: false })
      expect(at(fixture, 'generate-outcome')).not.toBeNull()
    })

    it('lo que se manda a generar lleva el diseño del lienzo, no solo las ranuras', async () => {
      store.addResource('Prenda')
      store.addPage('blank', 'Prendas')
      store.addBlock(0, { kind: 'table', resource: 'prenda' })
      const sent = stubGenerate()
      const fixture = await mount()

      at(fixture, 'generate-primary')?.click()
      await settle()

      const design = sent.body().design as { pages: unknown[]; resources: unknown[] }
      expect(design.pages).toHaveLength(1)
      expect(design.resources).toHaveLength(1)
    })

    it('lo avanzado viaja: sin instalar y con directorio propio', async () => {
      const sent = stubGenerate()
      const fixture = await mount()

      ;(at(fixture, 'wizard-install') as HTMLInputElement).click()
      type(fixture, 'wizard-directory', 'apps/cliente')
      fixture.detectChanges()
      at(fixture, 'generate-primary')?.click()
      await settle()

      expect(sent.body()).toMatchObject({ skipInstall: true, directory: 'apps/cliente' })
    })

    it('un directorio en blanco no viaja como clave vacía', async () => {
      const sent = stubGenerate()
      const fixture = await mount()

      at(fixture, 'generate-primary')?.click()
      await settle()

      expect('directory' in sent.body()).toBe(false)
    })

    it('se puede volver a las decisiones sin perderlas', async () => {
      stubGenerate()
      const fixture = await mount()
      at(fixture, 'slot-infra-azure')?.click()
      at(fixture, 'generate-primary')?.click()
      fixture.detectChanges()

      at(fixture, 'wizard-step-infra')?.click()
      fixture.detectChanges()

      expect(at(fixture, 'slot-infra-azure')?.getAttribute('aria-checked')).toBe('true')
    })
  })

  /**
   * TASK-08 (spec 42): al terminar, la MISMA pantalla cuenta el desenlace. Nada de volver a
   * un paso aparte: la obra acaba y ahí mismo está la ruta, cómo arrancarla o por qué paró.
   */
  describe('el desenlace', () => {
    const settle = async (): Promise<void> => {
      for (let i = 0; i < 6; i++) await Promise.resolve()
    }

    afterEach(() => vi.unstubAllGlobals())

    /** Un NDJSON de una línea con final a elegir: la obra entera sin studio-api. */
    const stubOutcome = (done: Record<string, unknown>): void => {
      const encoder = new TextEncoder()
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => {
          let sent = false
          return {
            ok: true,
            status: 200,
            body: {
              getReader: () => ({
                read: async () => {
                  if (sent) return { done: true }
                  sent = true
                  return { done: false, value: encoder.encode(`${JSON.stringify(done)}\n`) }
                }
              })
            }
          }
        })
      )
    }

    const generate = async (done: Record<string, unknown>) => {
      stubOutcome(done)
      const fixture = await mount()
      at(fixture, 'generate-primary')?.click()
      await settle()
      fixture.detectChanges()
      return fixture
    }

    it('la que acaba bien enseña ruta, ficheros y tiempo, como datos y no como log', async () => {
      const fixture = await generate({
        type: 'done',
        ok: true,
        files: 120,
        root: 'apps/mi-app',
        output: 'listo',
        elapsedMs: 92000
      })

      const outcome = at(fixture, 'generate-outcome')
      expect(outcome?.getAttribute('data-state')).toBe('ok')
      expect(outcome?.textContent).toContain('apps/mi-app')
      expect(outcome?.textContent).toContain('120 ficheros')
      expect(outcome?.textContent).toContain('1 min 32 s')
    })

    it('dice cómo arrancarla, con los comandos de verdad de la app generada', async () => {
      const fixture = await generate({ type: 'done', ok: true, files: 3, root: 'apps/mi-app', elapsedMs: 4200 })

      const hint = at(fixture, 'generate-run-hint')?.textContent ?? ''
      expect(hint).toContain('cd apps/mi-app')
      expect(hint).toContain('make local-setup')
      expect(hint).toContain('make api')
      expect(hint).toContain('make web')
    })

    it('el comando determinista y la descarga del diseño acompañan al desenlace bueno', async () => {
      const fixture = await generate({ type: 'done', ok: true, files: 3, root: 'apps/mi-app', elapsedMs: 4200 })

      expect(at(fixture, 'wizard-command')?.textContent).toContain('npx nx g @acc/generators:app')
      expect(at(fixture, 'wizard-copy')).not.toBeNull()
      expect(at(fixture, 'wizard-download')).not.toBeNull()
    })

    it('la fallida tiene su cara: lo dice y ofrece volver a las decisiones', async () => {
      const fixture = await generate({ type: 'done', ok: false, output: 'error: la ranura auth exige postgres' })

      expect(at(fixture, 'generate-outcome')?.getAttribute('data-state')).toBe('failed')
      expect(at(fixture, 'outcome-back')).not.toBeNull()

      at(fixture, 'outcome-back')?.click()
      fixture.detectChanges()

      expect(at(fixture, 'generate-step-infra')).not.toBeNull()
    })

    /**
     * El comando promete «el mismo resultado»: tiene que reproducir LO GENERADO aunque la
     * pantalla se haya reabierto (la capa nueva reiniciaba nombre y ranuras desde el diseño
     * y el comando pasaba a describir otra generación — visto en la validación de TASK-10).
     */
    it('el comando del desenlace reproduce lo generado aunque se reabra la pantalla', async () => {
      stubOutcome({ type: 'done', ok: true, files: 3, root: 'apps/valida', elapsedMs: 4200 })
      const first = await mount()
      const field = first.nativeElement.querySelector('[data-testid="wizard-name"]') as HTMLInputElement
      field.value = 'valida'
      field.dispatchEvent(new Event('input'))
      first.detectChanges()
      at(first, 'slot-infra-azure')?.click()
      first.detectChanges()
      at(first, 'generate-primary')?.click()
      await settle()
      first.destroy()

      const reopened = await mount()

      const command = at(reopened, 'wizard-command')?.textContent ?? ''
      expect(command).toContain('app valida')
      expect(command).toContain('--infra=azure')
    })

    /** TASK-09: reabrir mientras se genera (o ya generado) es volver a la obra, no empezar. */
    it('reabrir la pantalla con la obra en marcha aterriza en la obra, no en las decisiones', async () => {
      // un stream que no termina: la generación sigue viva cuando se reabre
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
        }))
      )
      const first = await mount()
      at(first, 'generate-primary')?.click()
      await settle()
      first.destroy()

      const reopened = await mount()

      expect(at(reopened, 'generate-step-generate')).not.toBeNull()
      expect(at(reopened, 'generate-step-infra')).toBeNull()
      TestBed.inject(GenerateRunner).cancel()
      await settle()
    })

    /** Spec 45: los pasos de negocio por rellenar viven en el desenlace, con su puente. */
    it('el desenlace lista los huecos y el botón de rellenar consume el stream', async () => {
      stubOutcome({ type: 'done', ok: true, files: 3, root: 'apps/mi-app', slots: ['flow-cie'], elapsedMs: 900 })
      const fixture = await mount()
      at(fixture, 'generate-primary')?.click()
      await settle()
      fixture.detectChanges()

      expect(at(fixture, 'fill-slots-section')).not.toBeNull()
      expect(at(fixture, 'slot-flow-cie')?.getAttribute('data-status')).toBe('pending')

      // el stream del relleno: aceptado por el gate
      stubOutcome({ type: 'slot', id: 'flow-cie', status: 'filled' })
      at(fixture, 'fill-slots-run')?.click()
      await settle()
      fixture.detectChanges()

      expect(at(fixture, 'slot-flow-cie')?.getAttribute('data-status')).toBe('filled')
    })

    it('sin huecos, la sección de relleno ni aparece', async () => {
      const fixture = await generate({ type: 'done', ok: true, files: 3, root: 'apps/mi-app', slots: [], elapsedMs: 900 })

      expect(at(fixture, 'fill-slots-section')).toBeNull()
    })

    it('la cancelada no se disfraza de error: su cara propia y la misma vuelta', async () => {
      // un stream que no termina: la única salida es cancelar
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
        }))
      )
      const fixture = await mount()
      at(fixture, 'generate-primary')?.click()
      await settle()
      fixture.detectChanges()

      at(fixture, 'work-cancel')?.click()
      await settle()
      fixture.detectChanges()

      const outcome = at(fixture, 'generate-outcome')
      expect(outcome?.getAttribute('data-state')).toBe('cancelled')
      expect(outcome?.textContent).toContain('Cancelada')
      expect(at(fixture, 'outcome-back')).not.toBeNull()
    })
  })
})
