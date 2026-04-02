"use client"

/**
 * Propósito: Formulario multi-paso para crear un Recibo de Cobranza.
 *
 * Paso 1: Seleccionar empresa
 * Paso 2: Seleccionar facturas pendientes
 * Paso 3: Ingresar retenciones y medios de pago
 * Paso 4: Confirmar y emitir
 */

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { SearchCombobox } from "@/components/ui/search-combobox"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Empresa {
  id: string
  razonSocial: string
  cuit: string
}

interface Cuenta {
  id: string
  nombre: string
  bancoOEntidad: string
}

interface FacturaPendiente {
  id: string
  nroComprobante: string | null
  tipoCbte: number
  total: number
  emitidaEn: string
  neto: number
  ivaMonto: number
}

interface MedioPago {
  tipo: "TRANSFERENCIA" | "ECHEQ" | "CHEQUE_FISICO"
  monto: string
  cuentaId?: string
  fechaTransferencia?: string
  referencia?: string
  nroCheque?: string
  bancoEmisor?: string
  fechaEmision?: string
  fechaPago?: string
}

interface NuevoReciboClientProps {
  empresas: Empresa[]
  cuentas: Cuenta[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(n)
}

function fmtFecha(s: string) {
  return new Date(s).toLocaleDateString("es-AR")
}

function tipoCbteLabel(t: number) {
  if (t === 1) return "Fact. A"
  if (t === 6) return "Fact. B"
  if (t === 201) return "Fact. A MiPyme"
  return `Cbte ${t}`
}

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function NuevoReciboClient({ empresas, cuentas }: NuevoReciboClientProps) {
  const router = useRouter()
  const [paso, setPaso] = useState(1)

  // Paso 1
  const [empresaId, setEmpresaId] = useState("")

  // Paso 2
  const [facturas, setFacturas] = useState<FacturaPendiente[]>([])
  const [loadingFacturas, setLoadingFacturas] = useState(false)
  const [errorFacturas, setErrorFacturas] = useState<string | null>(null)
  const [seleccionadas, setSeleccionadas] = useState<Set<string>>(new Set())

  // Paso 3
  const [fecha, setFecha] = useState(todayIso())
  const [retGanancias, setRetGanancias] = useState("")
  const [retIIBB, setRetIIBB] = useState("")
  const [retSUSS, setRetSUSS] = useState("")
  const [medios, setMedios] = useState<MedioPago[]>([
    { tipo: "TRANSFERENCIA", monto: "", cuentaId: "", fechaTransferencia: todayIso(), referencia: "" },
  ])

  // Paso 4 / resultado
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reciboCreado, setReciboCreado] = useState<{ id: string; nro: number } | null>(null)
  const [loadingPDF, setLoadingPDF] = useState(false)

  // ─── Cargar facturas cuando cambia la empresa ─────────────────────────────

  const cargarFacturas = useCallback(async (eId: string) => {
    if (!eId) return
    setLoadingFacturas(true)
    setErrorFacturas(null)
    try {
      const res = await fetch(`/api/facturas-pendientes?empresaId=${eId}`)
      if (!res.ok) throw new Error("Error cargando facturas")
      const data: FacturaPendiente[] = await res.json()
      setFacturas(data)
      setSeleccionadas(new Set())
    } catch {
      setErrorFacturas("No se pudieron cargar las facturas pendientes")
    } finally {
      setLoadingFacturas(false)
    }
  }, [])

  useEffect(() => {
    if (empresaId) cargarFacturas(empresaId)
    else setFacturas([])
  }, [empresaId, cargarFacturas])

  // ─── Cálculos ─────────────────────────────────────────────────────────────

  const facturasSeleccionadas = facturas.filter((f) => seleccionadas.has(f.id))
  const totalComprobantes = facturasSeleccionadas.reduce((s, f) => s + f.total, 0)
  const retGananciasNum = parseFloat(retGanancias) || 0
  const retIIBBNum = parseFloat(retIIBB) || 0
  const retSUSSNum = parseFloat(retSUSS) || 0
  const totalRetenciones = retGananciasNum + retIIBBNum + retSUSSNum
  const totalMedios = medios.reduce((s, m) => s + (parseFloat(m.monto) || 0), 0)
  const diferencia = totalComprobantes - totalRetenciones - totalMedios

  // ─── Medios de pago ───────────────────────────────────────────────────────

  function agregarMedio() {
    setMedios([...medios, { tipo: "TRANSFERENCIA", monto: "", cuentaId: "", fechaTransferencia: todayIso() }])
  }

  function quitarMedio(i: number) {
    setMedios(medios.filter((_, idx) => idx !== i))
  }

