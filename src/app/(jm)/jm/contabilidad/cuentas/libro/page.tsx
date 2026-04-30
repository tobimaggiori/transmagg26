/**
 * Libro de cuentas JM. Lista movimientos por cuenta.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prismaJm } from "@/jm/prisma"
import { esRolInterno } from "@/lib/permissions"
import type { Rol } from "@/types"
import { LibroCuentasJmClient } from "./libro-cuentas-jm-client"

export default async function LibroCuentasJmPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (!esRolInterno(session.user.rol as Rol)) redirect("/dashboard")

  const cuentas = await prismaJm.cuenta.findMany({
    where: { activa: true },
    select: { id: true, nombre: true, moneda: true, saldoInicial: true },
    orderBy: { nombre: "asc" },
  })

  const cuentasSerial = cuentas.map((c) => ({
    id: c.id,
    nombre: c.nombre,
    moneda: c.moneda,
    saldoInicial: c.saldoInicial.toString(),
  }))

  return <LibroCuentasJmClient cuentas={cuentasSerial} />
}
