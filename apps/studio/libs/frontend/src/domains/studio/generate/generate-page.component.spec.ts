import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TestBed } from '@angular/core/testing'
import { provideHttpClient } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { DesignStore } from '../design/design-store'
import { PreviewSettings } from '../design/preview-settings'
import { GeneratePageComponent } from './generate-page.component'
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

    it('el botón lleva al paso de generar', async () => {
      const fixture = await mount()

      expect(at(fixture, 'generate-primary')?.textContent).toContain('Continuar')
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
    /** Deja la pantalla en el paso 3, que es donde vive el nombre y el comando. */
    const mountStep3 = async () => {
      const fixture = await mount()
      at(fixture, 'generate-primary')?.click()
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

    it('el nombre viene precargado con el del diseño, no en blanco', async () => {
      store.setAppName('taller-sur')

      const fixture = await mountStep3()

      expect((at(fixture, 'wizard-name') as HTMLInputElement).value).toBe('taller-sur')
    })

    it('el comando lleva las ranuras elegidas', async () => {
      const fixture = await mount()
      at(fixture, 'slot-infra-azure')?.click()
      at(fixture, 'generate-primary')?.click()
      fixture.detectChanges()

      const command = at(fixture, 'wizard-command')?.textContent ?? ''
      expect(command).toContain('npx nx g @acc/generators:app')
      expect(command).toContain('--infra=azure')
      expect(command).toContain('--plugins=none')
    })

    it('un nombre que no es kebab-case no deja generar, y lo dice', async () => {
      const fixture = await mountStep3()

      type(fixture, 'wizard-name', 'Mi App')
      fixture.detectChanges()

      expect(at(fixture, 'generate-primary')?.hasAttribute('disabled')).toBe(true)
      // el recuadro del artefacto entero desaparece: sin nombre no hay comando ni descarga
      expect(at(fixture, 'wizard-download')).toBeNull()
      expect(at(fixture, 'wizard-name-problem')?.textContent).toContain('kebab-case')
    })

    it('sin nombre válido tampoco hay comando que copiar', async () => {
      const fixture = await mountStep3()

      type(fixture, 'wizard-name', '')
      fixture.detectChanges()

      expect(at(fixture, 'wizard-command')).toBeNull()
    })

    it('copiar deja el comando en el portapapeles', async () => {
      const writeText = vi.fn(() => Promise.resolve())
      Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
      const fixture = await mountStep3()

      at(fixture, 'wizard-copy')?.click()

      expect(writeText).toHaveBeenCalledWith(expect.stringContaining('npx nx g @acc/generators:app'))
    })

    it('el botón del raíl cambia de texto y lanza la generación', async () => {
      const sent = stubGenerate()
      const fixture = await mountStep3()

      expect(at(fixture, 'generate-primary')?.textContent).toContain('Generar aplicación')
      at(fixture, 'generate-primary')?.click()
      await settle()
      fixture.detectChanges()

      expect(sent.body()).toMatchObject({ name: 'mi-app', skipInstall: false })
      expect(at(fixture, 'generate-ok')?.textContent).toContain('apps/mi-app')
      expect(at(fixture, 'generate-elapsed')?.textContent).toContain('4.2')
    })

    it('lo que se manda a generar lleva el diseño del lienzo, no solo las ranuras', async () => {
      store.addResource('Prenda')
      store.addPage('blank', 'Prendas')
      store.addBlock(0, { kind: 'table', resource: 'prenda' })
      const sent = stubGenerate()
      const fixture = await mountStep3()

      at(fixture, 'generate-primary')?.click()
      await settle()

      const design = sent.body().design as { pages: unknown[]; resources: unknown[] }
      expect(design.pages).toHaveLength(1)
      expect(design.resources).toHaveLength(1)
    })

    it('lo avanzado viaja: sin instalar y con directorio propio', async () => {
      const sent = stubGenerate()
      const fixture = await mountStep3()

      ;(at(fixture, 'wizard-install') as HTMLInputElement).click()
      type(fixture, 'wizard-directory', 'apps/cliente')
      fixture.detectChanges()
      at(fixture, 'generate-primary')?.click()
      await settle()

      expect(sent.body()).toMatchObject({ skipInstall: true, directory: 'apps/cliente' })
    })

    it('un directorio en blanco no viaja como clave vacía', async () => {
      const sent = stubGenerate()
      const fixture = await mountStep3()

      at(fixture, 'generate-primary')?.click()
      await settle()

      expect('directory' in sent.body()).toBe(false)
    })

    it('se puede volver a las decisiones sin perderlas', async () => {
      const fixture = await mount()
      at(fixture, 'slot-infra-azure')?.click()
      at(fixture, 'generate-primary')?.click()
      fixture.detectChanges()

      at(fixture, 'wizard-step-infra')?.click()
      fixture.detectChanges()

      expect(at(fixture, 'slot-infra-azure')?.getAttribute('aria-checked')).toBe('true')
    })
  })
})
