import { existsSync, rmSync } from 'fs'
import * as path from 'path'

/**
 * Cancelar a mitad debe dejar el workspace como estaba, y para eso hay que BORRAR en disco —la
 * operación más peligrosa que hace el estudio—. La decisión vive aquí, sola y probada, con dos
 * condiciones que se cumplen las dos o no se toca nada:
 *
 *   1. el directorio lo creó ESTA generación (se pregunta antes de escribir nada: después ya
 *      es indistinguible de uno que llevara ahí un año),
 *   2. y cae DENTRO del workspace, comparando rutas resueltas y no prefijos de texto
 *      (`…/aceleradorX` empieza por `…/acelerador` y no está dentro).
 */
export function shouldRemoveOnCancel(target: string, workspaceRoot: string, existedBefore: boolean): boolean {
  if (existedBefore || !target.trim()) {
    return false
  }
  const relative = path.relative(path.resolve(workspaceRoot), path.resolve(target))
  // vacío = es el propio workspace; empezar por `..` = se sale; absoluto = otra raíz
  return relative !== '' && !relative.startsWith('..') && !path.isAbsolute(relative)
}

/**
 * Mata al generador y a su descendencia. `npx nx` lanza a su vez al generador y a npm, así que
 * un SIGTERM al padre dejaría el `npm install` corriendo huérfano: se manda al GRUPO entero
 * (pid negativo), que es para lo que el proceso se lanzó con `detached`.
 */
export function killGroup(pid: number | undefined): void {
  if (!pid) {
    return
  }
  try {
    process.kill(-pid, 'SIGTERM')
  } catch {
    // el grupo ya había terminado por su cuenta: cancelar lo ya acabado no es un error
  }
}

/** Borra el destino si —y solo si— procede. Devuelve si llegó a borrar algo. */
export function removeIfGenerated(target: string, workspaceRoot: string, existedBefore: boolean): boolean {
  if (!shouldRemoveOnCancel(target, workspaceRoot, existedBefore) || !existsSync(target)) {
    // cancelar antes de que el generador escriba nada es lo normal, no un fallo
    return false
  }
  rmSync(target, { recursive: true, force: true })
  return true
}
