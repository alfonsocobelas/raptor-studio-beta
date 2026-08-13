import { beforeEach, describe, expect, it } from 'vitest'
import { TestBed } from '@angular/core/testing'
import { GenerateRunner } from './generate-runner'
import { GenerateWorkComponent } from './generate-work.component'
import { initialPhases } from './generate-phases'
import { plannedItems } from './written-items'

/**
 * La obra en marcha (maqueta 7C): fases con su estado y su tiempo, registro plegable y, en el
 * raíl, lo que se está escribiendo. Todo sale del runner —ninguna cifra se inventa aquí—, así
 * que el test amaña el runner y comprueba lo que la pantalla cuenta.
 */
describe('GenerateWorkComponent', () => {
  let runner: GenerateRunner

  beforeEach(() => {
    TestBed.configureTestingModule({})
    runner = TestBed.inject(GenerateRunner)
    runner.phases.set(initialPhases({ skipInstall: false }))
    runner.written.set(
      plannedItems({
        resources: [
          {
            name: 'prenda',
            plural: 'prendas',
            labelSingular: 'Prenda',
            labelPlural: 'Prendas',
            gender: 'f',
            fields: []
          }
        ] as never,
        pages: [{ title: 'Catálogo', blocks: [{ kind: 'table', resource: 'prenda' }] }] as never,
        slots: { auth: 'none', infra: 'none' },
        plugins: []
      })
    )
  })

  const mount = () => {
    const fixture = TestBed.createComponent(GenerateWorkComponent)
    fixture.detectChanges()
    return fixture
  }

  const at = (fixture: { nativeElement: HTMLElement }, testid: string): HTMLElement | null =>
    fixture.nativeElement.querySelector(`[data-testid="${testid}"]`)

  describe('las fases', () => {
    it('se ven todas desde el principio, con su nombre y lo que hacen', () => {
      const fixture = mount()

      expect(at(fixture, 'phase-prepare')?.textContent).toContain('Preparando el proyecto')
      expect(at(fixture, 'phase-write')?.textContent).toContain('Escribiendo el código')
      expect(at(fixture, 'phase-configure')).not.toBeNull()
      expect(at(fixture, 'phase-install')).not.toBeNull()
    })

    it('cada una lleva su estado, para que se lea de un vistazo', () => {
      runner.phases.update(phases =>
        phases.map(p =>
          p.key === 'prepare'
            ? { ...p, status: 'done' as const, elapsedMs: 4000 }
            : p.key === 'write'
              ? { ...p, status: 'running' as const }
              : p
        )
      )
      const fixture = mount()

      expect(at(fixture, 'phase-prepare')?.getAttribute('data-state')).toBe('done')
      expect(at(fixture, 'phase-write')?.getAttribute('data-state')).toBe('running')
      expect(at(fixture, 'phase-install')?.getAttribute('data-state')).toBe('pending')
    })

    it('la cumplida enseña lo que tardó', () => {
      runner.phases.update(phases =>
        phases.map(p => (p.key === 'prepare' ? { ...p, status: 'done' as const, elapsedMs: 4200 } : p))
      )

      expect(at(mount(), 'phase-prepare')?.textContent).toContain('4 s')
    })

    it('la que pasó sin medirse no enseña tiempo inventado', () => {
      runner.phases.update(phases => phases.map(p => (p.key === 'prepare' ? { ...p, status: 'done' as const } : p)))

      expect(at(mount(), 'phase-prepare')?.textContent).not.toContain(' s')
    })

    it('la de instalar dice cuántos paquetes puso', () => {
      runner.phases.update(phases =>
        phases.map(p => (p.key === 'install' ? { ...p, status: 'running' as const, packages: 1247 } : p))
      )

      expect(at(mount(), 'phase-install')?.textContent).toContain('1247 paquetes')
    })

    it('la de escribir cuenta los ficheros que lleva', () => {
      runner.phases.update(phases =>
        phases.map(p => (p.key === 'write' ? { ...p, status: 'running' as const, files: 320 } : p))
      )

      expect(at(mount(), 'phase-write')?.textContent).toContain('320 ficheros')
    })

    it('la omitida lo dice, en vez de quedarse pendiente para siempre', () => {
      runner.phases.set(initialPhases({ skipInstall: true }))
      const fixture = mount()

      expect(at(fixture, 'phase-install')?.getAttribute('data-state')).toBe('skipped')
      expect(at(fixture, 'phase-install')?.textContent).toContain('omitida')
    })
  })

  describe('la barra', () => {
    /** Fases cumplidas sobre el total: el único avance que se sabe de verdad. */
    it('cuenta fases, no un porcentaje de ficheros inventado', () => {
      runner.phases.update(phases =>
        phases.map(p => (p.key === 'prepare' || p.key === 'write' ? { ...p, status: 'done' as const } : p))
      )
      const fixture = mount()

      expect(at(fixture, 'work-progress')?.getAttribute('aria-valuenow')).toBe('2')
      expect(at(fixture, 'work-progress')?.getAttribute('aria-valuemax')).toBe('4')
      expect(fixture.nativeElement.textContent).toContain('2 de 4')
    })

    it('lo omitido cuenta como resuelto: no va a pasar nada más ahí', () => {
      runner.phases.set(initialPhases({ skipInstall: true }))

      expect(at(mount(), 'work-progress')?.getAttribute('aria-valuenow')).toBe('1')
    })
  })

  describe('el registro técnico', () => {
    it('arranca plegado: es el detalle, no el titular', () => {
      runner.output.set('CREATE apps/x/main.ts')

      expect((at(mount(), 'work-log') as HTMLDetailsElement).open).toBe(false)
    })

    it('se puede desplegar', () => {
      runner.output.set('CREATE apps/x/main.ts')
      const fixture = mount()

      const log = at(fixture, 'work-log') as HTMLDetailsElement
      log.open = true
      fixture.detectChanges()

      expect(log.textContent).toContain('CREATE apps/x/main.ts')
    })

    /** Si algo falla, el motivo está justo ahí: no obligar a buscarlo. */
    it('se abre solo cuando la cosa acaba mal', () => {
      runner.outcome.set('failed')
      runner.output.set('npm ERR! code E404')

      expect((at(mount(), 'work-log') as HTMLDetailsElement).open).toBe(true)
    })

    it('sin salida todavía no hay registro que enseñar', () => {
      expect(at(mount(), 'work-log')).toBeNull()
    })
  })

  describe('el raíl mientras tanto', () => {
    it('enumera lo que el diseño prometía', () => {
      const text = at(mount(), 'work-meanwhile')?.textContent ?? ''

      expect(text).toContain('Prendas')
      expect(text).toContain('Catálogo')
    })

    it('marca lo que ya salió', () => {
      runner.written.update(items => items.map(i => (i.label === 'Prendas' ? { ...i, done: true } : i)))
      const fixture = mount()

      expect(at(fixture, 'written-Prendas')?.getAttribute('data-state')).toBe('done')
      expect(at(fixture, 'written-Catálogo')?.getAttribute('data-state')).toBe('pending')
    })

    it('no promete publicar ni invitar a nadie: eso no existe', () => {
      const text = at(mount(), 'work-meanwhile')?.textContent ?? ''

      expect(text).not.toContain('Invita')
      expect(text).not.toContain('dominio')
      expect(text).not.toContain('correo cuando termine')
    })
  })
})
