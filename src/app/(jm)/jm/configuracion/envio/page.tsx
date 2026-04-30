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
    <div className="max-w-2xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configuración de Envío</h1>
        <p className="text-sm text-muted-foreground mt-1">Configurar email reply-to para los envíos del sistema.</p>
      </div>
      <ConfiguracionEnvioFormJm replyToInicial={config.replyTo} />
    </div>
  )
}
