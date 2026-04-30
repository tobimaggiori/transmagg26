import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { esAdmin } from "@/lib/permissions"
import { ConfiguracionEnvioAbm } from "@/components/abm/configuracion-envio-abm"
import type { Rol } from "@/types"

export default async function EnvioPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const rol = (session.user.rol ?? "OPERADOR_TRANSMAGG") as Rol
  if (!esAdmin(rol)) redirect("/dashboard")

  const cfg = await prisma.configuracionEnvio.upsert({
    where: { id: "singleton" },
    create: { id: "singleton" },
    update: {},
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Envío de mails</h2>
      </div>
      <ConfiguracionEnvioAbm
        config={{
          replyTo: cfg.replyTo,
          resendConfigurado: !!process.env.RESEND_API_KEY,
          remitente: "Trans-Magg S.R.L. <auth@transmagg.com.ar>",
        }}
      />
    </div>
  )
}
