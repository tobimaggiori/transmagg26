/**
 * Propósito: Página de gestión de liquidaciones (Líquido Producto ARCA) de Transmagg.
 * Muestra DOS secciones: viajes pendientes de liquidación y liquidaciones emitidas.
 * Incluye filtros por fletero y rango de fechas.
 * SEGURIDAD: tarifa_fletero visible solo para roles autorizados.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { puedeAcceder, esRolInterno } from "@/lib/permissions"
import { formatearMoneda, formatearFecha } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { Rol } from "@/types"
import { NuevaLiquidacionButton } from "@/components/layout/nueva-liquidacion-button"

/**
 * EstadoBadge: { estado: string } -> JSX.Element
 *
 * Dado el estado de una liquidación, devuelve un badge con color semántico.
 * Existe para visualizar el estado de forma consistente sin repetir estilos.
 *
 * Ejemplos:
 * <EstadoBadge estado="BORRADOR" /> // => badge amarillo
 * <EstadoBadge estado="EMITIDA" />  // => badge azul
 * <EstadoBadge estado="PAGADA" />   // => badge verde
 */
function EstadoBadge({ estado }: { estado: string }) {
  const estilos: Record<string, string> = {
    BORRADOR: "bg-yellow-100 text-yellow-800",
    EMITIDA: "bg-blue-100 text-blue-800",
    PAGADA: "bg-green-100 text-green-800",
    ANULADA: "bg-red-100 text-red-800",
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${estilos[estado] ?? "bg-gray-100 text-gray-800"}`}>
      {estado}
    </span>
  )
}

/**
 * LiquidacionesPage: ({ searchParams }) -> Promise<JSX.Element>
 *
 * Muestra dos secciones: viajes pendientes de liquidación (PENDIENTE o EN_FACTURA)
 * y liquidaciones emitidas. Filtra por fletero y rango de fechas via URL params.
 * Roles internos pueden crear nuevas liquidaciones; FLETERO solo ve las suyas.
 * Existe para gestionar el proceso de liquidación ARCA de fleteros desde el panel.
 *
 * Ejemplos:
 * // Sesión ADMIN_TRANSMAGG → dos secciones + botón "Nueva liquidación"
 * <LiquidacionesPage searchParams={{}} />
 * // Sesión FLETERO, ?fleteroId=f1 → solo sus liquidaciones sin filtro de fletero
 * <LiquidacionesPage searchParams={{ fleteroId: "f1" }} />
 * // Sesión ADMIN_EMPRESA → redirect /dashboard
 * <LiquidacionesPage searchParams={{}} />
 */
export default async function LiquidacionesPage({
  searchParams,
}: {
  searchParams: { fleteroId?: string; desde?: string; hasta?: string }
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const rol = (session.user.rol ?? "OPERADOR_EMPRESA") as Rol
  if (!puedeAcceder(rol, "liquidaciones")) redirect("/dashboard")

  // Where base por rol
  const whereRol =
    rol === "FLETERO"
      ? { fletero: { usuario: { email: session.user.email ?? "" } } }
      : {}

  // Filtros adicionales para roles internos
  const filtrosAdicionales: Record<string, unknown> = {}
  if (esRolInterno(rol)) {
    if (searchParams.fleteroId) filtrosAdicionales.fleteroId = searchParams.fleteroId
    if (searchParams.desde || searchParams.hasta) {
      const fechaWhere: Record<string, Date> = {}
      if (searchParams.desde) fechaWhere.gte = new Date(searchParams.desde)
      if (searchParams.hasta) {
        const hasta = new Date(searchParams.hasta)
        hasta.setHours(23, 59, 59, 999)
        fechaWhere.lte = hasta
      }
      filtrosAdicionales.grabadaEn = fechaWhere
    }
  }

  const whereViajesPendientes: Record<string, unknown> = { ...whereRol }
  if (searchParams.fleteroId && esRolInterno(rol)) {
    whereViajesPendientes.fleteroId = searchParams.fleteroId
  }

  const [liquidaciones, fleteros, viajesPendientes] = await Promise.all([
    prisma.liquidacion.findMany({
      where: { ...whereRol, ...filtrosAdicionales },
      include: {
        fletero: { select: { razonSocial: true } },
        _count: { select: { viajes: true } },
        pagos: { select: { monto: true } },
      },
      orderBy: { grabadaEn: "desc" },
      take: 100,
    }),
    esRolInterno(rol)
      ? prisma.fletero.findMany({
          where: { activo: true },
          select: { id: true, razonSocial: true, comisionDefault: true },
          orderBy: { razonSocial: "asc" },
        })
      : [],
    esRolInterno(rol)
      ? prisma.viaje.findMany({
          where: {
            // Pendiente de liquidación = no tiene liquidación aún
            estado: { in: ["PENDIENTE", "EN_FACTURA"] },
            ...(searchParams.fleteroId ? { fleteroId: searchParams.fleteroId } : {}),
          },
          select: {
            id: true,
            fleteroId: true,
            fechaViaje: true,
            remito: true,
            mercaderia: true,
            provinciaOrigen: true,
            provinciaDestino: true,
            kilos: true,
            tarifaBase: true,
            estado: true,
            empresa: { select: { razonSocial: true } },
            camion: { select: { patenteChasis: true } },
            chofer: { select: { nombre: true, apellido: true } },
          },
          orderBy: { fechaViaje: "desc" },
        })
      : [],
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Liquidaciones</h2>
          <p className="text-muted-foreground">
            {rol === "FLETERO"
              ? "Tus liquidaciones de viajes"
              : "Líquido Producto ARCA — liquidación por cuenta y orden al fletero"}
          </p>
        </div>
        {esRolInterno(rol) && (
          <NuevaLiquidacionButton
            fleteros={fleteros}
            viajesPendientes={viajesPendientes}
          />
        )}
      </div>

      {/* Filtros — solo roles internos */}
      {esRolInterno(rol) && (
        <form method="GET" action="/liquidaciones" className="flex flex-wrap gap-3 p-4 bg-muted/40 rounded-lg border">
          <div className="flex flex-col gap-1 min-w-[180px]">
            <label className="text-xs font-medium text-muted-foreground">Fletero</label>
            <select name="fleteroId" defaultValue={searchParams.fleteroId ?? ""} className="h-9 rounded-md border bg-background px-2 text-sm">
              <option value="">Todos</option>
              {fleteros.map((f) => <option key={f.id} value={f.id}>{f.razonSocial}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Desde</label>
            <input type="date" name="desde" defaultValue={searchParams.desde ?? ""} className="h-9 rounded-md border bg-background px-2 text-sm" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Hasta</label>
            <input type="date" name="hasta" defaultValue={searchParams.hasta ?? ""} className="h-9 rounded-md border bg-background px-2 text-sm" />
          </div>
          <div className="flex items-end gap-2">
            <button type="submit" className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">Filtrar</button>
            <a href="/liquidaciones" className="h-9 px-4 rounded-md border text-sm font-medium inline-flex items-center hover:bg-accent">Limpiar</a>
          </div>
        </form>
      )}

      {/* Sección 1: Viajes pendientes de liquidación */}
      {esRolInterno(rol) && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold">Viajes pendientes de liquidación</h3>
            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800">
              {viajesPendientes.length}
            </span>
          </div>
          {viajesPendientes.length === 0 ? (
            <Card>
              <CardContent className="pt-4">
                <p className="text-muted-foreground text-center py-3">
                  Sin viajes pendientes de liquidación
                  {searchParams.fleteroId ? " para el fletero seleccionado" : ""}.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="border rounded-lg divide-y">
              {viajesPendientes.map((v) => (
                <div key={v.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{v.empresa.razonSocial}</p>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${v.estado === "EN_FACTURA" ? "bg-blue-100 text-blue-800" : "bg-yellow-100 text-yellow-800"}`}>
                        {v.estado}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatearFecha(v.fechaViaje)} · {v.camion.patenteChasis} · {v.chofer.nombre} {v.chofer.apellido}
                      {v.mercaderia ? ` · ${v.mercaderia}` : ""}
                    </p>
                  </div>
                  <p className="font-semibold text-sm shrink-0">{formatearMoneda(v.tarifaBase)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sección 2: Liquidaciones emitidas */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold">Liquidaciones emitidas</h3>
          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-700">
            {liquidaciones.length}
          </span>
        </div>
        {liquidaciones.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Sin liquidaciones</CardTitle>
              <CardDescription>No hay liquidaciones registradas.</CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="space-y-3">
            {liquidaciones.map((liq) => {
              const pagado = liq.pagos.reduce((acc, p) => acc + p.monto, 0)
              const estadoPago = liq.estado === "PAGADA" || pagado >= liq.total ? "PAGADO" : "PENDIENTE"
              return (
                <Card key={liq.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold truncate">{liq.fletero.razonSocial}</p>
                          <EstadoBadge estado={liq.estado} />
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${estadoPago === "PAGADO" ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}`}>
                            Pago: {estadoPago}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {formatearFecha(liq.grabadaEn)} · {liq._count.viajes} viaje{liq._count.viajes !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <div className="text-right shrink-0 flex items-center gap-3">
                        <div>
                          <p className="font-bold text-lg">{formatearMoneda(liq.total)}</p>
                          <p className="text-xs text-muted-foreground">Neto: {formatearMoneda(liq.neto)}</p>
                        </div>
                        <a
                          href={`/api/liquidaciones/${liq.id}/pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="h-8 px-3 rounded-md border text-xs font-medium inline-flex items-center hover:bg-accent"
                        >
                          PDF
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
