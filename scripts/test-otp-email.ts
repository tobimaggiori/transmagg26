/**
 * Script de prueba para verificar la configuración SMTP de OTP.
 * Lee la configuración desde la BD, descifra la contraseña y envía un mail de prueba.
 *
 * Uso:
 *   npx tsx scripts/test-otp-email.ts
 */

import { prisma } from "../src/lib/prisma"
import { decrypt } from "../src/lib/crypto"
import nodemailer from "nodemailer"

async function main() {
  const config = await prisma.configuracionOtp.findUnique({
    where: { id: "singleton" },
  })

  if (!config || !config.activo || !config.host) {
    console.error("❌ No hay configuración OTP activa en la BD")
    if (config) {
      console.error("   activo:", config.activo, "| host:", config.host)
    }
    process.exit(1)
  }

  if (!config.passwordHash) {
    console.error("❌ La configuración OTP no tiene contraseña guardada")
    process.exit(1)
  }

  console.log("✓ Configuración encontrada:", config.host, config.puerto)

  let pass: string
  try {
    pass = decrypt(config.passwordHash)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error("❌ Error al descifrar la contraseña:", msg)
    process.exit(1)
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.puerto!,
    secure: config.usarSsl,
    auth: {
      user: config.usuario!,
      pass,
    },
    tls: {
      rejectUnauthorized: false,
    },
  })

  try {
    await transporter.verify()
    console.log("✓ Conexión SMTP verificada")
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error("❌ Error de conexión SMTP:", msg)
    process.exit(1)
  }

  const codigoPrueba = "123456"
  const from = config.emailRemitente
    ? config.nombreRemitente
      ? `"${config.nombreRemitente}" <${config.emailRemitente}>`
      : config.emailRemitente
    : config.usuario!

  try {
    const info = await transporter.sendMail({
      from,
      to: "tobiasmaggiori@transmagg.com",
      subject: "✓ Test OTP — Trans-Magg S.R.L.",
      text: `Código de prueba: ${codigoPrueba}\n\nSi recibís este mail el sistema de OTP está funcionando correctamente.`,
      html: `
        <p>Este es un mail de prueba del sistema OTP de Trans-Magg.</p>
        <p>Código de prueba:</p>
        <h1 style="letter-spacing: 8px; font-size: 36px; color: #1a1a1a;">${codigoPrueba}</h1>
        <p style="color: #666;">Si recibís este mail, el sistema de correo está configurado correctamente.</p>
      `,
    })
    console.log("✅ Mail enviado exitosamente a tobiasmaggiori@transmagg.com")
    console.log("   Message ID:", info.messageId)
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error("❌ Error enviando mail:", msg)
    process.exit(1)
  }

  await prisma.$disconnect()
  process.exit(0)
}

main()
