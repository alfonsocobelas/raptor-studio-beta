import { execFileSync, spawn } from 'child_process'
import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import * as path from 'path'
import {
  killGroup,
  removeIfGenerated,
  shouldRemoveOnCancel
} from '@app/backend/contexts/studio/generate/cancel-cleanup'

/**
 * Cancelar a mitad tiene que dejar el workspace como estaba, y eso implica BORRAR en disco:
 * la operación más peligrosa que hace el estudio. De ahí que la decisión viva en una función
 * aparte y con más tests que código — «¿existía ya?» se pregunta antes de escribir nada, y el
 * destino tiene que caer DENTRO del workspace para tocarlo siquiera.
 */
describe('shouldRemoveOnCancel', () => {
  const workspace = '/Users/yo/acelerador'

  it('borra el directorio que creó esta generación', () => {
    expect(shouldRemoveOnCancel(`${workspace}/apps/mi-app`, workspace, false)).toBe(true)
  })

  it('NO borra lo que ya existía antes: no era nuestro', () => {
    expect(shouldRemoveOnCancel(`${workspace}/apps/mi-app`, workspace, true)).toBe(false)
  })

  it('NO borra el workspace entero, aunque alguien apunte ahí', () => {
    expect(shouldRemoveOnCancel(workspace, workspace, false)).toBe(false)
    expect(shouldRemoveOnCancel(`${workspace}/`, workspace, false)).toBe(false)
  })

  it('NO borra fuera del workspace, ni por la puerta de atrás', () => {
    expect(shouldRemoveOnCancel('/Users/yo/otra-cosa', workspace, false)).toBe(false)
    expect(shouldRemoveOnCancel(`${workspace}/../otra-cosa`, workspace, false)).toBe(false)
    expect(shouldRemoveOnCancel(`${workspace}/apps/../../etc`, workspace, false)).toBe(false)
    expect(shouldRemoveOnCancel('/etc', workspace, false)).toBe(false)
  })

  /** `/Users/yo/aceleradorX` empieza por la ruta del workspace y NO está dentro. */
  it('NO se deja engañar por un vecino con el mismo prefijo', () => {
    expect(shouldRemoveOnCancel('/Users/yo/aceleradorX', workspace, false)).toBe(false)
  })

  it('una ruta vacía no borra nada', () => {
    expect(shouldRemoveOnCancel('', workspace, false)).toBe(false)
  })
})

describe('removeIfGenerated', () => {
  const arrange = (): { workspace: string; target: string } => {
    const workspace = mkdtempSync(path.join(tmpdir(), 'cancel-'))
    const target = path.join(workspace, 'apps', 'mi-app')
    mkdirSync(target, { recursive: true })
    writeFileSync(path.join(target, 'main.ts'), 'export const x = 1')
    return { workspace, target }
  }

  it('se lleva el directorio y lo que hubiera dentro', () => {
    const { workspace, target } = arrange()

    expect(removeIfGenerated(target, workspace, false)).toBe(true)
    expect(existsSync(target)).toBe(false)
  })

  it('deja intacto lo que ya existía', () => {
    const { workspace, target } = arrange()

    expect(removeIfGenerated(target, workspace, true)).toBe(false)
    expect(existsSync(target)).toBe(true)
  })

  /** Cancelar antes de que el generador escriba nada es lo normal, no un error. */
  it('no se queja si el directorio ni llegó a existir', () => {
    const { workspace } = arrange()

    expect(removeIfGenerated(path.join(workspace, 'apps', 'nunca-existio'), workspace, false)).toBe(false)
  })
})

/**
 * El riesgo real de cancelar: `npx nx` lanza a su vez al generador y a npm. Matar solo al
 * padre deja el `npm install` corriendo, escribiendo en un directorio que ya nadie quiere.
 * Este test reproduce esa forma —un proceso con un hijo— y comprueba que no queda NADIE.
 */
describe('killGroup', () => {
  /** Los pids vivos del grupo, leídos del sistema. Vacío si ya no queda ninguno. */
  const alive = (pgid: number): string[] => {
    try {
      return execFileSync('pgrep', ['-g', String(pgid)], { encoding: 'utf-8' })
        .trim()
        .split('\n')
        .filter(Boolean)
    } catch {
      return []
    }
  }

  const settle = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms))

  it('se lleva también a los nietos, no solo al proceso lanzado', async () => {
    // `sh -c 'sleep 30'` haría exec y sería UN proceso; con `& wait` el sh se queda de padre
    const child = spawn('sh', ['-c', 'sleep 30 & wait'], { detached: true, stdio: 'ignore' })
    const pgid = child.pid as number
    await settle(300)
    expect(alive(pgid).length).toBeGreaterThanOrEqual(2)

    killGroup(pgid)
    await settle(500)

    expect(alive(pgid)).toEqual([])
  }, 15000)

  it('cancelar algo que ya terminó no revienta', () => {
    expect(() => killGroup(999999)).not.toThrow()
    expect(() => killGroup(undefined)).not.toThrow()
  })
})
