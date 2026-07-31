import { EmailSender } from '../../application/ports/email-sender'
import {
  invitationHtml,
  invitationSubject,
  invitationText,
  passwordResetHtml,
  passwordResetSubject,
  passwordResetText
} from './email-templates'

export interface AcsEmailMessage {
  senderAddress: string
  content: { subject: string; html: string; plainText?: string }
  recipients: { to: Array<{ address: string }> }
}

/** Contrato mínimo del cliente — lo satisface EmailClient de @azure/communication-email. */
export interface AcsEmailClient {
  beginSend(message: AcsEmailMessage): Promise<{ pollUntilDone(): Promise<{ status: string }> }>
}

/** Envío real vía Azure Communication Services. */
export class AcsEmailSender extends EmailSender {
  constructor(
    private readonly client: AcsEmailClient,
    private readonly senderAddress: string
  ) {
    super()
  }

  async sendInvitation(email: string, link: string): Promise<void> {
    await this.send(email, invitationSubject, invitationHtml(link), invitationText(link))
  }

  async sendPasswordReset(email: string, link: string): Promise<void> {
    await this.send(email, 'Restablece tu contraseña', passwordResetHtml(link), passwordResetText(link))
  }

  private async send(to: string, subject: string, html: string, plainText: string): Promise<void> {
    const poller = await this.client.beginSend({
      senderAddress: this.senderAddress,
      content: { subject, html, plainText },
      recipients: { to: [{ address: to }] }
    })

    const result = await poller.pollUntilDone()

    if (result.status !== 'Succeeded') {
      throw new Error(`ACS email send failed with status ${result.status}`)
    }
  }
}
