import * as nodemailer from 'nodemailer'
import { AppLogger } from '../../../../../shared/domain/logger/logger'
import { SmtpConfig } from '../../../../../shared/infrastructure/config/config-types'
import { EmailSender } from '../../application/ports/email-sender'
import { LogEmailSender } from './log-email-sender'
import { MailTransport, SmtpEmailSender } from './smtp-email-sender'

/**
 * La sección de config presente decide el adaptador, por precedencia `smtp → log`:
 * - `smtp`: envío real vía un relay SMTP (nodemailer).
 * - ninguna: se loguean los envíos (LogEmailSender), para local y test.
 *
 * Para enviar por un proveedor concreto (Azure Communication Services, SES…), añade
 * su adaptador junto a estos e insértalo aquí: `EmailSender` es el puerto estable.
 */
export function createEmailSender(smtp: SmtpConfig | undefined, logger: AppLogger): EmailSender {
  if (smtp) {
    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure,
      auth: smtp.auth
    }) as unknown as MailTransport

    return new SmtpEmailSender(transporter, smtp.from ?? 'noreply@localhost')
  }

  return new LogEmailSender(logger)
}
