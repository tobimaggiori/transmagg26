/**
 * Propósito: Página server para crear un nuevo Recibo de Cobranza.
 * Carga empresas y cuentas, y renderiza el formulario multi-paso.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { puedeAcceder, esRolInterno } from "@/lib/permissions"
import { NuevoReciboClient } from "./nuevo-recibo-client"
import type { Rol } from "@/types"

export default async function NuevoReciboPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const rol = session.user.rol as Rol
  if (!puedeAcceder(rol, "facturas") || !esRolInterno(rol)) redirect("/dashboard")

  const [empresas, cuentas] = await Promise.all([
    prisma.empresa.findMany({
      where: { activa: true },
      select: { id: true, razonSocial: true, cuit: true },
      orderBy: { razonSocial: "asc" },
    }),
    prisma.cuenta.findMany({
      where: {
        activa: true,
        OR: [
          { cuentaPadreId: { not: null } },
          { tipo: { not: "BANCO" } },
        ],
      },
      select: { id: true, nombre: true, bancoOEntidad: true },
      orderBy: { nombre: "asc" },
    }),
  ])

  return <NuevoReciboClient empresas={empresas} cuentas={cuentas} />
}
