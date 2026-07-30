import { Injectable } from '@nestjs/common'
import { AppLogger } from '../../../../../shared/domain/logger/logger'
import { EmailSender } from '../../application/ports/email-sender'

/**
 * Fallback sin SMTP configurado: loguea en vez de enviar. El sanitizador del
 * AppLogger enmascara el token del enlace — para probar el flujo completo de
 * emails hay que configurar la sección `smtp` (p. ej. contra Mailtrap).
 */
@Injectable()
export class LogEmailSender extends EmailSender {
  private static readonly CONTEXT = LogEmailSender.name

  constructor(private readonly logger: AppLogger) {
    super()
  }

  async sendInvitation(email: string, link: string): Promise<void> {
    this.logger.log(`[invitation] to=${email} link=${link}`, LogEmailSender.CONTEXT)
  }

  async sendPasswordReset(email: string, link: string): Promise<void> {
    this.logger.log(`[password-reset] to=${email} link=${link}`, LogEmailSender.CONTEXT)
  }
}
