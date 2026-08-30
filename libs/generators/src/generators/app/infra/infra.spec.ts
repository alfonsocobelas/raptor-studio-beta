import { INFRA, selectInfra } from './registry'
import { SLOTS } from '../plugins/slots'

/**
 * TASK-03 (spec 24): la ranura `infra` pasa de declarar un valor suelto a resolverse por
 * manifiesto, igual que la persistencia. Sin proveedores reales todavía: `none` no emite nada,
 * así que la salida del generador no cambia.
 */
describe('INFRA', () => {
  it('registra un manifiesto por proveedor y cada uno declara su valor', () => {
    expect(Object.keys(INFRA)).toEqual(['none', 'azure', 'aws', 'raptor', 'gcp'])
    for (const [value, provider] of Object.entries(INFRA)) {
      expect(provider.value).toBe(value)
      expect(provider.label.length).toBeGreaterThan(0)
    }
  })

  it('cubre exactamente los proveedores que ofrece la ranura (nada elegible sin manifiesto)', () => {
    expect(SLOTS['infra'].providers.map(provider => provider.value)).toEqual(Object.keys(INFRA))
  })

  it('none no emite nada: ni ficheros, ni dependencias, ni cableado', () => {
    const none = INFRA['none']

    expect(none.files).toBeUndefined()
    expect(none.dependencies).toBeUndefined()
    expect(none.apply).toBeUndefined()
  })
})

describe('selectInfra', () => {
  it('resuelve por valor y cae al default de la ranura sin valor', () => {
    expect(selectInfra('none').value).toBe('none')
    // raptor es la default desde 2026-08-24: toda app sale con nube
    expect(selectInfra(undefined).value).toBe('raptor')
  })

  it('rechaza un proveedor desconocido listando los disponibles', () => {
    expect(() => selectInfra('nube-de-mi-primo')).toThrow(/Unknown infra 'nube-de-mi-primo'.*none, azure, aws, raptor/)
  })
})
