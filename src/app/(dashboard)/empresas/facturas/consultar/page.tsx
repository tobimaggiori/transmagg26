/**
 * Propósito: Página de consulta del historial de facturas a empresas (/empresas/facturas/consultar).
 * Server wrapper: verifica auth y permisos, carga empresas y cuentas bancarias.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { puedeAcceder } from "@/lib/permissions"
import { ConsultarFacturasClient } from "../consultar-facturas-client"
import type { Rol } from "@/types"

/**
 * EmpresasFacturasConsultarPage: () -> Promise<JSX.Element>
 *
 * Verifica sesión y que el rol tenga acceso a "facturas".
 * Carga empresas activas con CUIT y cuentas bancarias activas.
 * Renderiza ConsultarFacturasClient con esos datos.
 * Redirige a /dashboard si el rol no tiene permiso.
 * Existe como entry point server-side del historial/consulta de facturas a empresas.
 *
 * Ejemplos:
 * // Sesión ADMIN_TRANSMAGG → lista completa de empresas y facturas
 * <EmpresasFacturasConsultarPage />
 * // Sin sesión → redirect /login
 * <EmpresasFacturasConsultarPage />
 */
export default async function EmpresasFacturasConsultarPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const rol = (session.user.rol ?? "OPERADOR_EMPRESA") as Rol
  if (!puedeAcceder(rol, "facturas")) redirect("/dashboard")

  const [empresas, cuentasBancarias] = await Promise.all([
    prisma.empresa.findMany({
      where: { activa: true },
      select: { id: true, razonSocial: true, cuit: true },
      orderBy: { razonSocial: "asc" },
    }),
    prisma.cuenta.findMany({
      where: { activa: true },
      select: { id: true, nombre: true, bancoOEntidad: true },
      orderBy: { nombre: "asc" },
    }),
  ])

  return (
    <ConsultarFacturasClient
      empresas={empresas}
      cuentasBancarias={cuentasBancarias}
    />
  )
}
