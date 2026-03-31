"use client"

import { useState } from "react"
import { Printer } from "lucide-react"
import { SearchCombobox } from "@/components/ui/search-combobox"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatearMoneda, formatearFecha, formatearCuit } from "@/lib/utils"

type Empresa = { id: string; razonSocial: string; cuit: string }
type Movimiento = {
  fecha: string
  concepto: string
  comprobante: string
  debe: number
  haber: number
  saldo: number
}
type CCData = {
  empresa: Empresa
  movimientos: Movimiento[]
  totalDebe: number
  totalHaber: number
  saldoFinal: number
}

interface CCEmpresasClientProps {
  empresas: Empresa[]
}

/**
 * CCEmpresasClient: CCEmpresasClientProps -> JSX.Element
 *
 * Dado la lista de empresas activas, permite seleccionar una y un rango de fechas,
 * consulta la API de CC y muestra la tabla de movimientos cronológicos con saldo acumulado.
 * Existe para visualizar la cuenta corriente individual de cada empresa.
 *
 * Ejemplos:
 * <CCEmpresasClient empresas={[{ id: "e1", razonSocial: "ACME SA", cuit: "30..." }]} />
 * // => buscador de empresas + tabla de movimientos al filtrar
 */
export function CCEmpresasClient({ empresas }: CCEmpresasClientProps) {
  const hoy = new Date().toISOString().slice(0, 10)
  const noventa = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  const [empresaId, setEmpresaId] = useState("")
  const [desde, setDesde] = useState(noventa)
  const [hasta, setHasta] = useState(hoy)
  const [data, setData] = useState<CCData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFiltrar() {
    if (!empresaId) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/empresas/${empresaId}/cuenta-corriente?desde=${desde}&hasta=${hasta}`)
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
      <h1 className="text-2xl font-bold">Cuentas Corrientes — Empresas</h1>

      {/* Buscador */}
      <Card>
        <CardContent className="pt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="md:col-span-1">
              <Label>Empresa</Label>
              <SearchCombobox
                items={empresas.map((e) => ({
                  id: e.id,
                  label: e.razonSocial,
                  sublabel: formatearCuit(e.cuit),
                }))}
                value={empresaId}
                onChange={setEmpresaId}
                placeholder="Buscar empresa..."
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
            <Button onClick={handleFiltrar} disabled={!empresaId || loading}>
              {loading ? "Cargando..." : "Ver cuenta corriente"}
            </Button>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </CardContent>
      </Card>

      {!data && !loading && (
        <p className="text-muted-foreground text-center py-8">
          Seleccioná una empresa para ver su cuenta corriente.
        </p>
      )}

      {data && (
        <>
          {/* Header empresa + saldo */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-xl font-semibold">{data.empresa.razonSocial}</h2>
              <p className="text-muted-foreground text-sm">CUIT: {formatearCuit(data.empresa.cuit)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Saldo actual</p>
              <p
                className={`text-2xl font-bold ${
                  data.saldoFinal > 0
                    ? "text-foreground"
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
                  ? "Saldo deudor"
                  : data.saldoFinal < 0
                  ? "Saldo a favor de la empresa"
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
                        <td className="px-4 py-2">{mov.concepto}</td>
                        <td className="px-4 py-2 text-muted-foreground text-xs">{mov.comprobante}</td>
                        <td className="px-4 py-2 text-right">
                          {mov.debe > 0 ? formatearMoneda(mov.debe) : ""}
                        </td>
                        <td className="px-4 py-2 text-right text-green-700">
                          {mov.haber > 0 ? formatearMoneda(mov.haber) : ""}
                        </td>
                        <td
                          className={`px-4 py-2 text-right font-medium ${
                            mov.saldo < 0 ? "text-green-600" : ""
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
                      className={`px-4 py-3 text-right ${data.saldoFinal < 0 ? "text-green-600" : ""}`}
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
              ? `Saldo deudor: ${formatearMoneda(data.saldoFinal)} — La empresa debe este monto a Transmagg`
              : data.saldoFinal < 0
              ? `Saldo a favor de la empresa: ${formatearMoneda(Math.abs(data.saldoFinal))} — Se descontará en futuras facturas`
              : "Cuenta saldada"}
          </p>
        </>
      )}
    </div>
  )
}
