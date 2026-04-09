"use client"

import { useState } from "react"
import { Printer } from "lucide-react"
import { SearchCombobox } from "@/components/ui/search-combobox"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatearMoneda, formatearFecha, formatearCuit } from "@/lib/utils"
import { hoyLocalYmd } from "@/lib/date-local"

type Proveedor = { id: string; razonSocial: string; cuit: string }
type Movimiento = {
  fecha: string
  concepto: string
  comprobante: string
  debe: number
  haber: number
  saldo: number
  esPorCuentaDeFletero?: boolean
  fleteroRazonSocial?: string | null
}
type CCData = {
  proveedor: Proveedor
  movimientos: Movimiento[]
  totalDebe: number
  totalHaber: number
  saldoFinal: number
}

interface CCProveedoresClientProps {
  proveedores: Proveedor[]
}

/**
 * CCProveedoresClient: CCProveedoresClientProps -> JSX.Element
 *
 * Dado la lista de proveedores activos, permite seleccionar uno y un rango de fechas,
 * consulta la API de CC y muestra la tabla de movimientos cronológicos con saldo acumulado.
 * En proveedor CC: DEBE = Transmagg le debe al proveedor, HABER = ya fue pagado.
 * Saldo > 0 = Transmagg debe dinero al proveedor.
 * Existe para visualizar la cuenta corriente individual de cada proveedor.
 *
 * Ejemplos:
 * <CCProveedoresClient proveedores={[{ id: "p1", razonSocial: "Dist. SA", cuit: "30..." }]} />
 * // => buscador de proveedores + tabla de movimientos al filtrar
 */
export function CCProveedoresClient({ proveedores }: CCProveedoresClientProps) {
  const hoy = hoyLocalYmd()
  const noventa = hoyLocalYmd(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000))

  const [proveedorId, setProveedorId] = useState("")
  const [desde, setDesde] = useState(noventa)
  const [hasta, setHasta] = useState(hoy)
  const [data, setData] = useState<CCData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFiltrar() {
    if (!proveedorId) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/proveedores/${proveedorId}/cuenta-corriente?desde=${desde}&hasta=${hasta}`)
      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error ?? "Error al cargar cuenta corriente")
      }
      const json = await res.json()
      setData(json)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Cuentas Corrientes — Proveedores</h1>

      {/* Buscador */}
      <Card>
        <CardContent className="pt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="md:col-span-1">
              <Label>Proveedor</Label>
              <SearchCombobox
                items={proveedores.map((p) => ({
                  id: p.id,
                  label: p.razonSocial,
                  sublabel: formatearCuit(p.cuit),
                }))}
                value={proveedorId}
                onChange={setProveedorId}
                placeholder="Buscar proveedor..."
              />
            </div>
            <div>
              <Label>Desde</Label>
              <Input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
            </div>
            <div>
              <Label>Hasta</Label>
              <Input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleFiltrar} disabled={!proveedorId || loading}>
              {loading ? "Cargando..." : "Ver cuenta corriente"}
            </Button>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </CardContent>
      </Card>

      {!data && !loading && (
        <p className="text-muted-foreground text-center py-8">
          Seleccioná un proveedor para ver su cuenta corriente.
        </p>
      )}

      {data && (
        <>
          {/* Header proveedor + saldo */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-xl font-semibold">{data.proveedor.razonSocial}</h2>
              <p className="text-muted-foreground text-sm">CUIT: {formatearCuit(data.proveedor.cuit)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Saldo actual</p>
              <p
                className={`text-2xl font-bold ${
                  data.saldoFinal > 0
                    ? "text-red-600"
                    : data.saldoFinal < 0
                    ? "text-green-600"
                    : "text-muted-foreground"
                }`}
              >
                {data.saldoFinal > 0
                  ? formatearMoneda(data.saldoFinal)
                  : data.saldoFinal < 0
                  ? `- ${formatearMoneda(Math.abs(data.saldoFinal))}`
                  : "$0"}
              </p>
              <p className="text-xs text-muted-foreground">
                {data.saldoFinal > 0
                  ? "Deuda de Transmagg al proveedor"
                  : data.saldoFinal < 0
                  ? "Saldo a favor de Transmagg"
                  : "Cuenta saldada"}
              </p>
            </div>
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-2" /> Imprimir
            </Button>
          </div>

          {/* Tabla de movimientos */}
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left">Fecha</th>
                    <th className="px-4 py-3 text-left">Concepto</th>
                    <th className="px-4 py-3 text-left">Comprobante</th>
                    <th className="px-4 py-3 text-right">Debe</th>
                    <th className="px-4 py-3 text-right text-green-700">Haber</th>
                    <th className="px-4 py-3 text-right">Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {data.movimientos.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                        Sin movimientos en el período
                      </td>
                    </tr>
                  ) : (
                    data.movimientos.map((mov, i) => (
                      <tr key={i} className="border-b hover:bg-muted/30">
                        <td className="px-4 py-2 text-muted-foreground">{formatearFecha(mov.fecha)}</td>
                        <td className="px-4 py-2">
                          <span>{mov.concepto}</span>
                          {mov.esPorCuentaDeFletero && mov.fleteroRazonSocial && (
                            <span className="ml-2 inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800">
                              {mov.fleteroRazonSocial}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-muted-foreground text-xs">{mov.comprobante}</td>
                        <td className="px-4 py-2 text-right">
                          {mov.debe > 0 ? formatearMoneda(mov.debe) : ""}
                        </td>
                        <td className="px-4 py-2 text-right text-green-700">
                          {mov.haber > 0 ? formatearMoneda(mov.haber) : ""}
                        </td>
                        <td
                          className={`px-4 py-2 text-right font-medium ${
                            mov.saldo > 0 ? "text-red-600" : mov.saldo < 0 ? "text-green-600" : ""
                          }`}
                        >
                          {mov.saldo < 0
                            ? `- ${formatearMoneda(Math.abs(mov.saldo))}`
                            : formatearMoneda(mov.saldo)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-muted font-semibold border-t-2">
                    <td colSpan={3} className="px-4 py-3 text-right">
                      Totales del período
                    </td>
                    <td className="px-4 py-3 text-right">{formatearMoneda(data.totalDebe)}</td>
                    <td className="px-4 py-3 text-right text-green-700">
                      {formatearMoneda(data.totalHaber)}
                    </td>
                    <td
                      className={`px-4 py-3 text-right ${
                        data.saldoFinal > 0 ? "text-red-600" : data.saldoFinal < 0 ? "text-green-600" : ""
                      }`}
                    >
                      {data.saldoFinal < 0
                        ? `- ${formatearMoneda(Math.abs(data.saldoFinal))}`
                        : formatearMoneda(data.saldoFinal)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </CardContent>
          </Card>

          {/* Leyenda saldo */}
          <p className="text-sm font-medium text-center py-2 rounded-md border">
            {data.saldoFinal > 0
              ? `Deuda de Transmagg: ${formatearMoneda(data.saldoFinal)} — Transmagg debe esta suma al proveedor`
              : data.saldoFinal < 0
              ? `Saldo a favor de Transmagg: ${formatearMoneda(Math.abs(data.saldoFinal))} — El proveedor tiene un saldo a favor`
              : "Cuenta saldada — Sin deuda pendiente"}
          </p>
        </>
      )}
    </div>
  )
}
