"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { formatearMoneda, formatearFecha } from "@/lib/utils"

export type FciListado = {
  id: string
  nombre: string
  moneda: string
  cuenta: { id: string; nombre: string; tipo: string; moneda: string }
  saldoActual: number
  saldoInformado: number | null
  fechaUltimaConciliacion: string | null
  diasSinConciliar: number | null
  diasHabilesAlerta: number
}

export function FciListadoClient({ items }: { items: FciListado[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">No hay FCIs activos. Podés darlos de alta desde ABM.</p>
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {items.map((f) => {
        const alerta = f.diasSinConciliar != null && f.diasSinConciliar > f.diasHabilesAlerta
        return (
          <Link key={f.id} href={`/contabilidad/fci/${f.id}`}>
            <Card className={`hover:border-primary transition-colors cursor-pointer ${alerta ? "border-amber-400 bg-amber-50/40" : ""}`}>
              <CardContent className="pt-5 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{f.nombre}</p>
                    <p className="text-xs text-muted-foreground">
                      {f.cuenta.nombre} · {f.cuenta.tipo.toLowerCase()} · {f.moneda}
                    </p>
                  </div>
                  {alerta && (
                    <span className="shrink-0 rounded-full bg-amber-100 text-amber-800 text-xs px-2 py-0.5 font-medium">
                      {f.diasSinConciliar} día(s) sin conciliar
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Saldo contable</p>
                    <p className="font-medium">{formatearMoneda(f.saldoActual)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Saldo informado</p>
                    <p className="font-medium">
                      {f.saldoInformado != null ? formatearMoneda(f.saldoInformado) : "—"}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground text-xs">Última conciliación</p>
                    <p>{f.fechaUltimaConciliacion ? formatearFecha(f.fechaUltimaConciliacion) : "Nunca"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}
