import nodemailer from "nodemailer"

/**
 * crearTransporter: -> Transporter
 *
 * Devuelve un transporter de nodemailer listo para enviar emails,
 * configurado a partir de variables de entorno.
 * Si EMAIL_SERVER existe como URL completa, la usa directamente;
 * si no, ensambla la configuración desde EMAIL_SERVER_HOST/PORT/USER/PASSWORD.
 * Existe para centralizar la configuración SMTP y permitir cambiar
 * el proveedor de email solo modificando variables de entorno.
 *
 * Ejemplos:
 * // Con EMAIL_SERVER="smtp://user:pass@host:587"
 * crearTransporter() // => Transporter configurado con esa URL
 * // Sin EMAIL_SERVER, con EMAIL_SERVER_HOST="smtp.example.com"
 * crearTransporter() // => Transporter con host/port/auth individuales
 * // Sin ninguna variable (desarrollo local)
 * crearTransporter() // => Transporter con smtp.ethereal.email:587
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
 * Existe para notificar al usuario su código de acceso de un solo uso
 * durante el flujo de autenticación sin contraseña de Transmagg.
 * Lanza un error si el servidor SMTP rechaza el envío.
 *
 * Ejemplos:
 * await enviarEmailOtp({ destinatario: "juan@fletero.com", nombre: "Juan", codigo: "042891" })
 * // => void (envía email con asunto "Tu código de acceso Transmagg: 042891")
 * await enviarEmailOtp({ destinatario: "admin@empresa.com", nombre: "Laura", codigo: "123456" })
 * // => void (envía email con código 123456 válido 10 minutos)
 * await enviarEmailOtp({ destinatario: "x", nombre: "N", codigo: "000000" })
 * // => lanza Error si el SMTP falla
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
