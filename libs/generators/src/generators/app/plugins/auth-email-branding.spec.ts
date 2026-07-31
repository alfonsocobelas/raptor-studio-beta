import { Tree } from '@nx/devkit'
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import { readFileSync } from 'fs'
import * as path from 'path'
import { authPlugin } from './auth.plugin'
import type { PluginContext } from './plugin'

const ADAPTERS = 'libs/backend/src/contexts/iam/modules/auth/infrastructure/adapters'

const context: PluginContext = {
  root: 'apps/demo',
  appName: 'demo',
  backendSrc: 'apps/demo/libs/backend/src',
  frontendSrc: 'apps/demo/libs/frontend/src',
  models: [],
  scope: '@app'
}

describe('emails transaccionales — nombre de producto', () => {
  const templatesAsset = readFileSync(
    path.join(__dirname, 'assets-auth', ADAPTERS, 'email-templates.ts.template'),
    'utf-8'
  )

  it('la plantilla concentra el nombre en PRODUCT_NAME (sin literales sueltos ni copy de la referencia)', () => {
    expect(templatesAsset).toContain("export const PRODUCT_NAME = 'la aplicación'")
    expect(templatesAsset).toContain('export const invitationSubject')
    expect(templatesAsset).toContain('export const passwordResetSubject')
    // el copy del proyecto de referencia no debe filtrarse a las apps generadas
    expect(templatesAsset).not.toContain('licencias SAP')
    // fuera de la declaración de PRODUCT_NAME no queda ningún literal hardcodeado
    const body = templatesAsset.replace("export const PRODUCT_NAME = 'la aplicación'", '')
    expect(body).not.toContain('la aplicación')
  })

  it.each(['smtp-email-sender', 'log-email-sender'])('%s toma los asuntos de email-templates', sender => {
    const source = readFileSync(path.join(__dirname, 'assets-auth', ADAPTERS, `${sender}.ts.template`), 'utf-8')
    expect(source).not.toContain('Invitación a la aplicación')
  })

  it.each(['acs-email-sender', 'ses-email-sender', 'brevo-email-sender'])(
    '%s toma los asuntos de email-templates',
    sender => {
      const source = readFileSync(path.join(__dirname, 'assets-email', ADAPTERS, `${sender}.ts.template`), 'utf-8')
      expect(source).not.toContain('Invitación a la aplicación')
      expect(source).toContain('invitationSubject')
    }
  )

  it('el plugin auth marca PRODUCT_NAME con el nombre de la app', () => {
    const tree: Tree = createTreeWithEmptyWorkspace()
    tree.write(`apps/demo/${ADAPTERS}/email-templates.ts`, "export const PRODUCT_NAME = 'la aplicación'\n")

    authPlugin.apply?.(tree, context)

    const branded = tree.read(`apps/demo/${ADAPTERS}/email-templates.ts`, 'utf-8') ?? ''
    expect(branded).toContain("export const PRODUCT_NAME = 'Demo'")
    expect(branded).not.toContain('la aplicación')
  })
})
