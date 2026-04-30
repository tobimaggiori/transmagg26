import nodemailer from "nodemailer"
import { Resend } from "resend"
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
  /** "sistema" envía vía Resend; "usuario" usa SMTP del Usuario. */
  tipo: "sistema" | "usuario"
  /** Requerido cuando tipo === "usuario" */
  usuarioId?: string
  adjuntos?: { nombre: string; contenido: Buffer; tipo: string }[]
}

/**
 * enviarEmail: OpcionesEmail -> Promise<{ ok: boolean; error?: string }>
 *
 * Envía un email. Para tipo "sistema" usa Resend (requiere RESEND_API_KEY).
 * Para tipo "usuario" usa la configuración SMTP del Usuario (dueño del
 * remitente, ej. facturas con su propio dominio).
 * Nunca lanza excepciones — siempre devuelve un resultado.
 *
 * Ejemplos:
 * await enviarEmail({ para: "x@acme.com", asunto: "OTP", html: "<p>123</p>", tipo: "sistema" })
 * // => { ok: true } | { ok: false, error: "Resend no configurado" }
 * await enviarEmail({ para: "x@acme.com", asunto: "Factura", html: "...", tipo: "usuario", usuarioId: "uuid" })
 * // => { ok: true } | { ok: false, error: "Sin configuración SMTP activa" }
 */
export async function enviarEmail(opciones: OpcionesEmail): Promise<{ ok: boolean; error?: string }> {
  if (opciones.tipo === "sistema") {
    return enviarConResend(opciones)
  }
  return enviarConSmtpUsuario(opciones)
}

// ── Resend (tipo "sistema") ─────────────────────────────────────────────────

const RESEND_FROM = "Trans-Magg S.R.L. <auth@transmagg.com.ar>"

async function leerReplyTo(): Promise<string | null> {
  try {
    const cfg = await prisma.configuracionEnvio.findUnique({ where: { id: "singleton" } })
    return cfg?.replyTo ?? null
  } catch {
    return null
  }
}

async function enviarConResend(opciones: OpcionesEmail): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error("[EMAIL RESEND] RESEND_API_KEY no configurada")
    return { ok: false, error: "Resend no configurado (falta RESEND_API_KEY)" }
  }

  const resend = new Resend(apiKey)
  const replyTo = await leerReplyTo()

  console.log(`[EMAIL RESEND] Enviando a ${opciones.para} | from=${RESEND_FROM} | replyTo=${replyTo ?? "—"} | asunto="${opciones.asunto}"`)

  try {
    const { data, error } = await resend.emails.send({
      from: RESEND_FROM,
      to: opciones.para,
      subject: opciones.asunto,
      html: opciones.html,
      text: opciones.texto,
      ...(replyTo ? { replyTo } : {}),
      attachments: opciones.adjuntos?.map((a) => ({
        filename: a.nombre,
        content: a.contenido,
        contentType: a.tipo,
      })),
    })

    if (error) {
      console.error(`[EMAIL RESEND] Rechazado por Resend:`, JSON.stringify(error))
      return { ok: false, error: error.message }
    }

    console.log(`[EMAIL RESEND] OK id=${data?.id} → ${opciones.para}`)
    return { ok: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`[EMAIL RESEND] Excepción:`, msg)
    return { ok: false, error: msg }
  }
}

// ── SMTP por usuario (tipo "usuario") ───────────────────────────────────────

async function enviarConSmtpUsuario(opciones: OpcionesEmail): Promise<{ ok: boolean; error?: string }> {
  if (!opciones.usuarioId) {
    return { ok: false, error: "Falta usuarioId para envío tipo 'usuario'" }
  }

  const u = await prisma.usuario.findUnique({
    where: { id: opciones.usuarioId },
    select: {
      email: true,
      smtpHost: true, smtpPuerto: true, smtpUsuario: true,
      smtpPassword: true, smtpSsl: true, smtpActivo: true,
    },
  }).catch(() => null)

  if (!u?.smtpActivo || !u.smtpHost || !u.smtpPuerto || !u.smtpPassword) {
    console.log(`[EMAIL USUARIO] Sin configuración SMTP activa para usuario ${opciones.usuarioId}`)
    return { ok: false, error: "Sin configuración SMTP activa" }
  }

  const smtpUser = u.smtpUsuario ?? u.email
  const emailRemitente = u.smtpUsuario ?? u.email
  if (!smtpUser || !emailRemitente) {
    return { ok: false, error: "Usuario sin email ni usuario SMTP" }
  }

  let pass: string
  try {
    pass = decrypt(u.smtpPassword)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error("[EMAIL USUARIO] Error descifrando contraseña SMTP:", msg)
    return { ok: false, error: `Error de configuración SMTP: ${msg}` }
  }

  const transporter = nodemailer.createTransport({
    host: u.smtpHost,
    port: u.smtpPuerto,
    secure: u.smtpSsl,
    auth: { user: smtpUser, pass },
    tls: { rejectUnauthorized: false },
  })

  const from = `"Trans-Magg S.R.L." <${emailRemitente}>`

  try {
    const info = await transporter.sendMail({
      from,
      to: opciones.para,
      subject: opciones.asunto,
      text: opciones.texto,
      html: opciones.html,
      attachments: opciones.adjuntos?.map((a) => ({
        filename: a.nombre,
        content: a.contenido,
        contentType: a.tipo,
      })),
    })
    console.log(`[EMAIL USUARIO] Enviado a ${opciones.para}: ${opciones.asunto} — ${info.messageId}`)
    return { ok: true }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error(`[EMAIL USUARIO] Error enviando a ${opciones.para}:`, msg)
    return { ok: false, error: msg }
  }
}
