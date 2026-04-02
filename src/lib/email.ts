import nodemailer from "nodemailer"
import { prisma } from "@/lib/prisma"
import { decrypt } from "@/lib/crypto"

export interface OpcionesEmail {
  /** Destinatario */
  para: string
  /** Asunto del email */
  asunto: string
  /** Cuerpo HTML */
  html: string
  /** Cuerpo texto plano (opcional) */
  texto?: string
  /** "sistema" usa ConfiguracionOtp; "usuario" usa config SMTP del Usuario */
  tipo: "sistema" | "usuario"
  /** Requerido cuando tipo === "usuario" */
  usuarioId?: string
  attachments?: { filename: string; content: Buffer; contentType: string }[]
}

/**
 * enviarEmail: OpcionesEmail -> Promise<{ ok: boolean; error?: string }>
 *
 * Envía un email usando la configuración SMTP del sistema (ConfiguracionOtp singleton)
 * o del usuario (campos smtpHost/etc. en Usuario), según `tipo`.
 * Nunca lanza excepciones — siempre devuelve un resultado.
 * Si no hay configuración activa, loguea el fallback y devuelve ok: false.
 *
 * Ejemplos:
 * await enviarEmail({ para: "x@acme.com", asunto: "Test", html: "<p>Hola</p>", tipo: "sistema" })
 * // => { ok: true } | { ok: false, error: "..." }
 * await enviarEmail({ para: "x@acme.com", asunto: "OP", html: "...", tipo: "usuario", usuarioId: "uuid" })
 * // => { ok: true } | { ok: false, error: "Sin configuración SMTP activa" }
 */
export async function enviarEmail(opciones: OpcionesEmail): Promise<{ ok: boolean; error?: string }> {
  let host: string | null = null
  let puerto: number | null = null
  let smtpUser: string | null = null
  let passwordEncrypted: string | null = null
  let usarSsl = true
  let emailRemitente: string | null = null
  let nombreRemitente = "Trans-Magg S.R.L."

  if (opciones.tipo === "sistema") {
    const config = await prisma.configuracionOtp.findUnique({
      where: { id: "singleton" },
      select: {
        host: true, puerto: true, usuario: true, passwordHash: true,
        usarSsl: true, emailRemitente: true, nombreRemitente: true, activo: true,
      },
    }).catch(() => null)
    if (config?.activo && config.host && config.passwordHash) {
      host = config.host
      puerto = config.puerto
      smtpUser = config.usuario
      passwordEncrypted = config.passwordHash
      usarSsl = config.usarSsl
      emailRemitente = config.emailRemitente
      nombreRemitente = config.nombreRemitente ?? "Trans-Magg S.R.L."
    }
  } else if (opciones.tipo === "usuario" && opciones.usuarioId) {
    const u = await prisma.usuario.findUnique({
      where: { id: opciones.usuarioId },
      select: {
        email: true,
        smtpHost: true, smtpPuerto: true, smtpUsuario: true,
        smtpPassword: true, smtpSsl: true, smtpActivo: true,
      },
    }).catch(() => null)
    if (u?.smtpActivo && u.smtpHost && u.smtpPassword) {
      host = u.smtpHost
      puerto = u.smtpPuerto
      smtpUser = u.smtpUsuario ?? u.email
      passwordEncrypted = u.smtpPassword
      usarSsl = u.smtpSsl
      emailRemitente = u.smtpUsuario ?? u.email
    }
  }

  if (!host || !puerto || !smtpUser || !passwordEncrypted || !emailRemitente) {
    console.log(`[EMAIL FALLBACK] Para: ${opciones.para} | Asunto: ${opciones.asunto}`)
    console.log(`[EMAIL FALLBACK] Sin configuración SMTP activa para tipo="${opciones.tipo}"`)
    return { ok: false, error: "Sin configuración SMTP activa" }
  }

  let pass: string
  try {
    pass = decrypt(passwordEncrypted)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error("[EMAIL] Error descifrando contraseña SMTP:", msg)
    return { ok: false, error: `Error de configuración SMTP: ${msg}` }
  }

  const transporter = nodemailer.createTransport({
    host,
    port: puerto,
    secure: usarSsl,
    auth: { user: smtpUser, pass },
    tls: { rejectUnauthorized: false },
  })

  const from = `"${nombreRemitente}" <${emailRemitente}>`

  try {
    const info = await transporter.sendMail({
      from,
      to: opciones.para,
      subject: opciones.asunto,
      text: opciones.texto,
      html: opciones.html,
      attachments: opciones.attachments?.map((a) => ({
        filename: a.filename,
        content: a.content,
        contentType: a.contentType,
      })),
    })
    console.log(`[EMAIL] Enviado a ${opciones.para}: ${opciones.asunto} — ${info.messageId}`)
    return { ok: true }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error(`[EMAIL] Error enviando a ${opciones.para}:`, msg)
    return { ok: false, error: msg }
  }
}
