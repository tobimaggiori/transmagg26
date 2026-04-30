/**
 * Propósito: Página de asientos de Ingresos Brutos (IIBB) de Transmagg.
 * Muestra los asientos de IIBB agrupados por provincia.
 * La base imponible es el ingreso total del viaje en la provincia de origen.
 * Solo accesible para ADMIN_TRANSMAGG y OPERADOR_TRANSMAGG.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { tienePermiso } from "@/lib/permissions"
import { formatearMoneda } from "@/lib/utils"
import { sumarImportes } from "@/lib/money"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { Rol } from "@/types"

/**
 * IibbPage: () -> Promise<JSX.Element>
 *
 * Muestra los asientos de Ingresos Brutos agrupados por provincia,
 * con la base imponible del ingreso por viaje según provincia de origen.
 * Solo accesible para roles internos; redirige a /dashboard si no tiene permiso.
 * Existe para el seguimiento del IIBB de cada jurisdicción donde opera Transmagg.
 *
 * Ejemplos:
 * // Sesión ADMIN_TRANSMAGG → tabla con asientos IIBB agrupados por provincia
 * <IibbPage />
 * // Sesión OPERADOR_EMPRESA → redirect /dashboard
 * <IibbPage />
 * // Sin sesión → redirect /login
 * <IibbPage />
 */
export default async function IibbPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  const rol = (session.user.rol ?? "OPERADOR_EMPRESA") as Rol

  if (!(await tienePermiso(session.user.id, rol, "iibb"))) {
    redirect("/dashboard")
  }

  const asientos = await prisma.asientoIibb.findMany({
    orderBy: [{ periodo: "desc" }, { provincia: "asc" }],
    take: 200,
  })

  // Agrupar por provincia para el resumen
  const agrupado = asientos.reduce(
    (acc, asiento) => {
      const key = asiento.provincia
      if (!acc[key]) acc[key] = [] as typeof asientos
      acc[key].push(asiento)
      return acc
    },
    {} as Record<string, typeof asientos>
  )
  const porProvincia = Object.fromEntries(
    Object.entries(agrupado).map(([key, arr]) => [
      key,
      { montoIngreso: sumarImportes(arr.map(a => a.montoIngreso)), count: arr.length },
    ])
  ) as Record<string, { montoIngreso: number; count: number }>

  const totalIngresos = sumarImportes(asientos.map(a => a.montoIngreso))

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Ingresos Brutos (IIBB)
        </h2>
        <p className="text-muted-foreground">
          Asientos de IIBB por provincia de origen del viaje
        </p>
      </div>

      {/* Resumen total */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total base imponible
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{formatearMoneda(totalIngresos)}</p>
        </CardContent>
      </Card>

      {/* Resumen por provincia */}
      {Object.keys(porProvincia).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resumen por provincia</CardTitle>
            <CardDescription>
              Base imponible acumulada por provincia de origen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(porProvincia)
                .sort(([, a], [, b]) => b.montoIngreso - a.montoIngreso)
                .map(([provincia, datos]) => (
                  <div
                    key={provincia}
                    className="flex items-center justify-between rounded-lg border p-3 text-sm"
                  >
                    <div>
                      <p className="font-medium">{provincia}</p>
                      <p className="text-muted-foreground">
                        {datos.count} asiento{datos.count !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <p className="font-semibold">
                      {formatearMoneda(datos.montoIngreso)}
                    </p>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de asientos */}
      {asientos.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Sin asientos de IIBB</CardTitle>
            <CardDescription>
              No hay asientos de Ingresos Brutos registrados.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Detalle de asientos</CardTitle>
            <CardDescription>
              Últimos {asientos.length} asientos de IIBB
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {asientos.map((asiento) => (
                <div
                  key={asiento.id}
                  className="flex items-center justify-between rounded-lg border p-3 text-sm"
                >
                  <div>
                    <p className="font-medium">{asiento.provincia}</p>
                    <p className="text-muted-foreground">
                      {asiento.periodo} · {asiento.tablaOrigen}
                    </p>
                  </div>
                  <p className="font-semibold">
                    {formatearMoneda(asiento.montoIngreso)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
