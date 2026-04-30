/**
 * Registrar pago a proveedor JM.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prismaJm } from "@/jm/prisma"
import { esRolInterno } from "@/lib/permissions"
import type { Rol } from "@/types"
import { RegistrarPagoProveedorJmClient } from "./registrar-pago-proveedor-jm-client"

export default async function RegistrarPagoProveedorJmPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (!esRolInterno(session.user.rol as Rol)) redirect("/dashboard")

  const [proveedores, cuentas] = await Promise.all([
    prismaJm.proveedor.findMany({
      where: { activo: true },
      select: { id: true, razonSocial: true, cuit: true },
      orderBy: { razonSocial: "asc" },
    }),
    prismaJm.cuenta.findMany({
      where: { activa: true },
      select: { id: true, nombre: true },
      orderBy: { nombre: "asc" },
    }),
  ])

  return <RegistrarPagoProveedorJmClient proveedores={proveedores} cuentas={cuentas} />
}
