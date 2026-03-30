/**
 * Propósito: Página de gestión de viajes de Transmagg.
 * Los operadores cargan viajes; luego se asocian a liquidaciones y facturas de forma independiente.
 * Incluye filtros por fletero, empresa, rango de fechas y tres tabs de vista.
 * PRINCIPIO ABM: el operador SELECCIONA entidades, NUNCA las crea desde aquí.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { puedeAcceder, esRolInterno, esRolEmpresa } from "@/lib/permissions"
import { formatearMoneda, formatearFecha } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { NuevoViajeButton } from "@/components/layout/nuevo-viaje-button"
import type { Rol } from "@/types"

const BADGE_ESTADO: Record<string, "warning" | "info" | "success" | "destructive" | "secondary"> = {
  PENDIENTE: "warning",
  EN_LIQUIDACION: "info",
  EN_FACTURA: "info",
  COMPLETO: "success",
}

type Vista = "todos" | "pend_liquidacion" | "pend_facturacion"

const VISTAS: { id: Vista; label: string }[] = [
  { id: "todos", label: "Todos los viajes" },
  { id: "pend_liquidacion", label: "Pendientes de liquidación" },
  { id: "pend_facturacion", label: "Pendientes de facturación" },
]

/**
 * ViajesPage: ({ searchParams }) -> Promise<JSX.Element>
 *
 * Lista los viajes con filtros por rol, fletero, empresa, rango de fechas y vista.
 * Tres tabs: todos / pendientes de liquidación / pendientes de facturación.
 * El botón "Nuevo viaje" solo aparece para roles internos; en el formulario
 * se SELECCIONAN entidades existentes sin poder crearlas.
 * Existe para mostrar la cartera de viajes y su estado operativo.
 *
 * Ejemplos:
 * // Sesión ADMIN_TRANSMAGG, ?vista=pend_liquidacion → viajes PENDIENTE o EN_FACTURA
 * <ViajesPage searchParams={{ vista: "pend_liquidacion" }} />
 * // Sesión FLETERO → solo sus viajes, sin filtros de empresa/fletero
 * <ViajesPage searchParams={{}} />
 * // Sesión CHOFER sin permiso → redirect /dashboard
 * <ViajesPage searchParams={{}} />
 */
