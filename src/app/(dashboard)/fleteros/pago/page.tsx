/**
 * Propósito: Página "Orden de Pago" (/fleteros/pago).
 * Flujo: seleccionar fletero → ver LPs pendientes → registrar pago con preview de OP.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { puedeAcceder } from "@/lib/permissions"
import { RegistrarPagoClient } from "./registrar-pago-client"
import type { Rol } from "@/types"

export default async function OrdenDePagoPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const rol = (session.user.rol ?? "OPERADOR_TRANSMAGG") as Rol
  if (!puedeAcceder(rol, "pagos")) redirect("/dashboard")

  const [fleteros, cuentas, chequesEnCartera, operador] = await Promise.all([
    prisma.fletero.findMany({
      where: { activo: true },
      select: { id: true, razonSocial: true, cuit: true, usuario: { select: { email: true } } },
      orderBy: { razonSocial: "asc" },
    }).then((rows) => rows.map((r) => ({ ...r, email: r.usuario?.email ?? null }))),
    prisma.cuenta.findMany({
      where: { activa: true },
      select: { id: true, nombre: true, bancoOEntidad: true },
      orderBy: { nombre: "asc" },
    }),
    prisma.chequeRecibido.findMany({
      where: { estado: "EN_CARTERA" },
      select: {
        id: true,
        nroCheque: true,
        bancoEmisor: true,
        monto: true,
        fechaCobro: true,
      },
      orderBy: { fechaCobro: "asc" },
    }).then((rows) => rows.map((r) => ({ ...r, fechaCobro: r.fechaCobro.toISOString() }))),
    prisma.usuario.findUnique({
      where: { id: session.user.id },
      select: { email: true, smtpActivo: true },
    }),
  ])

  return (
    <RegistrarPagoClient
      fleteros={fleteros}
      cuentas={cuentas}
      chequesEnCartera={chequesEnCartera}
      operadorEmail={operador?.email ?? null}
      operadorSmtpActivo={operador?.smtpActivo ?? false}
    />
  )
}
