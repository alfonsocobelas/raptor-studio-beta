import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TestBed } from '@angular/core/testing'
import { GenerateRunner } from './generate-runner'
import { GenerateWorkComponent } from './generate-work.component'
import { applyEvent, EXPECTED_INSTALL_MS, initialPhases } from './generate-phases'
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
      expect(at(fixture, 'phase-install')).not.toBeNull()
      // «Ajustando la configuración» ya no existe: no se encendía nunca (log del 2026-08-13)
      expect(at(fixture, 'phase-configure')).toBeNull()
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

    /**
     * Un icono quieto durante los dos minutos que dura instalar se lee como «colgado». El
     * spinner es la única parte de la fila que dice, sin leer nada, que algo se mueve.
     */
    it('la que está en curso gira; las demás llevan su marca quieta', () => {
      runner.phases.update(phases =>
        phases.map(p => (p.key === 'write' ? { ...p, status: 'running' as const, startedAt: 0 } : p))
      )
      const fixture = mount()

      expect(at(fixture, 'phase-write')?.querySelector('[data-testid="phase-spinner"]')).not.toBeNull()
      expect(at(fixture, 'phase-install')?.querySelector('[data-testid="phase-spinner"]')).toBeNull()
    })

    /** Pulsar y no ver nada era el peor momento de la pantalla: ahora la primera ya trabaja. */
    it('nada más arrancar, la primera fase ya está en curso y girando', () => {
      runner.phases.set(initialPhases({ skipInstall: false, startedAt: Date.now() }))
      const fixture = mount()

      expect(at(fixture, 'phase-prepare')?.getAttribute('data-state')).toBe('running')
      expect(at(fixture, 'phase-prepare')?.querySelector('[data-testid="phase-spinner"]')).not.toBeNull()
    })

    it('la cumplida enseña lo que tardó', () => {
      runner.phases.update(phases =>
        phases.map(p => (p.key === 'prepare' ? { ...p, status: 'done' as const, elapsedMs: 4200 } : p))
      )

      expect(at(mount(), 'phase-prepare')?.textContent).toContain('4 s')
    })

    /** Durante los dos minutos de la instalación el número tiene que MOVERSE. */
    it('la que está en curso cronometra en vivo', () => {
      vi.useFakeTimers()
      runner.phases.set(applyEvent(initialPhases({ skipInstall: false }), { phase: 'install' }, Date.now()))
      const fixture = mount()

      vi.advanceTimersByTime(3000)
      fixture.detectChanges()
      expect(at(fixture, 'phase-install')?.textContent).toContain('3 s')

      vi.advanceTimersByTime(4000)
      fixture.detectChanges()
      expect(at(fixture, 'phase-install')?.textContent).toContain('7 s')
      vi.useRealTimers()
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

  /**
   * Spec 75: las fases post-install cuentan lo suyo en su fila — huecos rellenos,
   * comprobaciones en verde, huecos reparados. Sin datos aún, el hint de siempre.
   */
  describe('los detalles de las fases post-install (spec 75)', () => {
    it('la fila del relleno cuenta rellenos y rechazados', () => {
      runner.slotStates.set([
        { id: 'flow-a', status: 'filled' },
        { id: 'flow-b', status: 'rejected', reason: 'gate en rojo' },
        { id: 'flow-c', status: 'proposing' }
      ])

      const detail = at(mount(), 'phase-fill')?.textContent ?? ''

      expect(detail).toContain('1 de 3 huecos rellenos')
      expect(detail).toContain('1 rechazado')
    })

    it('sin huecos contados, la fila del relleno explica para qué sirve', () => {
      runner.slotStates.set([])

      expect(at(mount(), 'phase-fill')?.textContent).toContain('puente')
    })

    it('la fila de validación enseña cada comprobación con su marca', () => {
      runner.checks.set([
        { name: 'typecheck', status: 'ok' },
        { name: 'unit', status: 'running' }
      ])

      const detail = at(mount(), 'phase-validate')?.textContent ?? ''

      expect(detail).toContain('typecheck ✓')
      expect(detail).toContain('unit ◐')
    })

    it('una comprobación en rojo lleva su cruz', () => {
      runner.checks.set([{ name: 'unit', status: 'failed' }])

      expect(at(mount(), 'phase-validate')?.textContent).toContain('unit ✕')
    })

    it('la fila de reparación cuenta lo reparado', () => {
      runner.repaired.set(['flow-a', 'flow-b'])

      expect(at(mount(), 'phase-repair')?.textContent).toContain('2 huecos reparados')
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
      expect(at(fixture, 'work-progress')?.getAttribute('aria-valuemax')).toBe('6')
      expect(fixture.nativeElement.textContent).toContain('2 de 6')
    })

    /**
     * Instalar es el 90% del reloj y no da progreso: si la barra solo contara fases cerradas,
     * se quedaría clavada justo en el tramo largo. Avanza con la estimación medida.
     */
    it('avanza DENTRO de la fase en curso, no solo al cerrarla', () => {
      vi.useFakeTimers()
      const started = Date.now()
      runner.phases.set(applyEvent(initialPhases({ skipInstall: false }), { phase: 'install' }, started))
      const fixture = mount()
      const bar = () => (at(fixture, 'work-progress')?.firstElementChild as HTMLElement).style.width

      const atStart = bar()
      vi.advanceTimersByTime(EXPECTED_INSTALL_MS / 2)
      fixture.detectChanges()

      // dos fases cerradas de seis, más media fase instalando
      expect(parseFloat(bar())).toBeCloseTo(((2 + 0.5) / 6) * 100, 0)
      expect(parseFloat(bar())).toBeGreaterThan(parseFloat(atStart))
      vi.useRealTimers()
    })

    it('lo omitido cuenta como resuelto: no va a pasar nada más ahí', () => {
      runner.phases.set(initialPhases({ skipInstall: true }))

      // sin instalar se omite también todo lo post-install (spec 75): 4 filas resueltas
      expect(at(mount(), 'work-progress')?.getAttribute('aria-valuenow')).toBe('4')
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
