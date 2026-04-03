/**
 * Propósito: Página de registro de pagos a proveedores (/proveedores/pago).
 * Carga datos iniciales y renderiza RegistrarPagoProveedorClient.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { puedeAcceder } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import { RegistrarPagoProveedorClient } from "./registrar-pago-proveedor-client"
import type { Rol } from "@/types"

/**
 * RegistrarPagoProveedorPage: () -> Promise<JSX.Element>
 *
 * Carga proveedores, cuentas y cheques en cartera.
 * Solo accesible para ADMIN_TRANSMAGG y OPERADOR_TRANSMAGG.
 */
export default async function RegistrarPagoProveedorPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  const rol = (session.user.rol ?? "") as Rol
  if (!puedeAcceder(rol, "proveedores")) redirect("/")

  const [proveedores, cuentas, cuentasChequera, chequesEnCartera] = await Promise.all([
    prisma.proveedor.findMany({
      where: { activo: true },
      select: { id: true, razonSocial: true, cuit: true },
      orderBy: { razonSocial: "asc" },
    }),
    prisma.cuenta.findMany({
      where: {
        activa: true,
        tipo: { in: ["BANCO", "BILLETERA_VIRTUAL"] },
        OR: [
          { cuentaPadreId: { not: null } },
          { tipo: { not: "BANCO" } },
        ],
      },
      select: { id: true, nombre: true, tipo: true },
      orderBy: { nombre: "asc" },
    }),
    prisma.cuenta.findMany({
      where: {
        activa: true,
        tieneChequera: true,
        OR: [
          { cuentaPadreId: { not: null } },
          { tipo: { not: "BANCO" } },
        ],
      },
      select: { id: true, nombre: true },
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
    }),
  ])

  // Serializar fechas para pasar al client component
  const chequesSerializados = chequesEnCartera.map((c) => ({
    ...c,
    fechaCobro: c.fechaCobro.toISOString(),
  }))

  return (
    <RegistrarPagoProveedorClient
      proveedores={proveedores}
      cuentas={cuentas}
      cuentasChequera={cuentasChequera}
      chequesEnCartera={chequesSerializados}
    />
  )
}
