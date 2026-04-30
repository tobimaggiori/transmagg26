/**
 * Nueva factura de seguro JM.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prismaJm } from "@/jm/prisma"
import { esRolInterno } from "@/lib/permissions"
import type { Rol } from "@/types"
import { NuevaFacturaSeguroJmClient } from "./nueva-factura-seguro-jm-client"

export default async function NuevaFacturaSeguroJmPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (!esRolInterno(session.user.rol as Rol)) redirect("/dashboard")

  const [aseguradoras, cuentas, tarjetas] = await Promise.all([
    prismaJm.proveedor.findMany({
      where: { activo: true, tipo: "ASEGURADORA" },
      select: { id: true, razonSocial: true, cuit: true },
      orderBy: { razonSocial: "asc" },
    }),
    prismaJm.cuenta.findMany({ where: { activa: true }, select: { id: true, nombre: true }, orderBy: { nombre: "asc" } }),
    prismaJm.tarjeta.findMany({ where: { activa: true }, select: { id: true, nombre: true }, orderBy: { nombre: "asc" } }),
  ])

  return <NuevaFacturaSeguroJmClient aseguradoras={aseguradoras} cuentas={cuentas} tarjetas={tarjetas} />
}
