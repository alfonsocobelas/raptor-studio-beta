import { EmailSender } from '../../application/ports/email-sender'
import { invitationHtml, invitationText, passwordResetHtml, passwordResetText } from './email-templates'

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email'

/**
 * Envío real vía la API HTTP de Brevo (capa gratuita de 300 emails/día).
 * Sin SDK a propósito: la API es un POST JSON y fetch es nativo en Node 18+.
 */
export class BrevoEmailSender extends EmailSender {
  constructor(
    private readonly apiKey: string,
    private readonly from: { email: string; name?: string }
  ) {
    super()
  }

  async sendInvitation(email: string, link: string): Promise<void> {
    await this.send(email, 'Invitación a la aplicación', invitationHtml(link), invitationText(link))
  }

  async sendPasswordReset(email: string, link: string): Promise<void> {
    await this.send(email, 'Restablece tu contraseña', passwordResetHtml(link), passwordResetText(link))
  }

  private async send(to: string, subject: string, htmlContent: string, textContent: string): Promise<void> {
    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: { 'api-key': this.apiKey, 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ sender: this.from, to: [{ email: to }], subject, htmlContent, textContent })
    })

    if (!response.ok) {
      // El cuerpo de error de Brevo trae código y mensaje; se incluye acotado para diagnóstico.
      const detail = (await response.text()).slice(0, 300)
      throw new Error(`Brevo email send failed (${response.status}): ${detail}`)
    }
  }
}
