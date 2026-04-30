/**
 * Listado de cuentas activas (banco / billetera / broker) con acceso al libro
 * de cada una. Reemplaza el viejo /conciliacion-cuentas.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { tienePermiso } from "@/lib/permissions"
import { LibroCuentasListado } from "./listado-client"
import type { Rol } from "@/types"

export default async function LibroCuentasIndexPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  const rol = (session.user.rol ?? "OPERADOR_TRANSMAGG") as Rol
  if (!(await tienePermiso(session.user.id, rol, "cuentas"))) redirect("/dashboard")

  const cuentas = await prisma.cuenta.findMany({
    where: { activa: true },
    orderBy: [{ tipo: "asc" }, { nombre: "asc" }],
    select: {
      id: true,
      nombre: true,
      tipo: true,
      moneda: true,
      saldoInicial: true,
      fechaSaldoInicial: true,
      banco: { select: { nombre: true } },
      billetera: { select: { nombre: true } },
      broker: { select: { nombre: true } },
    },
  })

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Libro de cuentas</h1>
        <p className="text-muted-foreground">
          Movimientos por cuenta en tiempo real. Entrá a una cuenta para ver todos los débitos y
          créditos con saldo corrido, conciliar días contra el extracto y cerrar el mes.
        </p>
      </div>
      <LibroCuentasListado cuentas={cuentas} />
    </div>
  )
}
