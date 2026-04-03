/**
 * Propósito: Página para ingresar facturas de proveedores (ruta /proveedores/factura).
 * Server component: carga proveedores activos, cuentas y cheques en cartera.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { esRolInterno } from "@/lib/permissions"
import { FacturaProveedorIngresoClient } from "./factura-proveedor-ingreso-client"
import type { Rol } from "@/types"

/**
 * ProveedoresFacturaPage: () -> Promise<JSX.Element>
 *
 * Verifica autenticación y permisos (solo roles internos).
 * Carga proveedores activos, cuentas y cheques en cartera y renderiza el formulario.
 * Existe como entry point para cargar facturas de proveedores con pago opcional inline.
 *
 * Ejemplos:
 * // Sesión ADMIN_TRANSMAGG → formulario de ingreso de factura de proveedor
 * <ProveedoresFacturaPage />
 * // Sin sesión → redirect /login
 * <ProveedoresFacturaPage />
 */
export default async function ProveedoresFacturaPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const rol = (session.user.rol ?? "OPERADOR_EMPRESA") as Rol
  if (!esRolInterno(rol)) redirect("/dashboard")

  const [proveedores, cuentas, chequesRaw] = await Promise.all([
    prisma.proveedor.findMany({
      where: { activo: true, tipo: "GENERAL" },
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
      select: { id: true, nombre: true, tipo: true, tieneChequera: true },
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
      },
      orderBy: { fechaCobro: "asc" },
    }),
  ])

  const chequesEnCartera = chequesRaw.map((c) => ({
    ...c,
    fechaCobro: c.fechaCobro.toISOString(),
  }))

  return (
    <FacturaProveedorIngresoClient
      proveedores={proveedores}
      cuentas={cuentas}
      chequesEnCartera={chequesEnCartera}
    />
  )
}
