import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { puedeAcceder } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import { ConsultarPolizasClient } from "./consultar-polizas-client"
import type { Rol } from "@/types"

function estadoPoliza(vigenciaHasta: Date, activa: boolean): "VIGENTE" | "POR_VENCER" | "VENCIDA" {
  const now = new Date()
  const vh = new Date(vigenciaHasta)
  if (!activa || vh < now) return "VENCIDA"
  if (vh <= new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)) return "POR_VENCER"
  return "VIGENTE"
}

export default async function ConsultarPolizasPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (!puedeAcceder(session.user.rol as Rol, "cuentas")) redirect("/dashboard")

  const polizas = await prisma.polizaSeguro.findMany({
    include: {
      camion:    { select: { patenteChasis: true, patenteAcoplado: true } },
      proveedor: { select: { razonSocial: true } },
    },
    orderBy: { vigenciaHasta: "desc" },
  })

  const data = polizas.map((p) => ({
    id:             p.id,
    tipoBien:       p.tipoBien,
    aseguradora:    p.aseguradora,
    nroPoliza:      p.nroPoliza,
    cobertura:      p.cobertura,
    montoMensual:   p.montoMensual,
    vigenciaDesde:  p.vigenciaDesde.toISOString(),
    vigenciaHasta:  p.vigenciaHasta.toISOString(),
    activa:         p.activa,
    pdfS3Key:       p.pdfS3Key,
    descripcionBien: p.descripcionBien,
    camion:         p.camion,
    proveedor:      p.proveedor,
    estadoPoliza:   estadoPoliza(p.vigenciaHasta, p.activa),
  }))

  return <ConsultarPolizasClient polizas={data} />
}
