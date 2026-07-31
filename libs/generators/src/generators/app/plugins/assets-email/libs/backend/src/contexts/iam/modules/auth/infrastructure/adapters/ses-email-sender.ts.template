import { EmailSender } from '../../application/ports/email-sender'
import {
  invitationHtml,
  invitationSubject,
  invitationText,
  passwordResetHtml,
  passwordResetSubject,
  passwordResetText
} from './email-templates'

export interface SesSendCommand {
  Source: string
  Destination: { ToAddresses: string[] }
  Message: {
    Subject: { Data: string }
    Body: { Html: { Data: string }; Text: { Data: string } }
  }
}

/** Contrato mínimo del cliente — lo satisface SESClient + SendEmailCommand de @aws-sdk/client-ses. */
export interface SesClient {
  sendEmail(command: SesSendCommand): Promise<unknown>
}

/** Envío real vía Amazon SES. */
export class SesEmailSender extends EmailSender {
  constructor(
    private readonly client: SesClient,
    private readonly from: string
  ) {
    super()
  }

  async sendInvitation(email: string, link: string): Promise<void> {
    await this.send(email, invitationSubject, invitationHtml(link), invitationText(link))
  }

  async sendPasswordReset(email: string, link: string): Promise<void> {
    await this.send(email, 'Restablece tu contraseña', passwordResetHtml(link), passwordResetText(link))
  }

  private async send(to: string, subject: string, html: string, text: string): Promise<void> {
    await this.client.sendEmail({
      Source: this.from,
      Destination: { ToAddresses: [to] },
      Message: {
        Subject: { Data: subject },
        Body: { Html: { Data: html }, Text: { Data: text } }
      }
    })
  }
}
