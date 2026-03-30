/**
 * Propósito: Página de gestión de facturas emitidas de Transmagg.
 * Muestra DOS secciones: viajes pendientes de facturación y facturas emitidas.
 * Incluye selector de empresa y filtro por rango de fechas.
 * SEGURIDAD: tarifa_empresa nunca visible para fleteros/choferes.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { puedeAcceder, esRolInterno, esRolEmpresa } from "@/lib/permissions"
import { formatearMoneda, formatearFecha } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { Rol } from "@/types"
import { NuevaFacturaButton } from "@/components/layout/nueva-factura-button"

/**
 * EstadoBadge: { estado: string } -> JSX.Element
 *
 * Dado el estado de una factura, devuelve un badge con color semántico.
 * Existe para visualizar el estado de forma consistente sin repetir estilos.
 *
 * Ejemplos:
 * <EstadoBadge estado="PENDIENTE" /> // => badge amarillo
 * <EstadoBadge estado="EMITIDA" />   // => badge azul
 * <EstadoBadge estado="COBRADA" />   // => badge verde
 */
function EstadoBadge({ estado }: { estado: string }) {
  const estilos: Record<string, string> = {
    PENDIENTE: "bg-yellow-100 text-yellow-800",
    EMITIDA: "bg-blue-100 text-blue-800",
    COBRADA: "bg-green-100 text-green-800",
    ANULADA: "bg-red-100 text-red-800",
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${estilos[estado] ?? "bg-gray-100 text-gray-800"}`}>
      {estado}
    </span>
  )
}

/**
 * FacturasPage: ({ searchParams }) -> Promise<JSX.Element>
 *
 * Muestra dos secciones: viajes pendientes de facturación (PENDIENTE o EN_LIQUIDACION)
 * y facturas emitidas. Filtra por empresa (selector) y rango de fechas.
 * Roles internos pueden crear nuevas facturas; empresas solo ven las suyas.
 * Existe para gestionar el proceso de facturación a empresas clientes.
 *
 * Ejemplos:
 * // Sesión ADMIN_TRANSMAGG, ?empresaId=e1 → viajes y facturas de esa empresa
 * <FacturasPage searchParams={{ empresaId: "e1" }} />
 * // Sesión ADMIN_EMPRESA → ve facturas de su empresa sin crear
 * <FacturasPage searchParams={{}} />
 * // Sesión FLETERO → redirect /dashboard
 * <FacturasPage searchParams={{}} />
 */
export default async function FacturasPage({
  searchParams,
}: {
  searchParams: { empresaId?: string; desde?: string; hasta?: string }
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const rol = (session.user.rol ?? "OPERADOR_EMPRESA") as Rol
  if (!puedeAcceder(rol, "facturas")) redirect("/dashboard")

  // Where base por rol empresa
  let whereEmpresaId: string | undefined
  if (esRolEmpresa(rol)) {
    const empUsr = await prisma.empresaUsuario.findFirst({
      where: { usuario: { email: session.user.email ?? "" } },
      select: { empresaId: true },
    })
    if (empUsr) whereEmpresaId = empUsr.empresaId
  } else if (esRolInterno(rol) && searchParams.empresaId) {
    whereEmpresaId = searchParams.empresaId
  }

  // Filtros de fechas
  const fechaWhere: Record<string, Date> = {}
  if (searchParams.desde) fechaWhere.gte = new Date(searchParams.desde)
  if (searchParams.hasta) {
    const hasta = new Date(searchParams.hasta)
    hasta.setHours(23, 59, 59, 999)
    fechaWhere.lte = hasta
  }

  const whereFacturas: Record<string, unknown> = {}
  if (whereEmpresaId) whereFacturas.empresaId = whereEmpresaId
  if (Object.keys(fechaWhere).length > 0) whereFacturas.emitidaEn = fechaWhere

  const [facturas, empresas, viajesPendientes] = await Promise.all([
    prisma.facturaEmitida.findMany({
      where: whereFacturas,
      include: {
        empresa: { select: { razonSocial: true } },
        _count: { select: { viajes: true } },
        pagos: { select: { monto: true } },
      },
      orderBy: { emitidaEn: "desc" },
      take: 100,
    }),
    esRolInterno(rol)
      ? prisma.empresa.findMany({
          where: { activa: true },
          select: { id: true, razonSocial: true },
          orderBy: { razonSocial: "asc" },
        })
      : [],
    esRolInterno(rol)
      ? prisma.viaje.findMany({
          where: {
            // Pendiente de facturación = no tiene factura aún
            estado: { in: ["PENDIENTE", "EN_LIQUIDACION"] },
            ...(whereEmpresaId ? { empresaId: whereEmpresaId } : {}),
          },
          select: {
            id: true,
            fechaViaje: true,
            remito: true,
            mercaderia: true,
            provinciaOrigen: true,
            provinciaDestino: true,
            kilos: true,
            tarifaBase: true,
            empresaId: true,
            estado: true,
            fletero: { select: { razonSocial: true } },
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
          <h2 className="text-2xl font-bold tracking-tight">Facturas emitidas</h2>
          <p className="text-muted-foreground">
            {esRolEmpresa(rol)
              ? "Facturas de tu empresa"
              : "Gestión de facturas emitidas a empresas clientes"}
          </p>
        </div>
        {esRolInterno(rol) && (
          <NuevaFacturaButton empresas={empresas} viajesPendientes={viajesPendientes} />
        )}
      </div>

      {/* Filtros — solo roles internos */}
      {esRolInterno(rol) && (
        <form method="GET" action="/facturas" className="flex flex-wrap gap-3 p-4 bg-muted/40 rounded-lg border">
          <div className="flex flex-col gap-1 min-w-[200px]">
            <label className="text-xs font-medium text-muted-foreground">Empresa</label>
            <select name="empresaId" defaultValue={searchParams.empresaId ?? ""} className="h-9 rounded-md border bg-background px-2 text-sm">
              <option value="">Todas</option>
              {empresas.map((e) => <option key={e.id} value={e.id}>{e.razonSocial}</option>)}
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
            <a href="/facturas" className="h-9 px-4 rounded-md border text-sm font-medium inline-flex items-center hover:bg-accent">Limpiar</a>
          </div>
        </form>
      )}

      {/* Sección 1: Viajes pendientes de facturación */}
      {esRolInterno(rol) && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold">Viajes pendientes de facturación</h3>
            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800">
              {viajesPendientes.length}
            </span>
          </div>
          {viajesPendientes.length === 0 ? (
            <Card>
              <CardContent className="pt-4">
                <p className="text-muted-foreground text-center py-3">
                  Sin viajes pendientes de facturación
                  {searchParams.empresaId ? " para la empresa seleccionada" : ""}.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="border rounded-lg divide-y">
              {viajesPendientes.map((v) => (
                <div key={v.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{v.fletero.razonSocial}</p>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${v.estado === "EN_LIQUIDACION" ? "bg-blue-100 text-blue-800" : "bg-yellow-100 text-yellow-800"}`}>
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

      {/* Sección 2: Facturas emitidas */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold">Facturas emitidas</h3>
          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-700">
            {facturas.length}
          </span>
        </div>
        {facturas.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Sin facturas</CardTitle>
              <CardDescription>No hay facturas registradas en el sistema.</CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="space-y-3">
            {facturas.map((factura) => {
              const pagado = factura.pagos.reduce((acc, p) => acc + p.monto, 0)
              const estadoPago = factura.estado === "COBRADA" || pagado >= factura.total ? "PAGADO" : "PENDIENTE"
              return (
                <Card key={factura.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold truncate">{factura.empresa.razonSocial}</p>
                          <EstadoBadge estado={factura.estado} />
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${estadoPago === "PAGADO" ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}`}>
                            Pago: {estadoPago}
                          </span>
                          {factura.nroComprobante && (
                            <span className="text-xs text-muted-foreground">#{factura.nroComprobante}</span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {formatearFecha(factura.emitidaEn)} · {factura._count.viajes} viaje{factura._count.viajes !== 1 ? "s" : ""} · Tipo {factura.tipoCbte}
                        </p>
                      </div>
                      <div className="text-right shrink-0 flex items-center gap-3">
                        <div>
                          <p className="font-bold text-lg">{formatearMoneda(factura.total)}</p>
                          <p className="text-xs text-muted-foreground">IVA: {formatearMoneda(factura.ivaMonto)}</p>
                        </div>
                        <a
                          href={`/api/facturas/${factura.id}/pdf`}
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
