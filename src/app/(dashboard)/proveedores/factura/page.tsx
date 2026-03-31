/**
 * Propósito: Página para ingresar facturas de proveedores (ruta /proveedores/factura).
 * Server component: carga proveedores activos y renderiza FacturaProveedorIngresoClient.
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
 * Carga proveedores activos y renderiza el formulario de ingreso.
 * Existe como entry point para cargar facturas de proveedores.
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

  const proveedores = await prisma.proveedor.findMany({
    where: { activo: true },
    select: { id: true, razonSocial: true, cuit: true },
    orderBy: { razonSocial: "asc" },
  })

  return <FacturaProveedorIngresoClient proveedores={proveedores} />
}
