/**
 * Configuración Envío JM. Form simple para reply-to.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prismaJm } from "@/jm/prisma"
import { esRolInterno } from "@/lib/permissions"
import type { Rol } from "@/types"
import { ConfiguracionEnvioFormJm } from "@/jm/components/configuracion-envio-form"

export default async function ConfiguracionEnvioJmPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (!esRolInterno(session.user.rol as Rol)) redirect("/dashboard")

  let config = await prismaJm.configuracionEnvio.findUnique({ where: { id: "singleton" } })
  if (!config) config = await prismaJm.configuracionEnvio.create({ data: { id: "singleton" } })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Envío de mails</h2>
      </div>
      <ConfiguracionEnvioFormJm replyToInicial={config.replyTo} />
    </div>
  )
}
