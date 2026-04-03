import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { esAdmin } from "@/lib/permissions"
import { ConfiguracionOtpAbm } from "@/components/abm/configuracion-otp-abm"
import type { Rol } from "@/types"

export default async function OtpPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const rol = (session.user.rol ?? "OPERADOR_TRANSMAGG") as Rol
  if (!esAdmin(rol)) redirect("/dashboard")

  const otpConfigRaw = await prisma.configuracionOtp.findUnique({ where: { id: "singleton" } })

  const otpConfig = otpConfigRaw
    ? {
        host: otpConfigRaw.host,
        puerto: otpConfigRaw.puerto,
        usuario: otpConfigRaw.usuario,
        tienePassword: !!otpConfigRaw.passwordHash,
        usarSsl: otpConfigRaw.usarSsl,
        emailRemitente: otpConfigRaw.emailRemitente,
        nombreRemitente: otpConfigRaw.nombreRemitente,
        activo: otpConfigRaw.activo,
      }
    : null

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">OTP</h2>
        <p className="text-muted-foreground">Configuración del servicio de correo OTP.</p>
      </div>
      <ConfiguracionOtpAbm config={otpConfig} />
    </div>
  )
}
