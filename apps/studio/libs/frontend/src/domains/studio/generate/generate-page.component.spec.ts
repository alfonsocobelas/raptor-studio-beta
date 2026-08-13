import { afterEach, beforeEach, describe, expect, it } from 'vitest'
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
})
