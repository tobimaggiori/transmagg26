"use client"

import { useState } from "react"
import { formatearFecha, formatearMoneda } from "@/lib/utils"

type ChequeRecibido = {
  id: string
  nroCheque: string
  bancoEmisor: string
  monto: string | number
  fechaEmision: string
  fechaCobro: string
  estado: string
  esElectronico: boolean
  empresa: { id: string; razonSocial: string } | null
  proveedorOrigen: { id: string; razonSocial: string } | null
  cuentaDeposito: { id: string; nombre: string } | null
}

type ChequeEmitido = {
  id: string
  nroCheque: string | null
  monto: string | number
  fechaEmision: string
  fechaPago: string
  motivoPago: string
  clausula: string
  estado: string
  esElectronico: boolean
  proveedor: { id: string; razonSocial: string } | null
  cuenta: { id: string; nombre: string } | null
}

interface Props {
  recibidos: ChequeRecibido[]
  emitidos: ChequeEmitido[]
}

export function ChequerasJmClient({ recibidos, emitidos }: Props) {
  const [tab, setTab] = useState<"recibidos" | "emitidos">("recibidos")

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Chequeras</h1>

      <div className="flex gap-2 border-b">
        <button onClick={() => setTab("recibidos")} className={`px-4 py-2 text-sm font-medium ${tab === "recibidos" ? "border-b-2 border-primary text-foreground" : "text-muted-foreground"}`}>
          Recibidos ({recibidos.length})
        </button>
        <button onClick={() => setTab("emitidos")} className={`px-4 py-2 text-sm font-medium ${tab === "emitidos" ? "border-b-2 border-primary text-foreground" : "text-muted-foreground"}`}>
          Emitidos ({emitidos.length})
        </button>
      </div>

      {tab === "recibidos" && (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="px-3 py-2 text-left">Nro</th>
                <th className="px-3 py-2 text-left">Banco emisor</th>
                <th className="px-3 py-2 text-left">Origen</th>
                <th className="px-3 py-2 text-left">Emisión</th>
                <th className="px-3 py-2 text-left">Cobro</th>
                <th className="px-3 py-2 text-left">Estado</th>
                <th className="px-3 py-2 text-left">Cuenta depósito</th>
                <th className="px-3 py-2 text-right">Monto</th>
              </tr>
            </thead>
            <tbody>
              {recibidos.length === 0 ? (
                <tr><td colSpan={8} className="px-3 py-6 text-center text-muted-foreground">Sin cheques recibidos.</td></tr>
              ) : recibidos.map((c) => (
                <tr key={c.id} className="border-t hover:bg-muted/20">
                  <td className="px-3 py-2 font-mono">{c.nroCheque}{c.esElectronico ? <span className="text-xs text-muted-foreground ml-1">(ECheq)</span> : null}</td>
                  <td className="px-3 py-2">{c.bancoEmisor}</td>
                  <td className="px-3 py-2">{c.empresa?.razonSocial ?? c.proveedorOrigen?.razonSocial ?? "—"}</td>
                  <td className="px-3 py-2">{formatearFecha(new Date(c.fechaEmision))}</td>
                  <td className="px-3 py-2">{formatearFecha(new Date(c.fechaCobro))}</td>
                  <td className="px-3 py-2"><span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">{c.estado.replace(/_/g, " ")}</span></td>
                  <td className="px-3 py-2 text-xs">{c.cuentaDeposito?.nombre ?? "—"}</td>
                  <td className="px-3 py-2 text-right font-medium">{formatearMoneda(Number(c.monto))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "emitidos" && (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="px-3 py-2 text-left">Nro</th>
                <th className="px-3 py-2 text-left">Cuenta</th>
                <th className="px-3 py-2 text-left">Beneficiario</th>
                <th className="px-3 py-2 text-left">Motivo</th>
                <th className="px-3 py-2 text-left">Emisión</th>
                <th className="px-3 py-2 text-left">Pago</th>
                <th className="px-3 py-2 text-left">Estado</th>
                <th className="px-3 py-2 text-right">Monto</th>
              </tr>
            </thead>
            <tbody>
              {emitidos.length === 0 ? (
                <tr><td colSpan={8} className="px-3 py-6 text-center text-muted-foreground">Sin cheques emitidos.</td></tr>
              ) : emitidos.map((c) => (
                <tr key={c.id} className="border-t hover:bg-muted/20">
                  <td className="px-3 py-2 font-mono">{c.nroCheque ?? "—"}</td>
                  <td className="px-3 py-2 text-xs">{c.cuenta?.nombre ?? "—"}</td>
                  <td className="px-3 py-2">{c.proveedor?.razonSocial ?? "—"}</td>
                  <td className="px-3 py-2 text-xs">{c.motivoPago.replace(/_/g, " ")}</td>
                  <td className="px-3 py-2">{formatearFecha(new Date(c.fechaEmision))}</td>
                  <td className="px-3 py-2">{formatearFecha(new Date(c.fechaPago))}</td>
                  <td className="px-3 py-2"><span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">{c.estado.replace(/_/g, " ")}</span></td>
                  <td className="px-3 py-2 text-right font-medium">{formatearMoneda(Number(c.monto))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
