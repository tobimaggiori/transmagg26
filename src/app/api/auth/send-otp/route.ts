/**
 * Propósito: API Route para solicitar un código OTP de autenticación.
 * Recibe el email del usuario, verifica que exista y esté activo,
 * genera un OTP, lo hashea, lo persiste y envía por email.
 *
 * POST /api/auth/send-otp
 * Body: { email: string }
 * Response 200: { message: string }
 * Response 400: { error: string }
 * Response 404: { error: string }
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { enviarEmail } from "@/lib/email"
import {
  generarCodigoOtp,
  hashearCodigoOtp,
  calcularExpiracionOtp,
} from "@/lib/otp"

/** Schema de validación del cuerpo de la solicitud */
const bodySchema = z.object({
  email: z.string().email("Email inválido"),
})

/**
 * POST: NextRequest -> Promise<NextResponse>
 *
 * Dado el body JSON { email }, verifica que el usuario exista y esté activo,
 * genera un OTP de 6 dígitos, lo hashea, lo persiste en la DB e invalida
 * los OTPs anteriores del usuario.
 *
 * Ejemplos:
 * POST /api/auth/send-otp { email: "admin@transmagg.com.ar" }
 * // => 200 { message: "Si el email está registrado, recibirás un código de acceso." }
 * POST /api/auth/send-otp { email: "noexiste@x.com" }
 * // => 404 { error: "El email ingresado no pertenece a un usuario registrado" }
 * POST /api/auth/send-otp { email: "invalido" }
 * // => 400 { error: "Email inválido." }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = bodySchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Email inválido." },
        { status: 400 }
      )
    }

    const { email } = parsed.data

    // Verificar que el usuario existe y está activo
    const usuario = await prisma.usuario.findUnique({
      where: { email },
      select: { id: true, nombre: true, apellido: true, activo: true },
    })

    if (!usuario || !usuario.activo) {
      return NextResponse.json(
        { error: "El email ingresado no pertenece a un usuario registrado" },
        { status: 404 }
      )
    }

    // Marcar como usados los OTPs anteriores sin usar
    await prisma.otpCodigo.updateMany({
      where: { usuarioId: usuario.id, usado: false },
      data: { usado: true },
    })

    // Generar nuevo OTP
    const codigo = generarCodigoOtp()
    const codigoHash = await hashearCodigoOtp(codigo)
    const expiraEn = calcularExpiracionOtp()

    // Persistir el OTP hasheado
    await prisma.otpCodigo.create({
      data: { usuarioId: usuario.id, codigoHash, canal: "EMAIL", expiraEn },
    })

    // Enviar el código por email usando la config SMTP del sistema
    const resultado = await enviarEmail({
      para: email,
      asunto: "Tu código de acceso — Trans-Magg S.R.L.",
      texto: `Tu código de acceso es: ${codigo}\n\nVence en 10 minutos.`,
      html: `
        <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto;">
          <h2 style="color: #1a1a1a;">Trans-Magg S.R.L.</h2>
          <p>Tu código de acceso es:</p>
          <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px;
                      color: #1a1a1a; padding: 20px; background: #f5f5f5;
                      border-radius: 8px; text-align: center;">
            ${codigo}
          </div>
          <p style="color: #666; margin-top: 16px;">
            Este código vence en 10 minutos.<br>
            Si no solicitaste este código, ignorá este mensaje.
          </p>
        </div>
      `,
      tipo: "sistema",
    })

    if (!resultado.ok) {
      // Fallback: loguear el código para que pueda usarse durante el setup inicial
      console.log(`[OTP FALLBACK] Email: ${email} | Código: ${codigo}`)
    }

    return NextResponse.json({
      message: "Si el email está registrado, recibirás un código de acceso.",
    })
  } catch (error) {
    console.error("[send-otp] Error:", error)
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    )
  }
}
