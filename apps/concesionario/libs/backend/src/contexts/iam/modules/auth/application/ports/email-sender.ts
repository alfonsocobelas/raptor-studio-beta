export abstract class EmailSender {
  abstract sendInvitation(email: string, link: string): Promise<void>
  abstract sendPasswordReset(email: string, link: string): Promise<void>
}
