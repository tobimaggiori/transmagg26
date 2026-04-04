"use client"

import { useState } from "react"
import { formatearFecha } from "@/lib/utils"
import type { EntradaHistorial } from "./types"

export function HistorialPagoFletero({ pagoId }: { pagoId: string }) {
  const [historial, setHistorial] = useState<EntradaHistorial[]>([])
  const [cargando, setCargando] = useState(false)
  const [abierto, setAbierto] = useState(false)

  function cargar() {
    if (abierto) { setAbierto(false); return }
    setCargando(true)
    fetch(`/api/pagos-fletero/${pagoId}/historial`)
      .then((r) => r.json())
      .then((data) => setHistorial(data ?? []))
      .catch(() => setHistorial([]))
      .finally(() => { setCargando(false); setAbierto(true) })
  }

  const BADGE_EVENTO: Record<string, string> = {
    CREACION: "bg-green-100 text-green-800",
    MODIFICACION: "bg-blue-100 text-blue-800",
    ANULACION: "bg-red-100 text-red-800",
  }

  return (
    <div className="mt-1">
      <button
        onClick={cargar}
        className="text-xs text-primary underline underline-offset-2"
      >
        {cargando ? "Cargando..." : abierto ? "Ocultar historial" : "Ver historial"}
      </button>
      {abierto && (
        <div className="mt-2 space-y-2 border-l-2 border-muted pl-3">
          {historial.length === 0 ? (
            <p className="text-xs text-muted-foreground">Sin historial registrado.</p>
          ) : (
            historial.map((h) => (
              <div key={h.id}>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${BADGE_EVENTO[h.tipoEvento] ?? "bg-gray-100 text-gray-800"}`}>
                    {h.tipoEvento}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatearFecha(new Date(h.creadoEn))} — {h.operador.apellido}, {h.operador.nombre}
                  </span>
                </div>
                <p className="text-xs mt-0.5 text-muted-foreground">{h.justificacion}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
