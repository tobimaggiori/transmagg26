"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Landmark, Wallet, LineChart } from "lucide-react"
import { Input } from "@/components/ui/input"

type CuentaItem = {
  id: string
  nombre: string
  tipo: string
  moneda: string
  saldoInicial: number
  fechaSaldoInicial: Date | null
  banco: { nombre: string } | null
  billetera: { nombre: string } | null
  broker: { nombre: string } | null
}

function iconoDeTipo(tipo: string) {
  if (tipo === "BANCO") return <Landmark className="h-4 w-4 text-muted-foreground" />
  if (tipo === "BILLETERA_VIRTUAL") return <Wallet className="h-4 w-4 text-muted-foreground" />
  return <LineChart className="h-4 w-4 text-muted-foreground" />
}

function entidadDeCuenta(c: CuentaItem) {
  return c.banco?.nombre ?? c.billetera?.nombre ?? c.broker?.nombre ?? "—"
}

export function LibroCuentasListado({ cuentas }: { cuentas: CuentaItem[] }) {
  const [busqueda, setBusqueda] = useState("")
  const [filtroTipo, setFiltroTipo] = useState<string>("")

  const filtradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return cuentas.filter((c) => {
      if (filtroTipo && c.tipo !== filtroTipo) return false
      if (!q) return true
      const target = `${c.nombre} ${entidadDeCuenta(c)}`.toLowerCase()
      return target.includes(q)
    })
  }, [cuentas, busqueda, filtroTipo])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Buscar por nombre o banco/billetera/broker..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="max-w-sm"
        />
        <select
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value)}
        >
          <option value="">Todos los tipos</option>
          <option value="BANCO">Banco</option>
          <option value="BILLETERA_VIRTUAL">Billetera virtual</option>
          <option value="BROKER">Broker</option>
        </select>
      </div>

      {filtradas.length === 0 ? (
        <div className="text-sm text-muted-foreground py-6">No hay cuentas que coincidan.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtradas.map((c) => (
            <Link
              key={c.id}
              href={`/contabilidad/cuentas/libro/${c.id}`}
              className="block rounded-lg border p-4 hover:bg-accent transition"
            >
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                {iconoDeTipo(c.tipo)}
                <span>{entidadDeCuenta(c)}</span>
                <span className="ml-auto">{c.moneda}</span>
              </div>
              <div className="font-semibold">{c.nombre}</div>
              {c.fechaSaldoInicial == null && (
                <div className="text-xs text-amber-700 mt-2">Sin fecha de saldo inicial</div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