export default async function ViajesPage({
  searchParams,
}: {
  searchParams: { fleteroId?: string; empresaId?: string; desde?: string; hasta?: string; vista?: string }
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const rol = (session.user.rol ?? "OPERADOR_EMPRESA") as Rol
  if (!puedeAcceder(rol, "viajes")) redirect("/dashboard")

  const vista = (searchParams.vista as Vista) ?? "todos"
  const vistaValida = VISTAS.some((v) => v.id === vista) ? vista : "todos"

  // Filtro base según rol
  let whereClause: Record<string, unknown> = {}
  if (rol === "FLETERO") {
    whereClause = { fletero: { usuario: { email: session.user.email ?? "" } } }
  } else if (rol === "CHOFER") {
    whereClause = { chofer: { email: session.user.email ?? "" } }
  } else if (esRolEmpresa(rol)) {
    const empUsr = await prisma.empresaUsuario.findFirst({
      where: { usuario: { email: session.user.email ?? "" } },
      select: { empresaId: true },
    })
    if (empUsr) whereClause = { empresaId: empUsr.empresaId }
  }

  // Filtros adicionales (solo para roles internos)
  if (esRolInterno(rol)) {
    if (searchParams.fleteroId) whereClause.fleteroId = searchParams.fleteroId
    if (searchParams.empresaId) whereClause.empresaId = searchParams.empresaId
    if (searchParams.desde || searchParams.hasta) {
      const fechaWhere: Record<string, Date> = {}
      if (searchParams.desde) fechaWhere.gte = new Date(searchParams.desde)
      if (searchParams.hasta) {
        const hasta = new Date(searchParams.hasta)
        hasta.setHours(23, 59, 59, 999)
        fechaWhere.lte = hasta
      }
      whereClause.fechaViaje = fechaWhere
    }
  }

  // Filtro por vista
  if (vistaValida === "pend_liquidacion") {
    // Sin líquido producto al fletero = PENDIENTE o EN_FACTURA (no EN_LIQUIDACION, no COMPLETO)
    whereClause.estado = { in: ["PENDIENTE", "EN_FACTURA"] }
  } else if (vistaValida === "pend_facturacion") {
    // Sin factura generada = PENDIENTE o EN_LIQUIDACION
    whereClause.estado = { in: ["PENDIENTE", "EN_LIQUIDACION"] }
  }

  const [viajes, fleteros, empresas, camiones, choferes] = await Promise.all([
    prisma.viaje.findMany({
      where: whereClause,
      include: {
        fletero: { select: { razonSocial: true } },
        camion: { select: { patenteChasis: true } },
        chofer: { select: { nombre: true, apellido: true } },
        empresa: { select: { razonSocial: true } },
      },
      orderBy: { fechaViaje: "desc" },
      take: 200,
    }),
    esRolInterno(rol)
      ? prisma.fletero.findMany({ where: { activo: true }, select: { id: true, razonSocial: true }, orderBy: { razonSocial: "asc" } })
      : [],
    esRolInterno(rol)
      ? prisma.empresa.findMany({ where: { activa: true }, select: { id: true, razonSocial: true }, orderBy: { razonSocial: "asc" } })
      : [],
    esRolInterno(rol)
      ? prisma.camion.findMany({ where: { activo: true }, select: { id: true, patenteChasis: true, fleteroId: true }, orderBy: { patenteChasis: "asc" } })
      : [],
    esRolInterno(rol)
      ? prisma.usuario.findMany({ where: { rol: "CHOFER", activo: true }, select: { id: true, nombre: true, apellido: true }, orderBy: { apellido: "asc" } })
      : [],
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Viajes</h2>
          <p className="text-muted-foreground">
            {esRolInterno(rol)
              ? "Viajes cargados en el sistema. Asocialos a liquidaciones y facturas de forma independiente."
              : "Tus viajes registrados en el sistema."}
          </p>
        </div>
        {esRolInterno(rol) && (
          <NuevoViajeButton
            fleteros={fleteros}
            camiones={camiones}
            choferes={choferes}
            empresas={empresas}
          />
        )}
      </div>

      {/* Filtros — solo roles internos */}
      {esRolInterno(rol) && (
        <form method="GET" action="/viajes" className="flex flex-wrap gap-3 p-4 bg-muted/40 rounded-lg border">
          <div className="flex flex-col gap-1 min-w-[160px]">
            <label className="text-xs font-medium text-muted-foreground">Fletero</label>
            <select name="fleteroId" defaultValue={searchParams.fleteroId ?? ""} className="h-9 rounded-md border bg-background px-2 text-sm">
              <option value="">Todos</option>
              {fleteros.map((f) => <option key={f.id} value={f.id}>{f.razonSocial}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1 min-w-[160px]">
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
          <input type="hidden" name="vista" value={vistaValida} />
          <div className="flex items-end gap-2">
            <button type="submit" className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
              Filtrar
            </button>
            <a href="/viajes" className="h-9 px-4 rounded-md border text-sm font-medium inline-flex items-center hover:bg-accent">
              Limpiar
            </a>
          </div>
        </form>
      )}

      {/* Tabs de vista */}
      <div className="border-b">
        <nav className="flex gap-0 -mb-px">
          {VISTAS.map((v) => {
            const params = new URLSearchParams({
              ...(searchParams.fleteroId ? { fleteroId: searchParams.fleteroId } : {}),
              ...(searchParams.empresaId ? { empresaId: searchParams.empresaId } : {}),
              ...(searchParams.desde ? { desde: searchParams.desde } : {}),
              ...(searchParams.hasta ? { hasta: searchParams.hasta } : {}),
              vista: v.id,
            })
            return (
              <a
                key={v.id}
                href={`/viajes?${params.toString()}`}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  vistaValida === v.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"
                }`}
              >
                {v.label}
              </a>
            )
          })}
        </nav>
      </div>

      {viajes.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Sin viajes</CardTitle>
            <CardDescription>No hay viajes que coincidan con los filtros aplicados.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{viajes.length} viaje(s)</p>
          {viajes.map((v) => (
            <Card key={v.id}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{v.fletero.razonSocial}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="font-medium">{v.empresa.razonSocial}</span>
                      <Badge variant={BADGE_ESTADO[v.estado] ?? "secondary"}>{v.estado}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground flex flex-wrap gap-x-3">
                      <span>{formatearFecha(v.fechaViaje)}</span>
                      <span>{v.camion.patenteChasis}</span>
                      <span>{v.chofer.nombre} {v.chofer.apellido}</span>
                      {v.mercaderia && <span>{v.mercaderia}</span>}
                      {v.kilos && <span>{v.kilos.toLocaleString("es-AR")} kg</span>}
                      {v.provinciaOrigen && v.provinciaDestino && (
                        <span>{v.provinciaOrigen} → {v.provinciaDestino}</span>
                      )}
                    </div>
                    {v.remito && (
                      <p className="text-xs text-muted-foreground">Remito: {v.remito}</p>
                    )}
                  </div>
                  {esRolInterno(rol) && (
                    <div className="text-right shrink-0">
                      <p className="font-bold">{formatearMoneda(v.tarifaBase)}</p>
                      <p className="text-xs text-muted-foreground">tarifa base</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
