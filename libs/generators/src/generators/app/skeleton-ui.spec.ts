import { existsSync, readFileSync } from 'fs'
import * as path from 'path'

/**
 * El esqueleto por piel (files-skeleton-ui/<ui>) se copia DESPUÉS del esqueleto
 * compartido y sobrescribe lo que dependa de la librería de componentes.
 *
 * La piel Spartan necesita <hlm-toaster /> montado en el shell: NotificationService
 * llama a toast.success/error (sonner) y sin el toaster los avisos no se ven nunca.
 *
 * Spec 36: era también el punto donde spartan y material divergían — ya no hay
 * segunda piel que overridee el esqueleto compartido.
 */
describe('files-skeleton-ui — shell por piel', () => {
  const override = (ui: string) =>
    path.join(__dirname, 'files-skeleton-ui', ui, 'apps/frontend-app/src/app.component.ts.template')

  it('spartan sobrescribe el shell y monta <hlm-toaster />', () => {
    expect(existsSync(override('spartan'))).toBe(true)
    const content = readFileSync(override('spartan'), 'utf-8')
    expect(content).toContain('<hlm-toaster />')
    expect(content).toContain("from '@spartan-ng/helm/sonner'")
    // el toaster se monta fuera del @if de rutas bare: los errores de login también son toasts
    expect(content.indexOf('<hlm-toaster />')).toBeGreaterThan(content.lastIndexOf('@else'))
  })

  it('material está retirada (spec 36): sin carpeta de override', () => {
    expect(existsSync(override('material'))).toBe(false)
  })
})
