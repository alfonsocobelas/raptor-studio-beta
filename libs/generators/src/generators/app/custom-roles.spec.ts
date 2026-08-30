import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import type { Tree } from '@nx/devkit'
import { writeFileSync, mkdtempSync } from 'fs'
import { tmpdir } from 'os'
import * as path from 'path'
import { appGenerator } from './app'

/**
 * Spec 76 (TASK-04): los roles declarados en el app-schema aterrizan en TODOS los
 * puntos IAM del emitido — enum, VO, union de tipos, CHECK SQL, seed local y
 * etiquetas/badges — y sin roles declarados el output es el literal de siempre.
 */
describe('app generator — roles personalizados en la emisión IAM (spec 76)', () => {
  const snapshot = async (options: Parameters<typeof appGenerator>[1]): Promise<Map<string, string>> => {
    const tree: Tree = createTreeWithEmptyWorkspace()
    await appGenerator(tree, options)
    const files = new Map<string, string>()
    for (const change of tree.listChanges()) {
      files.set(change.path, change.content?.toString('utf-8') ?? '')
    }
    return files
  }

  const writeAppJson = (content: unknown): string => {
    const dir = mkdtempSync(path.join(tmpdir(), 'roles-'))
    const file = path.join(dir, 'cliente.app.json')
    writeFileSync(file, JSON.stringify(content))
    return file
  }

  const appWithRoles = (roles?: unknown): unknown => ({
    schemaVersion: 1,
    name: 'demo',
    pages: [{ kind: 'resource', resource: 'contract' }],
    ...(roles ? { roles } : {})
  })

  const at = (files: Map<string, string>, suffix: string): string => {
    const match = [...files.keys()].find(f => f.endsWith(suffix))
    if (!match) throw new Error(`No emitted file ends with ${suffix}`)
    return files.get(match) ?? ''
  }

  it('un rol declarado aterriza en enum, VO, union, CHECK, seed y etiquetas', async () => {
    const file = writeAppJson(
      appWithRoles([
        { name: 'perito', label: 'Perito' },
        { name: 'back-office', label: 'Back office' }
      ])
    )

    const files = await snapshot({ name: 'demo', appFile: file, skipInstall: true })

    expect(at(files, 'shared/domain/src/auth/auth-enums.ts')).toContain("PERITO = 'perito'")
    expect(at(files, 'shared/domain/src/auth/auth-enums.ts')).toContain("BACK_OFFICE = 'back-office'")
    expect(at(files, 'auth/domain/value-objects/user-role.vo.ts')).toContain(
      "['admin', 'user', 'viewer', 'perito', 'back-office']"
    )
    expect(at(files, 'auth/domain/auth-types.ts')).toContain(
      "'admin' | 'user' | 'viewer' | 'perito' | 'back-office'"
    )
    expect(at(files, '1790000001000-CreateIamAuth.ts')).toContain(
      "role IN ('admin', 'user', 'viewer', 'perito', 'back-office')"
    )
    expect(at(files, 'auth/infrastructure/seed/local-seed.ts')).toContain(
      "{ email: 'perito@app.local', name: 'Perito Local', role: 'perito' }"
    )
    expect(at(files, 'domains/iam/iam-labels.ts')).toContain("[UserRoleEnum.PERITO]: 'Perito'")
    expect(at(files, 'domains/iam/iam-labels.ts')).toContain("'back-office': 'outline'")
  }, 180000)

  it('sin roles declarados, los puntos IAM conservan el literal de siempre', async () => {
    const files = await snapshot({ name: 'demo', appFile: writeAppJson(appWithRoles()), skipInstall: true })

    expect(at(files, 'shared/domain/src/auth/auth-enums.ts')).toContain(
      "export enum UserRoleEnum {\n  ADMIN = 'admin',\n  USER = 'user',\n  VIEWER = 'viewer'\n}"
    )
    expect(at(files, 'auth/domain/value-objects/user-role.vo.ts')).toContain("['admin', 'user', 'viewer']")
    expect(at(files, '1790000001000-CreateIamAuth.ts')).toContain("role IN ('admin', 'user', 'viewer')")
    expect(at(files, 'auth/infrastructure/seed/local-seed.ts')).not.toContain('perito')
  }, 180000)
})
