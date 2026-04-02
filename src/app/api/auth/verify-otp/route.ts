/**
 * Propósito: API Route para verificar un código OTP e iniciar sesión.
 * Verifica que el código sea válido, no esté usado y no haya expirado.
 * Si es correcto, inicia la sesión de NextAuth y retorna éxito.
 *
 * POST /api/auth/verify-otp
 * Body: { email: string, codigo: string }
 * Response 200: { message: string }
 * Response 400: { error: string }
 * Response 401: { error: string }
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { verificarCodigoOtp, estaExpirado } from "@/lib/otp"

/** Schema de validación del cuerpo de la solicitud */
const bodySchema = z.object({
  email: z.string().email("Email inválido"),
  codigo: z.string().length(6, "El código debe tener 6 dígitos"),
})

/**
 * POST: NextRequest -> Promise<NextResponse>
 *
 * Dado el body JSON { email, codigo }, verifica el OTP contra el hash en la DB,
 * marca el código como usado y devuelve éxito si es válido y no expiró.
 * Existe como paso previo al signIn de NextAuth: el cliente llama a este endpoint
 * para pre-validar el OTP antes de iniciar la sesión con credentials.
 *
 * Ejemplos:
 * POST /api/auth/verify-otp { email: "admin@transmagg.com.ar", codigo: "042891" }
 * // => 200 { message: "Código verificado correctamente." }
 * POST /api/auth/verify-otp { email: "admin@transmagg.com.ar", codigo: "999999" }
 * // => 401 { error: "Código inválido. Verificá e intentá nuevamente." }
 * POST /api/auth/verify-otp { email: "admin@transmagg.com.ar", codigo: "abc" }
 * // => 400 { error: "Datos inválidos." }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = bodySchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos." },
        { status: 400 }
      )
    }

    const { email, codigo } = parsed.data
    console.log("[verify-otp] Email recibido:", email)
    console.log("[verify-otp] Código recibido:", codigo)

    // Buscar usuario activo
    const usuario = await prisma.usuario.findUnique({
      where: { email },
      select: { id: true, activo: true },
    })

    console.log("[verify-otp] Usuario encontrado:", usuario?.id, "activo:", usuario?.activo)

    if (!usuario || !usuario.activo) {
      return NextResponse.json(
        { error: "Código inválido o expirado." },
        { status: 401 }
      )
    }

    // Obtener el OTP activo más reciente
    const otps = await prisma.otpCodigo.findMany({
      where: { usuarioId: usuario.id, usado: false },
      orderBy: { expiraEn: "desc" },
    })

    console.log("[verify-otp] OTPs activos encontrados:", otps.length)
    if (otps.length > 0) {
      console.log("[verify-otp] OTP a verificar:", otps[0].id, "expira:", otps[0].expiraEn)
    }

    const otp = otps[0]

    if (!otp) {
      return NextResponse.json(
        { error: "Código inválido o expirado." },
        { status: 401 }
      )
    }

    // Verificar expiración
    if (estaExpirado(otp.expiraEn)) {
      console.log("[verify-otp] OTP expirado")
      await prisma.otpCodigo.update({
        where: { id: otp.id },
        data: { usado: true },
      })
      return NextResponse.json(
        { error: "El código ha expirado. Solicitá uno nuevo." },
        { status: 401 }
      )
    }

    // Verificar el código
    const esValido = await verificarCodigoOtp(codigo, otp.codigoHash)
    console.log("[verify-otp] Match bcrypt:", esValido)

    if (!esValido) {
      return NextResponse.json(
        { error: "Código inválido. Verificá e intentá nuevamente." },
        { status: 401 }
      )
    }

    // Marcar OTP como usado
    await prisma.otpCodigo.update({
      where: { id: otp.id },
      data: { usado: true },
    })

    return NextResponse.json({ message: "Código verificado correctamente." })
  } catch (error) {
    console.error("[verify-otp] Error:", error)
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    )
  }
}
