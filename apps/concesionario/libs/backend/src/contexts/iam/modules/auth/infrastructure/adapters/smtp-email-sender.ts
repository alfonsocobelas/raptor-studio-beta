import { EmailSender } from '../../application/ports/email-sender'
import { invitationHtml, invitationText, passwordResetHtml, passwordResetText } from './email-templates'

export interface MailAttachment {
  filename: string
  content: Buffer
  contentType: string
  /** Referenced from the html as `cid:<cid>`, which makes nodemailer inline it. */
  cid: string
}

export interface MailMessage {
  from: string
  to: string
  subject: string
  html: string
  text: string
  attachments?: MailAttachment[]
}

/** Minimal transport contract — satisfied by a nodemailer Transporter. */
export interface MailTransport {
  sendMail(message: MailMessage): Promise<unknown>
}

export class SmtpEmailSender extends EmailSender {
  constructor(
    private readonly transport: MailTransport,
    private readonly from: string
  ) {
    super()
  }

  async sendInvitation(email: string, link: string): Promise<void> {
    await this.send(email, 'Invitación a la aplicación', invitationHtml(link), invitationText(link))
  }

  async sendPasswordReset(email: string, link: string): Promise<void> {
    await this.send(
      email,
      'Restablece tu contraseña de la aplicación',
      passwordResetHtml(link),
      passwordResetText(link)
    )
  }

  private async send(to: string, subject: string, html: string, text: string): Promise<void> {
    await this.transport.sendMail({
      from: this.from,
      to,
      subject,
      html,
      text
    })
  }
}
