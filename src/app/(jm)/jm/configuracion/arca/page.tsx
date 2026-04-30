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
    <div className="space-y-4 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configuración ARCA</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Datos del emisor (Javier Maggiori) para emisión de facturas. La
          carga del certificado, password y verificación contra WSAA está
          pendiente — por ahora el sistema permite emitir facturas con
          numeración interna sin autorización ARCA.
        </p>
      </div>
      <ConfiguracionArcaFormJm inicial={inicial} />
    </div>
  )
}
