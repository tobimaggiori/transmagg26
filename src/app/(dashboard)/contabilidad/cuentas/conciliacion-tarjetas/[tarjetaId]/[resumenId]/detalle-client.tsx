"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UploadPDF } from "@/components/upload-pdf"
import { formatearMoneda, formatearFecha } from "@/lib/utils"
import { CheckCircle2, Circle, AlertTriangle, ArrowLeft, FileCheck } from "lucide-react"

type DiaConciliacion = {
  fecha: string
  totalDia: number
  totalAcumulado: number
  conciliado: boolean
  saldoResumen: number | null
  conciliadoEn: string | null
  operador: string | null
  gastos: Array<{
    id: string
    tipoGasto: string
    monto: number
    descripcion: string | null
  }>
}

type ResumenDetalle = {
  resumen: {
    id: string
    periodo: string
    periodoDesde: string | null
    periodoHasta: string | null
    fechaVtoPago: string
    totalARS: number
    totalUSD: number | null
    s3Key: string | null
    pagado: boolean
    estado: string
    conciliadoEn: string | null
    tarjeta: {
      id: string
      nombre: string
      tipo: string
      banco: string
      ultimos4: string
      diaCierre: number | null
      diaVencimiento: number | null
    }
  }
  dias: DiaConciliacion[]
}

interface Props {
  tarjetaId: string
  resumenId: string
}

