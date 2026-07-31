import { existsSync, readFileSync } from 'fs'
import * as path from 'path'

/**
 * El esqueleto por piel (files-skeleton-ui/<ui>) se copia DESPUÉS del esqueleto
 * compartido y sobrescribe lo que dependa de la librería de componentes.
 *
 * La piel Spartan necesita <hlm-toaster /> montado en el shell: NotificationService
 * llama a toast.success/error (sonner) y sin el toaster los avisos no se ven nunca.
 * La piel Material no necesita montaje (MatSnackBar usa su propio overlay).
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

  it('material reutiliza el shell compartido, que no conoce sonner', () => {
    expect(existsSync(override('material'))).toBe(false)
    const shared = readFileSync(
      path.join(__dirname, 'files-skeleton/apps/frontend-app/src/app.component.ts.template'),
      'utf-8'
    )
    expect(shared).not.toContain('hlm-toaster')
  })
})
