/**
 * Shared bodies for the transactional emails, so every EmailSender adapter
 * (SMTP, ACS) renders the exact same content. Pure functions of the link.
 *
 * The markup is deliberately old fashioned — nested tables, inline styles, fixed
 * 600px width — because Outlook renders through the Word engine (no flexbox, no
 * grid) and Gmail discards most of what lives in a <style> block. The logo is a
 * CID attachment rather than a remote URL: clients block remote images by default
 * because they leak tracking, but an embedded attachment carries no such risk and
 * gets painted. Gmail will not render data: URIs either, which rules those out.
 */

/**
 * Sampled from the corporate assets: the band is the navy of the la aplicación dark
 * lockup, and the call to action uses the mid green of the Avvale mark. The band
 * must stay clear of the mark's own darkest teal (#248b7f) — matching it would
 * swallow that arm of the logo into the background.
 */
const BRAND_BAND = '#08202e'
const BRAND_GREEN = '#59af31'

const INK = '#1a1a1a'
const MUTED = '#6b7280'
const CANVAS = '#f6f7f8'
const RULE = '#e5e7eb'

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"

/**
 * An image that travels inside the message and is referenced from the html as
 * `cid:<contentId>`. Adapter agnostic on purpose — each EmailSender maps it to
 * whatever shape its own transport expects.
 */
export interface InlineImage {
  contentId: string
  fileName: string
  contentType: string
  base64: string
}

interface EmailBody {
  /** Shown by the inbox as the preview line next to the subject. */
  preheader: string
  heading: string
  intro: string
  ctaLabel: string
  link: string
  expiry: string
  /** Reassurance for someone who did not ask for this email. */
  disclaimer: string
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function layout(body: EmailBody): string {
  const href = escapeHtml(body.link)

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>la aplicación</title>
</head>
<body style="margin:0; padding:0; background-color:${CANVAS};">
<div style="display:none; max-height:0; overflow:hidden; opacity:0;">${escapeHtml(body.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${CANVAS};">
<tr>
<td align="center" style="padding:24px 12px;">

<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px; max-width:100%; background-color:#ffffff; border-radius:8px; overflow:hidden;">

<tr>
<td style="background-color:${BRAND_BAND}; padding:22px 32px;">
</td>
</tr>

<tr>
<td style="padding:32px;">
<h1 style="margin:0 0 16px 0; font-family:${FONT}; font-size:22px; font-weight:600; color:${INK};">${escapeHtml(body.heading)}</h1>
<p style="margin:0 0 24px 0; font-family:${FONT}; font-size:15px; line-height:1.6; color:${INK};">${escapeHtml(body.intro)}</p>

<table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
<tr>
<td align="center" bgcolor="${BRAND_GREEN}" style="border-radius:6px;">
<a href="${href}" style="display:inline-block; padding:13px 28px; font-family:${FONT}; font-size:15px; font-weight:600; color:#ffffff; text-decoration:none; border-radius:6px;">${escapeHtml(body.ctaLabel)}</a>
</td>
</tr>
</table>

<p style="margin:24px 0 0 0; font-family:${FONT}; font-size:13px; color:${MUTED}; text-align:center;">${escapeHtml(body.expiry)}</p>

<hr style="border:none; border-top:1px solid ${RULE}; margin:24px 0;">

<p style="margin:0 0 8px 0; font-family:${FONT}; font-size:12px; color:${MUTED};">&iquest;El bot&oacute;n no funciona? Copia esta direcci&oacute;n en tu navegador:</p>
<p style="margin:0; font-family:${FONT}; font-size:12px; color:${MUTED}; word-break:break-all;">${href}</p>
</td>
</tr>

<tr>
<td style="background-color:${CANVAS}; padding:20px 32px; border-top:1px solid ${RULE};">
<p style="margin:0 0 4px 0; font-family:${FONT}; font-size:12px; color:${MUTED};">la aplicación &middot; una solución de Avvale</p>
<p style="margin:0; font-family:${FONT}; font-size:12px; color:${MUTED};">Correo autom&aacute;tico, no respondas a este mensaje. ${escapeHtml(body.disclaimer)}</p>
</td>
</tr>

</table>

</td>
</tr>
</table>
</body>
</html>`
}

export function invitationHtml(link: string): string {
  return layout({
    preheader: 'Establece tu contraseña para acceder a la aplicación.',
    heading: 'Te damos la bienvenida a la aplicación',
    intro: 'Has sido invitado al portal de gestión de licencias SAP de Avvale. Para empezar, establece tu contraseña.',
    ctaLabel: 'Establecer contraseña',
    link,
    expiry: 'Este enlace caduca en 48 horas.',
    disclaimer: 'Si no esperabas esta invitación, puedes ignorar este correo.'
  })
}

export function passwordResetHtml(link: string): string {
  return layout({
    preheader: 'Restablece la contraseña de tu cuenta de la aplicación.',
    heading: 'Restablece tu contraseña',
    intro:
      'Solicitaste restablecer la contraseña de tu cuenta de la aplicación. Elige una nueva desde el siguiente enlace.',
    ctaLabel: 'Restablecer contraseña',
    link,
    expiry: 'Este enlace caduca en 1 hora.',
    disclaimer: 'Si no solicitaste el cambio, ignora este correo: tu contraseña seguirá siendo la misma.'
  })
}

export function invitationText(link: string): string {
  return [
    'Te damos la bienvenida a la aplicación',
    '',
    'Has sido invitado al portal de gestión de licencias SAP de Avvale.',
    'Establece tu contraseña desde esta dirección:',
    link,
    '',
    'Este enlace caduca en 48 horas.',
    'Si no esperabas esta invitación, puedes ignorar este correo.',
    '',
    'la aplicación - una solución de Avvale',
    'Correo automático, no respondas a este mensaje.'
  ].join('\n')
}

export function passwordResetText(link: string): string {
  return [
    'Restablece tu contraseña de la aplicación',
    '',
    'Solicitaste restablecer la contraseña de tu cuenta.',
    'Elige una nueva desde esta dirección:',
    link,
    '',
    'Este enlace caduca en 1 hora.',
    'Si no solicitaste el cambio, ignora este correo: tu contraseña seguirá siendo la misma.',
    '',
    'la aplicación - una solución de Avvale',
    'Correo automático, no respondas a este mensaje.'
  ].join('\n')
}
