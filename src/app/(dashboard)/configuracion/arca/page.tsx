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

  let arcaConfig: {
    id: string; cuit: string; razonSocial: string; tieneCertificado: boolean;
    modo: string; puntosVenta: Record<string, string>; comprobantesHabilitados: number[];
    cbuMiPymes: string | null; activa: boolean; actualizadoEn: string; actualizadoPor: string | null;
  } | null = null

  try {
    const arcaConfigRaw = await prisma.configuracionArca.findFirst()
    if (arcaConfigRaw) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { certificadoB64, certificadoPass, ...safe } = arcaConfigRaw
      const puntosVenta: Record<string, string> = {}
      try {
        const raw = JSON.parse(safe.puntosVenta) as Record<string, unknown>
        for (const [k, v] of Object.entries(raw)) puntosVenta[k] = String(v)
      } catch { /* empty */ }

      let comprobantesHabilitados: number[] = []
      try {
        comprobantesHabilitados = JSON.parse(safe.comprobantesHabilitados || "[]") as number[]
      } catch { /* empty */ }

      arcaConfig = {
        id: safe.id,
        cuit: safe.cuit,
        razonSocial: safe.razonSocial,
        tieneCertificado: !!certificadoB64,
        modo: safe.modo,
        puntosVenta,
        comprobantesHabilitados,
        cbuMiPymes: safe.cbuMiPymes,
        activa: safe.activa,
        actualizadoEn: safe.actualizadoEn.toISOString(),
        actualizadoPor: safe.actualizadoPor,
      }
    }
  } catch (e) {
    console.error("[configuracion/arca] Error cargando config:", e)
  }

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
