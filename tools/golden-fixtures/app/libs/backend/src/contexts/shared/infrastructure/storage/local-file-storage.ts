import { Injectable } from '@nestjs/common'
import { mkdir, readFile, rm, writeFile } from 'fs/promises'
import * as path from 'path'
import { FileStoragePort } from '../../domain/storage/file-storage.port'

/**
 * Adapter por defecto: disco local bajo STORAGE_DIR (./storage). Suficiente para
 * desarrollo y despliegues de un solo nodo; para nube se sustituye el provider
 * por el adapter correspondiente sin tocar nada más.
 */
@Injectable()
export class LocalFileStorage extends FileStoragePort {
  private readonly root = process.env['STORAGE_DIR'] ?? path.resolve(process.cwd(), 'storage')

  async upload(key: string, content: Buffer): Promise<void> {
    const target = this.pathOf(key)
    await mkdir(path.dirname(target), { recursive: true })
    await writeFile(target, content)
  }

  download(key: string): Promise<Buffer> {
    return readFile(this.pathOf(key))
  }

  async delete(key: string): Promise<void> {
    await rm(this.pathOf(key), { force: true })
  }

  /** El key lo genera el backend (uuidv7); aun así se confina a la raíz. */
  private pathOf(key: string): string {
    const target = path.resolve(this.root, key)
    if (!target.startsWith(this.root)) {
      throw new Error(`Storage key fuera de la raíz: ${key}`)
    }
    return target
  }
}
