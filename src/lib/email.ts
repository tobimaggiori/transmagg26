import nodemailer from "nodemailer"
import { prisma } from "@/lib/prisma"
import { decrypt } from "@/lib/crypto"

/**
 * crearTransporter: -> Transporter
 *
 * Devuelve un transporter de nodemailer listo para enviar emails,
 * configurado a partir de variables de entorno.
 * Si EMAIL_SERVER existe como URL completa, la usa directamente;
 * si no, ensambla la configuración desde EMAIL_SERVER_HOST/PORT/USER/PASSWORD.
 */
function crearTransporter() {
  if (process.env.EMAIL_SERVER) {
    return nodemailer.createTransport(process.env.EMAIL_SERVER)
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST ?? "smtp.ethereal.email",
    port: parseInt(process.env.EMAIL_SERVER_PORT ?? "587", 10),
    secure: false,
    auth: {
      user: process.env.EMAIL_SERVER_USER ?? "",
      pass: process.env.EMAIL_SERVER_PASSWORD ?? "",
    },
  })
}

interface EnviarOtpParams {
  destinatario: string
  nombre: string
  codigo: string
}

/**
 * enviarEmailOtp: EnviarOtpParams -> Promise<void>
 *
 * Dados el email del destinatario, su nombre y el código OTP,
 * envía un email transaccional con el código formateado en texto y HTML.
 */
export async function enviarEmailOtp({
  destinatario,
  nombre,
  codigo,
}: EnviarOtpParams): Promise<void> {
  if (process.env.NODE_ENV === "development") {
    console.log(`[OTP DEV] Email: ${destinatario} | Código: ${codigo}`)
    return
  }

  const transporter = crearTransporter()
  const from = process.env.EMAIL_FROM ?? "noreply@transmagg.com.ar"

  await transporter.sendMail({
    from,
    to: destinatario,
    subject: `Tu código de acceso Transmagg: ${codigo}`,
    text: `
Hola ${nombre},

Tu código de acceso a Transmagg es: ${codigo}

Este código es válido por 10 minutos.

Si no solicitaste este código, ignorá este mensaje.

--
Transmagg - Sistema de Gestión de Transporte
`.trim(),
    html: `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #1a1a1a;">Tu código de acceso a Transmagg</h2>
  <p>Hola <strong>${nombre}</strong>,</p>
  <p>Tu código de acceso es:</p>
  <div style="background: #f4f4f5; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0;">
    <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #1a1a1a;">${codigo}</span>
  </div>
  <p style="color: #666; font-size: 14px;">Este código es válido por <strong>10 minutos</strong>.</p>
  <p style="color: #666; font-size: 14px;">Si no solicitaste este código, ignorá este mensaje.</p>
  <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;">
  <p style="color: #999; font-size: 12px;">Transmagg - Sistema de Gestión de Transporte</p>
</body>
</html>
`.trim(),
  })
}

export interface OpcionesEmail {
  to: string
  subject: string
  text: string
  html: string
  attachments?: { filename: string; content: Buffer; contentType: string }[]
}

export class SmtpNoConfiguradoError extends Error {
  constructor() {
    super("El usuario no tiene SMTP configurado")
    this.name = "SmtpNoConfiguradoError"
  }
}

/**
 * enviarEmail: (usuarioId: string, opciones: OpcionesEmail) -> Promise<void>
 *
 * Envía un email usando la configuración SMTP del usuario indicado.
 * Descifra la contraseña SMTP almacenada en base de datos.
 * Lanza SmtpNoConfiguradoError si el usuario no tiene SMTP activo.
 *
 * Ejemplos:
 * await enviarEmail("usr_123", { to: "cliente@empresa.com", subject: "OP #42", text: "...", html: "..." })
 * // => void (envía desde la cuenta SMTP del usuario)
 */
export async function enviarEmail(usuarioId: string, opciones: OpcionesEmail): Promise<void> {
  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: {
      email: true,
      smtpHost: true,
      smtpPuerto: true,
      smtpUsuario: true,
      smtpPassword: true,
      smtpSsl: true,
      smtpActivo: true,
    },
  })

  if (!usuario || !usuario.smtpActivo || !usuario.smtpHost || !usuario.smtpPassword) {
    throw new SmtpNoConfiguradoError()
  }

  const password = decrypt(usuario.smtpPassword)

  const transporter = nodemailer.createTransport({
    host: usuario.smtpHost,
    port: usuario.smtpPuerto ?? 587,
    secure: usuario.smtpSsl,
    auth: {
      user: usuario.smtpUsuario ?? usuario.email,
      pass: password,
    },
  })

  const from = usuario.smtpUsuario ?? usuario.email

  await transporter.sendMail({
    from,
    ...opciones,
  })
}
