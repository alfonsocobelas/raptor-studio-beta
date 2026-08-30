import { readFileSync } from 'fs'
import * as path from 'path'
import { processFiles } from './pending-slots'

/**
 * Los huecos flow-* YA rellenos cuyo fichero cita la salida de un fallo de validación
 * (spec 75): son los únicos candidatos a reparación. La cita es por basename —
 * suficiente para acotar, y un falso positivo solo gasta una propuesta bajo gate.
 * Sin sospechosos, el rojo es del código canónico: defecto del generador, jamás se
 * parchea a mano («las demos detectan, no se parchean»).
 */
const FLOW_SLOT = /\/\/ @ai:begin (flow-[a-z0-9-]+)[^\n]*\n([\s\S]*?)^[ \t]*\/\/ @ai:end/gm

export function implicatedSlotIds(root: string, failureOutput: string): string[] {
  const suspects: string[] = []
  for (const file of processFiles(root)) {
    if (!failureOutput.includes(path.basename(file))) continue
    const source = readFileSync(file, 'utf-8')
    for (const match of source.matchAll(FLOW_SLOT)) {
      if (match[2].trim() !== '') suspects.push(match[1])
    }
  }
  return suspects
}
