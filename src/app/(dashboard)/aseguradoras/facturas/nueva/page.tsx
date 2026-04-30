/**
 * Propósito: Página para ingresar una nueva factura de seguro (/aseguradoras/facturas/nueva).
 * Server component: carga proveedores, tarjetas, camiones y cuentas.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { tienePermiso } from "@/lib/permissions"
import { NuevaFacturaSeguroClient } from "./nueva-factura-seguro-client"
import type { Rol } from "@/types"

export default async function NuevaFacturaSeguroPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const rol = (session.user.rol ?? "OPERADOR_TRANSMAGG") as Rol
  if (!(await tienePermiso(session.user.id, rol, "aseguradoras"))) redirect("/dashboard")

  const [proveedores, tarjetas, camiones, cuentas] = await Promise.all([
    prisma.proveedor.findMany({
      where: { activo: true, tipo: "ASEGURADORA" },
      select: { id: true, razonSocial: true, cuit: true },
      orderBy: { razonSocial: "asc" },
    }),
    prisma.tarjeta.findMany({
      where: { activa: true, tipo: "CREDITO" },
      select: { id: true, nombre: true, banco: true, ultimos4: true },
      orderBy: { nombre: "asc" },
    }),
    prisma.camion.findMany({
      where: { activo: true },
      select: { id: true, patenteChasis: true, patenteAcoplado: true },
      orderBy: { patenteChasis: "asc" },
    }),
    prisma.cuenta.findMany({
      where: { activa: true },
      select: { id: true, nombre: true, tipo: true },
      orderBy: { nombre: "asc" },
    }),
  ])

  if (proveedores.length === 0) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">
          No hay aseguradoras registradas. Agregá una desde{" "}
          <a href="/abm?tab=proveedores" className="text-primary underline">
            ABM → Proveedores
          </a>
          .
        </p>
      </div>
    )
  }

  return (
    <NuevaFacturaSeguroClient
      proveedores={proveedores}
      tarjetas={tarjetas}
      camiones={camiones}
      cuentas={cuentas}
    />
  )
}
