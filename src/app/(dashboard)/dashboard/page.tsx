/**
 * Propósito: Página principal del dashboard de Transmagg.
 * Muestra un resumen de las métricas clave del sistema según el rol del usuario.
 * Las tarjetas de estadísticas se filtran por permisos de rol.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { puedeAcceder } from "@/lib/permissions"
import { formatearMoneda } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Truck, Building2, FileText, Receipt, Route } from "lucide-react"
import type { Rol } from "@/types"

/**
 * obtenerEstadisticas: Rol -> Promise<Record<string, number | string>>
 *
 * Dado el rol del usuario, consulta la DB y devuelve las métricas
 * a las que ese rol tiene acceso (fleteros, empresas, liquidaciones, facturas, viajes).
 * Existe para centralizar las consultas de estadísticas del dashboard
 * y filtrar por permisos antes de renderizar las tarjetas.
 *
 * Ejemplos:
 * await obtenerEstadisticas("ADMIN_TRANSMAGG")
 * // => { totalFleteros: 3, totalEmpresas: 2, totalLiquidaciones: "$...", totalFacturas: "$...", viajesPendientes: 1 }
 * await obtenerEstadisticas("FLETERO")
 * // => { totalLiquidaciones: "$...", viajesPendientes: N }
 * await obtenerEstadisticas("ADMIN_EMPRESA")
 * // => { totalFacturas: "$...", viajesPendientes: N }
 */
async function obtenerEstadisticas(rol: Rol) {
  const stats: Record<string, number | string> = {}

  if (puedeAcceder(rol, "fleteros")) {
    stats.totalFleteros = await prisma.fletero.count({ where: { activo: true } })
  }

  if (puedeAcceder(rol, "empresas")) {
    stats.totalEmpresas = await prisma.empresa.count({ where: { activa: true } })
  }

  if (puedeAcceder(rol, "liquidaciones")) {
    const liqAgg = await prisma.liquidacion.aggregate({
      _sum: { total: true },
      where: { estado: { not: "ANULADA" } },
    })
    stats.totalLiquidaciones = formatearMoneda(liqAgg._sum.total ?? 0)
  }

  if (puedeAcceder(rol, "facturas")) {
    const factAgg = await prisma.facturaEmitida.aggregate({
      _sum: { total: true },
      where: { estado: { not: "ANULADA" } },
    })
    stats.totalFacturas = formatearMoneda(factAgg._sum.total ?? 0)
  }

  if (puedeAcceder(rol, "viajes")) {
    stats.viajesPendientes = await prisma.viaje.count({ where: { estadoLiquidacion: "PENDIENTE_LIQUIDAR" } })
  }

  return stats
}

/**
 * DashboardPage: () -> Promise<JSX.Element>
 *
 * Obtiene la sesión del usuario, llama a obtenerEstadisticas y renderiza
 * tarjetas de métricas filtradas por rol. Redirige a /login si no hay sesión.
 * Existe como página de inicio del sistema, dando a cada usuario
 * un resumen de los indicadores relevantes para su rol.
 *
 * Ejemplos:
 * // Sesión ADMIN_TRANSMAGG → tarjetas: Fleteros, Empresas, Liquidaciones, Facturas, Viajes pendientes
 * <DashboardPage />
 * // Sesión FLETERO → tarjetas: Liquidaciones, Viajes pendientes
 * <DashboardPage />
 * // Sin sesión → redirect /login
 * <DashboardPage />
 */
export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  const rol = (session.user.rol ?? "OPERADOR_EMPRESA") as Rol
  const stats = await obtenerEstadisticas(rol)

  const tarjetas = [
    {
      titulo: "Fleteros activos",
      valor: stats.totalFleteros,
      descripcion: "Transportistas habilitados",
      icono: Truck,
      seccion: "fleteros",
    },
    {
      titulo: "Empresas activas",
      valor: stats.totalEmpresas,
      descripcion: "Clientes habilitados",
      icono: Building2,
      seccion: "empresas",
    },
    {
      titulo: "Total liquidaciones",
      valor: stats.totalLiquidaciones,
      descripcion: "Monto total acumulado",
      icono: FileText,
      seccion: "liquidaciones",
    },
    {
      titulo: "Total facturas",
      valor: stats.totalFacturas,
      descripcion: "Monto total facturado",
      icono: Receipt,
      seccion: "facturas",
    },
    {
      titulo: "Viajes pendientes",
      valor: stats.viajesPendientes,
      descripcion: "Sin liquidar ni facturar",
      icono: Route,
      seccion: "viajes",
    },
  ].filter((t) => puedeAcceder(rol, t.seccion) && t.valor !== undefined)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Bienvenido al sistema de gestión de Transmagg
        </p>
      </div>

      {tarjetas.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {tarjetas.map((tarjeta) => {
            const Icon = tarjeta.icono
            return (
              <Card key={tarjeta.seccion}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {tarjeta.titulo}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{tarjeta.valor}</div>
                  <p className="text-xs text-muted-foreground">
                    {tarjeta.descripcion}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Sin datos disponibles</CardTitle>
            <CardDescription>
              No hay métricas disponibles para tu rol en este momento.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  )
}