export function ConciliacionTarjetaDetalle({ tarjetaId, resumenId }: Props) {
  const [data, setData] = useState<ResumenDetalle | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [diaActivo, setDiaActivo] = useState<string | null>(null)
  const [saldoInput, setSaldoInput] = useState("")
  const [guardando, setGuardando] = useState(false)

  const cargar = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/tarjetas/${tarjetaId}/resumenes/${resumenId}/detalle`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? "Error al cargar")
      }
      const json = (await res.json()) as ResumenDetalle
      setData(json)
      if (!diaActivo) {
        const pending = json.dias.find((d) => !d.conciliado)
        setDiaActivo(pending?.fecha ?? json.dias[0]?.fecha ?? null)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido")
    } finally {
      setLoading(false)
    }
  }, [tarjetaId, resumenId, diaActivo])

  useEffect(() => {
    cargar()
  }, [cargar])

  async function onUploadPdf(key: string) {
    await fetch(`/api/tarjetas/${tarjetaId}/resumenes/${resumenId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ s3Key: key }),
    })
    cargar()
  }

  async function conciliarDia() {
    if (!diaActivo || saldoInput === "") return
    setGuardando(true)
    try {
      const res = await fetch(`/api/tarjetas/${tarjetaId}/resumenes/${resumenId}/dias`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fecha: diaActivo, saldoResumen: parseFloat(saldoInput) }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        alert(body.error ?? "Error al conciliar el día")
        return
      }
      setSaldoInput("")
      await cargar()
      if (data) {
        const idx = data.dias.findIndex((d) => d.fecha === diaActivo)
        const next = data.dias.slice(idx + 1).find((d) => !d.conciliado)
        if (next) setDiaActivo(next.fecha)
      }
    } finally {
      setGuardando(false)
    }
  }

  async function desconciliarDia(fecha: string) {
    if (!confirm(`Desconciliar el día ${fecha}?`)) return
    const res = await fetch(
      `/api/tarjetas/${tarjetaId}/resumenes/${resumenId}/dias?fecha=${fecha}`,
      { method: "DELETE" },
    )
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      alert(body.error ?? "Error al desconciliar")
      return
    }
    cargar()
  }

  async function cerrarResumen() {
    if (!data) return
    const pendientes = data.dias.filter((d) => !d.conciliado).length
    if (pendientes > 0) {
      if (
        !confirm(
          `Quedan ${pendientes} día${pendientes === 1 ? "" : "s"} sin conciliar. ¿Cerrar igualmente?`,
        )
      )
        return
    }
    const res = await fetch(`/api/tarjetas/${tarjetaId}/resumenes/${resumenId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado: "CONCILIADO" }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      alert(body.error ?? "Error al cerrar el resumen")
      return
    }
    cargar()
  }

  async function reabrirResumen() {
    if (!confirm("Reabrir el resumen permite modificar días. ¿Confirmás?")) return
    const res = await fetch(`/api/tarjetas/${tarjetaId}/resumenes/${resumenId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado: "EN_CURSO" }),
    })
    if (res.ok) cargar()
  }

  async function verPdf() {
    if (!data?.resumen.s3Key) return
    const res = await fetch(`/api/storage/signed-url?key=${encodeURIComponent(data.resumen.s3Key)}`)
    const body = await res.json()
    if (body.url) window.location.href = body.url as string
  }

  if (loading && !data) return <p className="text-muted-foreground">Cargando…</p>
  if (error) return <p className="text-destructive">{error}</p>
  if (!data) return null

  const { resumen, dias } = data
  const diaActivoObj = dias.find((d) => d.fecha === diaActivo)
  const conciliados = dias.filter((d) => d.conciliado).length
  const cerrado = resumen.estado === "CONCILIADO"

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <Link
            href="/contabilidad/cuentas/conciliacion-tarjetas"
            className="text-sm text-muted-foreground hover:underline inline-flex items-center gap-1"
          >
            <ArrowLeft className="h-3 w-3" /> Volver
          </Link>
          <h1 className="text-2xl font-bold mt-1">
            {resumen.tarjeta.nombre} ··· {resumen.tarjeta.ultimos4}
          </h1>
          <p className="text-muted-foreground text-sm">
            {resumen.tarjeta.banco} · {resumen.tarjeta.tipo} · Período {resumen.periodo}
            {resumen.periodoDesde && resumen.periodoHasta
              ? ` (${formatearFecha(resumen.periodoDesde)} al ${formatearFecha(resumen.periodoHasta)})`
              : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {conciliados}/{dias.length} días
          </span>
          {cerrado && (
            <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
              <FileCheck className="h-3 w-3" /> Conciliado
            </span>
          )}
          {!cerrado ? (
            <Button onClick={cerrarResumen} disabled={guardando}>
              Cerrar resumen
            </Button>
          ) : (
            <Button variant="outline" onClick={reabrirResumen}>
              Reabrir
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="pt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase">Total resumen (ARS)</p>
              <p className="text-xl font-bold">{formatearMoneda(resumen.totalARS)}</p>
            </div>
            {resumen.totalUSD != null && (
              <div>
                <p className="text-xs text-muted-foreground uppercase">Total resumen (USD)</p>
                <p className="text-xl font-bold">{formatearMoneda(resumen.totalUSD)}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground uppercase">Vencimiento</p>
              <p className="text-xl font-bold">{formatearFecha(resumen.fechaVtoPago)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Label className="mb-0">Resumen del banco (PDF):</Label>
            {resumen.s3Key && (
              <>
                <Button variant="outline" size="sm" onClick={verPdf}>
                  Ver PDF actual
                </Button>
                <span className="text-xs text-muted-foreground">Podés reemplazarlo:</span>
              </>
            )}
            <UploadPDF
              prefijo="resumenes-tarjeta"
              onUpload={onUploadPdf}
              s3Key={resumen.s3Key ?? undefined}
              label={resumen.s3Key ? "Reemplazar PDF" : "Subir PDF del resumen"}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-[180px_1fr] gap-4">
        <Card>
          <CardContent className="p-2 max-h-[70vh] overflow-auto">
            <div className="space-y-1">
              {dias.length === 0 ? (
                <p className="text-xs text-muted-foreground p-2">
                  Definí período desde/hasta en el resumen para ver los días.
                </p>
              ) : (
                dias.map((d) => {
                  const dLabel = formatearFecha(d.fecha)
                  const isActive = diaActivo === d.fecha
                  return (
                    <button
                      key={d.fecha}
                      type="button"
                      onClick={() => setDiaActivo(d.fecha)}
                      className={`w-full text-left px-3 py-2 rounded text-xs flex items-center justify-between ${
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted"
                      }`}
                    >
                      <span>{dLabel}</span>
                      {d.conciliado ? (
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                      ) : (
                        <Circle className="h-3 w-3 text-muted-foreground" />
                      )}
                    </button>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 space-y-4">
            {!diaActivoObj ? (
              <p className="text-muted-foreground">Seleccioná un día.</p>
            ) : (
              <>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h2 className="text-lg font-semibold">
                      {formatearFecha(diaActivoObj.fecha)}
                    </h2>
                    {diaActivoObj.conciliado && diaActivoObj.conciliadoEn && (
                      <p className="text-xs text-muted-foreground">
                        Conciliado por {diaActivoObj.operador} el{" "}
                        {new Date(diaActivoObj.conciliadoEn).toLocaleString("es-AR")}
                      </p>
                    )}
                  </div>
                  {diaActivoObj.conciliado && !cerrado && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => desconciliarDia(diaActivoObj.fecha)}
                    >
                      Desconciliar día
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="border rounded p-3">
                    <p className="text-xs uppercase text-muted-foreground">Gastos del día</p>
                    <p className="text-lg font-bold">{formatearMoneda(diaActivoObj.totalDia)}</p>
                  </div>
                  <div className="border rounded p-3">
                    <p className="text-xs uppercase text-muted-foreground">Acumulado sistema</p>
                    <p className="text-lg font-bold">
                      {formatearMoneda(diaActivoObj.totalAcumulado)}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold mb-2">
                    Gastos registrados ({diaActivoObj.gastos.length})
                  </h3>
                  {diaActivoObj.gastos.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Sin gastos registrados en el sistema para este día.
                    </p>
                  ) : (
                    <div className="border rounded overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/40">
                          <tr>
                            <th className="text-left px-3 py-2">Tipo</th>
                            <th className="text-left px-3 py-2">Descripción</th>
                            <th className="text-right px-3 py-2">Monto</th>
                          </tr>
                        </thead>
                        <tbody>
                          {diaActivoObj.gastos.map((g) => (
                            <tr key={g.id} className="border-t">
                              <td className="px-3 py-2 text-xs text-muted-foreground">
                                {g.tipoGasto}
                              </td>
                              <td className="px-3 py-2">{g.descripcion ?? "—"}</td>
                              <td className="px-3 py-2 text-right">
                                {formatearMoneda(g.monto)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    Si falta un gasto, cargalo desde la pantalla de gastos de la tarjeta y volvé
                    acá.
                  </p>
                </div>

                {!cerrado && (
                  <div className="border-t pt-4 space-y-3">
                    <h3 className="text-sm font-semibold">Conciliar este día</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                      <div>
                        <Label>Acumulado según resumen</Label>
                        <Input
                          type="number"
                          value={saldoInput}
                          onChange={(e) => setSaldoInput(e.target.value)}
                          placeholder={
                            diaActivoObj.saldoResumen != null
                              ? String(diaActivoObj.saldoResumen)
                              : ""
                          }
                        />
                      </div>
                      <div>
                        <Label>Diferencia</Label>
                        <p className="text-sm mt-2">
                          {saldoInput !== "" && !Number.isNaN(parseFloat(saldoInput)) ? (
                            (() => {
                              const diff =
                                diaActivoObj.totalAcumulado - parseFloat(saldoInput)
                              if (Math.abs(diff) < 0.005) {
                                return (
                                  <span className="text-green-700 font-medium inline-flex items-center gap-1">
                                    <CheckCircle2 className="h-4 w-4" /> Coincide
                                  </span>
                                )
                              }
                              return (
                                <span className="text-yellow-700 font-medium inline-flex items-center gap-1">
                                  <AlertTriangle className="h-4 w-4" /> {formatearMoneda(diff)}
                                </span>
                              )
                            })()
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </p>
                      </div>
                      <div>
                        <Button
                          onClick={conciliarDia}
                          disabled={guardando || saldoInput === ""}
                          className="w-full"
                        >
                          {diaActivoObj.conciliado ? "Actualizar" : "Marcar conciliado"}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
