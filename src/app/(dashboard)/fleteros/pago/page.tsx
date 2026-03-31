/**
 * Propósito: Página "Registrar Pago" a fleteros (ruta /fleteros/pago).
 * Carga fleteros, cuentas activas y cheques en cartera en el servidor,
 * y los pasa al componente cliente RegistrarPagoClient.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { puedeAcceder } from "@/lib/permissions"
import { RegistrarPagoClient } from "./registrar-pago-client"
import type { Rol } from "@/types"

/**
 * FleterosPagoPage: () -> Promise<JSX.Element>
 *
 * Verifica sesión y permisos, luego provee datos iniciales al cliente.
 * Solo ADMIN_TRANSMAGG y OPERADOR_TRANSMAGG pueden acceder.
 */
export default async function FleterosPagoPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const rol = (session.user.rol ?? "OPERADOR_TRANSMAGG") as Rol
  if (!puedeAcceder(rol, "pagos")) redirect("/dashboard")

  const [fleteros, cuentas, chequesEnCartera] = await Promise.all([
    prisma.fletero.findMany({
      where: { activo: true },
      select: { id: true, razonSocial: true, cuit: true },
      orderBy: { razonSocial: "asc" },
    }),
    prisma.cuenta.findMany({
      where: { activa: true },
      select: { id: true, nombre: true, tipo: true, bancoOEntidad: true, tieneChequera: true },
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
        esElectronico: true,
        empresa: { select: { razonSocial: true } },
      },
      orderBy: { fechaCobro: "asc" },
    }).then((rows) =>
      rows.map((r) => ({ ...r, fechaCobro: r.fechaCobro.toISOString() }))
    ),
  ])

  return (
    <RegistrarPagoClient
      fleteros={fleteros}
      cuentas={cuentas}
      chequesEnCartera={chequesEnCartera}
    />
  )
}
