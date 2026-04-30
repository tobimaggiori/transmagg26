/**
 * Configuración ARCA JM. Versión mínima para que JM tenga datos de
 * emisor (CUIT, razón social, puntos de venta, comprobantes habilitados).
 * El upload de certificado, prueba de conexión WSAA, y gestión rica de
 * comprobantes habilitados quedan pendientes (TODO).
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prismaJm } from "@/jm/prisma"
import { esRolInterno } from "@/lib/permissions"
import type { Rol } from "@/types"
import { ConfiguracionArcaFormJm, type ConfiguracionArcaJmInicial } from "@/jm/components/configuracion-arca-form"

export default async function ConfiguracionArcaJmPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (!esRolInterno(session.user.rol as Rol)) redirect("/dashboard")

  let config = await prismaJm.configuracionArca.findUnique({ where: { id: "unico" } })
  if (!config) {
    config = await prismaJm.configuracionArca.create({
      data: { id: "unico", cuit: "", razonSocial: "" },
    })
  }

  const inicial: ConfiguracionArcaJmInicial = {
    cuit: config.cuit,
    razonSocial: config.razonSocial,
    modo: config.modo,
    puntosVenta: config.puntosVenta,
    comprobantesHabilitados: config.comprobantesHabilitados,
    cbuMiPymes: config.cbuMiPymes,
    montoMinimoFce: config.montoMinimoFce ? config.montoMinimoFce.toString() : null,
    activa: config.activa,
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">ARCA</h2>
      </div>
      <ConfiguracionArcaFormJm inicial={inicial} />
    </div>
  )
}
