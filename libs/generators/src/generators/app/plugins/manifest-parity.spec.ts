import { readFileSync } from 'fs'
import * as path from 'path'
import { renderSlotsManifest } from './manifest'

/**
 * TASK-10 (spec 23): el manifiesto commiteado es lo que consume el estudio. Si el registro
 * cambia y el JSON no, el estudio ofrecería opciones que el generador ya no acepta — así
 * que el desfase es un test rojo, igual que el diff de oro.
 */
describe('tools/slots.json', () => {
  it('está al día respecto al registro de ranuras', () => {
    const committed = readFileSync(path.join(__dirname, '../../../../../../tools/slots.json'), 'utf-8')

    expect(committed).toBe(renderSlotsManifest())
  })
})
