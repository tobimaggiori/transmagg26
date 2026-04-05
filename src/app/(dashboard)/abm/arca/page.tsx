import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { esAdmin } from "@/lib/permissions"
import { ConfiguracionArcaAbm } from "@/components/abm/configuracion-arca-abm"
import type { Rol } from "@/types"

export default async function ArcaPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const rol = (session.user.rol ?? "OPERADOR_TRANSMAGG") as Rol
  if (!esAdmin(rol)) redirect("/dashboard")

  const arcaConfigRaw = await prisma.configuracionArca.findFirst()

  const arcaConfig = arcaConfigRaw
    ? (() => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { certificadoB64, certificadoPass, ...safe } = arcaConfigRaw
        return {
          ...safe,
          tieneCertificado: !!certificadoB64,
          actualizadoEn: safe.actualizadoEn.toISOString(),
          puntosVenta: (() => {
            try { return JSON.parse(safe.puntosVenta) as Record<string, string> }
            catch { return {} }
          })(),
          comprobantesHabilitados: (() => {
            try { return JSON.parse(safe.comprobantesHabilitados || "[]") as number[] }
            catch { return [] }
          })(),
        }
      })()
    : null

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">ARCA</h2>
        <p className="text-muted-foreground">Configuración de facturación electrónica ARCA.</p>
      </div>
      <ConfiguracionArcaAbm config={arcaConfig} />
    </div>
  )
}
