import * as fs from 'fs'
import * as path from 'path'

/**
 * Capa de ficheros del historial de diseños (spec 21): `.studio/designs/` bajo
 * la raíz del acelerador, un JSON por diseño. El slug es la ÚNICA puerta a una
 * ruta (se sanea aquí, en el borde), la escritura es atómica (tmp + rename en
 * el mismo directorio) y un fichero corrupto da error limpio pero JAMÁS se
 * borra: aunque esté roto, es trabajo del usuario.
 */
export interface DesignSummary {
  slug: string
  appName: string
  /** mtime del fichero en ISO; no viaja dentro del JSON */
  updatedAt: string
}

const SLUG = /^[a-z0-9][a-z0-9-]*$/

export function assertSlug(slug: string): void {
  if (!SLUG.test(slug)) {
    throw new Error(`Slug de diseño inválido: '${slug}' (minúsculas, números y guiones; sin rutas)`)
  }
}

export function listDesigns(root: string): DesignSummary[] {
  const dir = designsDir(root)
  if (!fs.existsSync(dir)) return []

  return fs
    .readdirSync(dir)
    .filter(file => file.endsWith('.json'))
    .map(file => {
      const slug = file.slice(0, -'.json'.length)
      const full = path.join(dir, file)
      // un corrupto no tumba la lista: aparece por su slug y se explica al abrirlo
      let appName = slug
      try {
        const parsed = JSON.parse(fs.readFileSync(full, 'utf-8')) as { appName?: string }
        if (typeof parsed.appName === 'string') appName = parsed.appName
      } catch {
        /* se queda el slug como nombre */
      }
      return { slug, appName, updatedAt: fs.statSync(full).mtime.toISOString() }
    })
}

export function readDesign(root: string, slug: string): unknown {
  assertSlug(slug)
  const file = fileOf(root, slug)
  if (!fs.existsSync(file)) {
    throw new Error(`No existe el diseño «${slug}»`)
  }
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8'))
  } catch {
    throw new Error(`El diseño «${slug}» está corrupto; el fichero se conserva en ${file}`)
  }
}

export function writeDesign(root: string, slug: string, design: unknown): void {
  assertSlug(slug)
  const dir = designsDir(root)
  fs.mkdirSync(dir, { recursive: true })
  // atómica: un fallo a mitad deja el tmp, nunca un JSON truncado en la ruta final
  const tmp = path.join(dir, `.${slug}.${process.pid}.tmp`)
  fs.writeFileSync(tmp, JSON.stringify(design, null, 2))
  fs.renameSync(tmp, fileOf(root, slug))
}

export function deleteDesign(root: string, slug: string): void {
  assertSlug(slug)
  fs.rmSync(fileOf(root, slug), { force: true })
}

function designsDir(root: string): string {
  return path.join(root, '.studio', 'designs')
}

function fileOf(root: string, slug: string): string {
  return path.join(designsDir(root), `${slug}.json`)
}