  function actualizarMedio(i: number, campo: keyof MedioPago, valor: string) {
    setMedios(medios.map((m, idx) => (idx === i ? { ...m, [campo]: valor } : m)))
  }

  // ─── Selección de facturas ────────────────────────────────────────────────

  function toggleFactura(id: string) {
    setSeleccionadas((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function seleccionarTodas() {
    setSeleccionadas(new Set(facturas.map((f) => f.id)))
  }

  function deseleccionarTodas() {
    setSeleccionadas(new Set())
  }

  // ─── Envío ────────────────────────────────────────────────────────────────

  async function handleEmitir() {
    setLoading(true)
    setError(null)
    try {
      const body = {
        empresaId,
        facturaIds: Array.from(seleccionadas),
        mediosPago: medios.map((m) => ({
          tipo: m.tipo,
          monto: parseFloat(m.monto) || 0,
          cuentaId: m.cuentaId || undefined,
          fechaTransferencia: m.fechaTransferencia || undefined,
          referencia: m.referencia || undefined,
          nroCheque: m.nroCheque || undefined,
          bancoEmisor: m.bancoEmisor || undefined,
          fechaEmision: m.fechaEmision || undefined,
          fechaPago: m.fechaPago || undefined,
        })),
        retencionGanancias: retGananciasNum,
        retencionIIBB: retIIBBNum,
        retencionSUSS: retSUSSNum,
        fecha,
      }

      const res = await fetch("/api/recibos-cobranza", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? "Error al crear el recibo")
      }

      const data = await res.json()
      setReciboCreado(data)
      setPaso(5)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  async function verPDF() {
    if (!reciboCreado) return
    setLoadingPDF(true)
    try {
      const res = await fetch(`/api/recibos-cobranza/${reciboCreado.id}/pdf`)
      if (!res.ok) throw new Error("Error obteniendo PDF")
      const { url } = await res.json()
      window.open(url, "_blank")
    } catch {
      alert("No se pudo obtener el PDF")
    } finally {
      setLoadingPDF(false)
    }
  }

  // ─── Renderizado por paso ─────────────────────────────────────────────────

  const empresaItem = empresas.map((e) => ({ id: e.id, label: e.razonSocial, sublabel: e.cuit }))

  // Paso 1: Seleccionar empresa
  if (paso === 1) {
    return (
      <div className="max-w-lg mx-auto mt-8">
        <h1 className="text-2xl font-bold mb-6">Nuevo Recibo de Cobranza</h1>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Paso 1 — Seleccionar empresa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Empresa</Label>
              <SearchCombobox
                items={empresaItem}
                value={empresaId}
                onChange={setEmpresaId}
                placeholder="Buscar empresa..."
              />
            </div>
            <Button disabled={!empresaId} onClick={() => setPaso(2)}>
              Siguiente
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Paso 2: Seleccionar facturas
  if (paso === 2) {
    const empresa = empresas.find((e) => e.id === empresaId)
    return (
      <div className="max-w-3xl mx-auto mt-8">
        <h1 className="text-2xl font-bold mb-2">Nuevo Recibo de Cobranza</h1>
        <p className="text-muted-foreground mb-6">
          Empresa: <span className="font-semibold">{empresa?.razonSocial}</span>
        </p>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Paso 2 — Facturas pendientes</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={seleccionarTodas}>
                Todas
              </Button>
              <Button variant="outline" size="sm" onClick={deseleccionarTodas}>
                Ninguna
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadingFacturas ? (
              <p className="text-muted-foreground text-sm">Cargando facturas...</p>
            ) : errorFacturas ? (
              <p className="text-destructive text-sm">{errorFacturas}</p>
            ) : facturas.length === 0 ? (
              <p className="text-muted-foreground text-sm">No hay facturas pendientes para esta empresa.</p>
            ) : (
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-3 w-8"></th>
                    <th className="text-left py-2 pr-3">Fecha</th>
                    <th className="text-left py-2 pr-3">Tipo</th>
                    <th className="text-left py-2 pr-3">Nro. Comprobante</th>
                    <th className="text-right py-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {facturas.map((f) => (
                    <tr
                      key={f.id}
                      className="border-b hover:bg-muted/40 cursor-pointer"
                      onClick={() => toggleFactura(f.id)}
                    >
                      <td className="py-2 pr-3">
                        <input
                          type="checkbox"
                          checked={seleccionadas.has(f.id)}
                          onChange={() => toggleFactura(f.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
                      <td className="py-2 pr-3">{fmtFecha(f.emitidaEn)}</td>
                      <td className="py-2 pr-3">{tipoCbteLabel(f.tipoCbte)}</td>
                      <td className="py-2 pr-3">{f.nroComprobante ?? "—"}</td>
                      <td className="py-2 text-right font-mono">{fmt(f.total)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={4} className="py-2 font-semibold">
                      {seleccionadas.size} factura(s) seleccionada(s)
                    </td>
                    <td className="py-2 text-right font-bold font-mono">{fmt(totalComprobantes)}</td>
                  </tr>
                </tfoot>
              </table>
            )}

            <div className="flex gap-3 mt-4">
              <Button variant="outline" onClick={() => setPaso(1)}>
                Atrás
              </Button>
              <Button disabled={seleccionadas.size === 0} onClick={() => setPaso(3)}>
                Siguiente
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Paso 3: Retenciones y medios de pago
  if (paso === 3) {
    const saldoPorCubrir = diferencia
    const diferenciaBien = Math.abs(diferencia) < 0.01

    return (
      <div className="max-w-4xl mx-auto mt-8">
        <h1 className="text-2xl font-bold mb-6">Nuevo Recibo de Cobranza — Paso 3</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Panel izquierdo: resumen */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Resumen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Facturas seleccionadas:</span>
                <span className="font-semibold">{seleccionadas.size}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total comprobantes:</span>
                <span className="font-bold font-mono">{fmt(totalComprobantes)}</span>
              </div>
              <hr />

              <p className="text-sm font-semibold">Retenciones</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label className="w-32 text-xs">Ganancias</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={retGanancias}
                    onChange={(e) => setRetGanancias(e.target.value)}
                    placeholder="0.00"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="w-32 text-xs">IIBB</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={retIIBB}
                    onChange={(e) => setRetIIBB(e.target.value)}
                    placeholder="0.00"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="w-32 text-xs">SUSS</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={retSUSS}
                    onChange={(e) => setRetSUSS(e.target.value)}
                    placeholder="0.00"
                    className="h-8 text-sm"
                  />
                </div>
              </div>

              <hr />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total retenciones:</span>
                <span className="font-mono">{fmt(totalRetenciones)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total medios de pago:</span>
                <span className="font-mono">{fmt(totalMedios)}</span>
              </div>
              <div
                className={`flex justify-between text-sm font-bold ${
                  diferenciaBien ? "text-green-600" : "text-destructive"
                }`}
              >
                <span>{saldoPorCubrir > 0 ? "Por cubrir:" : saldoPorCubrir < 0 ? "Exceso:" : "Balanceado:"}</span>
                <span className="font-mono">{fmt(Math.abs(saldoPorCubrir))}</span>
              </div>

              <hr />
              <div className="space-y-1">
                <Label className="text-xs">Fecha del recibo</Label>
                <Input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            </CardContent>
          </Card>

          {/* Panel derecho: medios de pago */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Medios de Pago</CardTitle>
              <Button variant="outline" size="sm" onClick={agregarMedio}>
                + Agregar
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {medios.map((m, i) => (
                <div key={i} className="border rounded-md p-3 space-y-2 relative">
                  {medios.length > 1 && (
                    <button
                      type="button"
                      onClick={() => quitarMedio(i)}
                      className="absolute top-2 right-2 text-muted-foreground hover:text-destructive text-xs"
                    >
                      ✕
                    </button>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Tipo</Label>
                      <select
                        value={m.tipo}
                        onChange={(e) =>
                          actualizarMedio(i, "tipo", e.target.value as MedioPago["tipo"])
                        }
                        className="h-8 w-full rounded-md border bg-background px-2 text-sm"
                      >
                        <option value="TRANSFERENCIA">Transferencia</option>
                        <option value="ECHEQ">ECheq</option>
                        <option value="CHEQUE_FISICO">Cheque Físico</option>
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs">Monto</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={m.monto}
                        onChange={(e) => actualizarMedio(i, "monto", e.target.value)}
                        placeholder="0.00"
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>

                  {m.tipo === "TRANSFERENCIA" && (
                    <>
                      <div>
                        <Label className="text-xs">Cuenta destino</Label>
                        <select
                          value={m.cuentaId ?? ""}
                          onChange={(e) => actualizarMedio(i, "cuentaId", e.target.value)}
                          className="h-8 w-full rounded-md border bg-background px-2 text-sm"
                        >
                          <option value="">— Sin cuenta —</option>
                          {cuentas.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.nombre} ({c.bancoOEntidad})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Fecha transferencia</Label>
                          <Input
                            type="date"
                            value={m.fechaTransferencia ?? ""}
                            onChange={(e) => actualizarMedio(i, "fechaTransferencia", e.target.value)}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Referencia</Label>
                          <Input
                            value={m.referencia ?? ""}
                            onChange={(e) => actualizarMedio(i, "referencia", e.target.value)}
                            placeholder="Nro. CBU o ref."
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {(m.tipo === "ECHEQ" || m.tipo === "CHEQUE_FISICO") && (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Nro. Cheque</Label>
                          <Input
                            value={m.nroCheque ?? ""}
                            onChange={(e) => actualizarMedio(i, "nroCheque", e.target.value)}
                            placeholder="00000000"
                            className="h-8 text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Banco emisor</Label>
                          <Input
                            value={m.bancoEmisor ?? ""}
                            onChange={(e) => actualizarMedio(i, "bancoEmisor", e.target.value)}
                            placeholder="Banco..."
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Fecha emisión</Label>
                          <Input
                            type="date"
                            value={m.fechaEmision ?? ""}
                            onChange={(e) => actualizarMedio(i, "fechaEmision", e.target.value)}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Fecha vencimiento/pago</Label>
                          <Input
                            type="date"
                            value={m.fechaPago ?? ""}
                            onChange={(e) => actualizarMedio(i, "fechaPago", e.target.value)}
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-3 mt-6">
          <Button variant="outline" onClick={() => setPaso(2)}>
            Atrás
          </Button>
          <Button disabled={!diferenciaBien || seleccionadas.size === 0} onClick={() => setPaso(4)}>
            Siguiente
          </Button>
        </div>
      </div>
    )
  }

  // Paso 4: Confirmación
  if (paso === 4) {
    const empresa = empresas.find((e) => e.id === empresaId)
    const diferenciaBien = Math.abs(diferencia) < 0.01

    return (
      <div className="max-w-2xl mx-auto mt-8">
        <h1 className="text-2xl font-bold mb-6">Nuevo Recibo — Confirmar</h1>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resumen del Recibo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Empresa:</span>
              <span className="font-semibold">{empresa?.razonSocial}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fecha:</span>
              <span>{fmtFecha(fecha + "T00:00:00")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Facturas seleccionadas:</span>
              <span>{seleccionadas.size}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total comprobantes:</span>
              <span className="font-bold font-mono">{fmt(totalComprobantes)}</span>
            </div>
            {totalRetenciones > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total retenciones:</span>
                <span className="font-mono">{fmt(totalRetenciones)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total cobrado:</span>
              <span className="font-bold font-mono">{fmt(totalMedios)}</span>
            </div>
            <hr />
            <p className="font-semibold">Medios de pago:</p>
            {medios.map((m, i) => (
              <div key={i} className="flex justify-between">
                <span className="text-muted-foreground">
                  {m.tipo === "TRANSFERENCIA" ? "Transferencia" : m.tipo === "ECHEQ" ? "ECheq" : "Cheque Físico"}
                  {m.nroCheque ? ` Nro ${m.nroCheque}` : ""}
                  {m.bancoEmisor ? ` — ${m.bancoEmisor}` : ""}
                </span>
                <span className="font-mono">{fmt(parseFloat(m.monto) || 0)}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {error && (
          <div className="mt-4 p-3 bg-destructive/10 border border-destructive/30 rounded-md text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <Button variant="outline" onClick={() => setPaso(3)} disabled={loading}>
            Atrás
          </Button>
          <Button onClick={handleEmitir} disabled={loading || !diferenciaBien}>
            {loading ? "Emitiendo..." : "Emitir Recibo"}
          </Button>
        </div>
      </div>
    )
  }

  // Paso 5: Éxito
  if (paso === 5 && reciboCreado) {
    return (
      <div className="max-w-lg mx-auto mt-8 text-center space-y-6">
        <div className="text-5xl">✓</div>
        <h1 className="text-2xl font-bold">Recibo emitido</h1>
        <p className="text-muted-foreground">
          Recibo Nro <span className="font-mono font-semibold">0001-{String(reciboCreado.nro).padStart(8, "0")}</span> creado correctamente.
        </p>
        <div className="flex flex-col gap-3 items-center">
          <Button onClick={verPDF} disabled={loadingPDF} className="w-48">
            {loadingPDF ? "Cargando..." : "Ver PDF"}
          </Button>
          <Button variant="outline" onClick={() => router.push("/empresas/recibos")} className="w-48">
            Volver
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setEmpresaId("")
              setFacturas([])
              setSeleccionadas(new Set())
              setRetGanancias("")
              setRetIIBB("")
              setRetSUSS("")
              setMedios([{ tipo: "TRANSFERENCIA", monto: "", cuentaId: "", fechaTransferencia: todayIso() }])
              setFecha(todayIso())
              setReciboCreado(null)
              setError(null)
              setPaso(1)
            }}
            className="w-48"
          >
            Nuevo recibo
          </Button>
        </div>
      </div>
    )
  }

  return null
}
