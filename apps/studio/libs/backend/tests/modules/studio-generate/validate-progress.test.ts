import { VALIDATION_CHECKS } from '@app/backend/contexts/studio/generate/validate-progress'

/**
 * Spec 75 TASK-03: el catálogo de comprobaciones de la fase «Validando la app». Son los
 * comandos que la propia app emitida declara en su package.json (skeleton del generador);
 * la integración queda fuera a propósito: exige base de datos y la obra no tiene Docker.
 */
describe('VALIDATION_CHECKS', () => {
  it('valida typecheck, suite unitaria backend y suite frontend, en ese orden', () => {
    expect(VALIDATION_CHECKS.map(check => check.name)).toEqual(['typecheck', 'unit', 'front'])
  })

  it('cada comprobación corre un script que la app emitida declara de sí misma', () => {
    expect(VALIDATION_CHECKS.map(check => [check.command, ...check.args].join(' '))).toEqual([
      'npm run typecheck',
      'npm test',
      'npm run test:front'
    ])
  })

  it('la integración NO está en el catálogo: sin Docker no hay base de datos que arrancar', () => {
    const commands = VALIDATION_CHECKS.map(check => check.args.join(' '))
    expect(commands.some(command => command.includes('integration'))).toBe(false)
  })

  it('cada comprobación lleva etiqueta legible para la fila de la obra', () => {
    for (const check of VALIDATION_CHECKS) {
      expect(check.label.length).toBeGreaterThan(3)
    }
  })
})
