"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Select } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { FormError } from "@/components/ui/form-error"
import { CreditCard, Search, Plus } from "lucide-react"

type Tarjeta = {
  id: string
  nombre: string
  tipo: string
  banco: string
  ultimos4: string
  diaCierre: number | null
  diaVencimiento: number | null
}

type ResumenInfo = {
  id: string
  periodo: string
  estado: string
  fechaVtoPago: string
  periodoDesde: string | null
  periodoHasta: string | null
}

interface Props {
  tarjetas: Tarjeta[]
}

function estadoBadge(estado: string | undefined) {
  const e = estado ?? "SIN_INICIAR"
  const color =
    e === "CONCILIADO"
      ? "bg-green-100 text-green-800"
      : e === "EN_CURSO"
        ? "bg-yellow-100 text-yellow-800"
        : e === "PENDIENTE"
          ? "bg-blue-100 text-blue-800"
          : "bg-gray-100 text-gray-600"
  const label =
    e === "SIN_INICIAR"
      ? "Sin iniciar"
      : e.charAt(0) + e.slice(1).toLowerCase().replace("_", " ")
  return <span className={`text-xs px-2 py-0.5 rounded-full ${color}`}>{label}</span>
}

export function ConciliacionTarjetasListado({ tarjetas: tarjetasIniciales }: Props) {
  const hoy = new Date()
  const [tarjetas, setTarjetas] = useState(tarjetasIniciales)
  const [periodo, setPeriodo] = useState(
    `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}`,
  )
  const [busqueda, setBusqueda] = useState("")
  const [filtroTipo, setFiltroTipo] = useState("")
  const [resumenes, setResumenes] = useState<Record<string, ResumenInfo | null>>({})
  const [loading, setLoading] = useState(false)
  const [modalAlta, setModalAlta] = useState<Tarjeta | null>(null)

  useEffect(() => {
    let cancelled = false
    async function cargar() {
      setLoading(true)
      const map: Record<string, ResumenInfo | null> = {}
      await Promise.all(
        tarjetas.map(async (t) => {
          try {
            const res = await fetch(`/api/tarjetas/${t.id}/resumenes`)
            if (res.ok) {
              const lista: ResumenInfo[] = await res.json()
              map[t.id] = lista.find((r) => r.periodo === periodo) ?? null
            } else {
              map[t.id] = null
            }
          } catch {
            map[t.id] = null
          }
        }),
      )
      if (!cancelled) setResumenes(map)
      setLoading(false)
    }
    cargar()
    return () => {
      cancelled = true
    }
  }, [periodo, tarjetas])

  const tarjetasFiltradas = tarjetas.filter((t) => {
    if (filtroTipo && t.tipo !== filtroTipo) return false
    if (!busqueda) return true
    const q = busqueda.toLowerCase()
    return (
      t.nombre.toLowerCase().includes(q) ||
      t.banco.toLowerCase().includes(q) ||
      t.ultimos4.includes(q)
    )
  })

  async function recargarTarjetas() {
    const res = await fetch("/api/tarjetas")
    if (res.ok) {
      const lista = (await res.json()) as Tarjeta[]
      if (Array.isArray(lista)) setTarjetas(lista)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div>
              <Label>Período (YYYY-MM)</Label>
              <Input
                type="month"
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value)}
              />
            </div>
            <div>
              <Label>Tipo</Label>
              <Select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
                <option value="">Todos</option>
                <option value="CREDITO">Crédito</option>
                <option value="DEBITO">Débito</option>
                <option value="PREPAGA">Prepaga</option>
              </Select>
            </div>
            <div>
              <Label>Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Nombre, banco o últimos 4"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3">Tarjeta</th>
                <th className="text-left px-4 py-3">Tipo</th>
                <th className="text-left px-4 py-3">Banco / emisor</th>
                <th className="text-left px-4 py-3">Ciclo</th>
                <th className="text-left px-4 py-3">Estado {periodo}</th>
                <th className="text-right px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {tarjetasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    Sin tarjetas que coincidan.
                  </td>
                </tr>
              ) : (
                tarjetasFiltradas.map((t) => {
                  const info = resumenes[t.id]
                  const cicloLabel =
                    t.diaCierre != null && t.diaVencimiento != null
                      ? `Cierra día ${t.diaCierre} · Vto día ${t.diaVencimiento}`
                      : "Ciclo no configurado"
                  return (
                    <tr key={t.id} className="border-t hover:bg-muted/20">
                      <td className="px-4 py-3 font-medium">
                        <span className="inline-flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-muted-foreground" />
                          {t.nombre} ··· {t.ultimos4}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{t.tipo}</td>
                      <td className="px-4 py-3">{t.banco}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{cicloLabel}</td>
                      <td className="px-4 py-3">
                        {loading && !info ? (
                          <span className="text-xs text-muted-foreground">…</span>
                        ) : (
                          estadoBadge(info?.estado)
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {info ? (
                          <Link
                            href={`/contabilidad/cuentas/conciliacion-tarjetas/${t.id}/${info.id}`}
                          >
                            <Button size="sm" variant="outline">
                              Abrir
                            </Button>
                          </Link>
                        ) : (
                          <Button size="sm" onClick={() => setModalAlta(t)}>
                            <Plus className="h-3 w-3 mr-1" /> Iniciar {periodo}
                          </Button>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={!!modalAlta} onOpenChange={(o) => !o && setModalAlta(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo resumen</DialogTitle>
            <DialogDescription>
              {modalAlta ? `${modalAlta.nombre} — período ${periodo}` : ""}
            </DialogDescription>
          </DialogHeader>
          {modalAlta && (
            <NuevoResumenForm
              tarjeta={modalAlta}
              periodo={periodo}
              onSuccess={async () => {
                setModalAlta(null)
                const res = await fetch(`/api/tarjetas/${modalAlta.id}/resumenes`)
                if (res.ok) {
                  const lista: ResumenInfo[] = await res.json()
                  setResumenes((p) => ({
                    ...p,
                    [modalAlta.id]: lista.find((r) => r.periodo === periodo) ?? null,
                  }))
                }
                recargarTarjetas()
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function NuevoResumenForm({
  tarjeta,
  periodo,
  onSuccess,
}: {
  tarjeta: Tarjeta
  periodo: string
  onSuccess: () => void
}) {
  const [anioStr, mesStr] = periodo.split("-")
  const anio = Number(anioStr)
  const mes = Number(mesStr)

  // Defaults razonables: si hay diaCierre, el periodo es (diaCierre del mes anterior+1) a (diaCierre del mes actual)
  function defaultDesde(): string {
    if (tarjeta.diaCierre == null) return `${periodo}-01`
    const prev = new Date(Date.UTC(anio, mes - 2, Math.min(tarjeta.diaCierre + 1, 28)))
    return prev.toISOString().slice(0, 10)
  }
  function defaultHasta(): string {
    if (tarjeta.diaCierre == null) {
      const last = new Date(Date.UTC(anio, mes, 0))
      return last.toISOString().slice(0, 10)
    }
    const diasEnMes = new Date(Date.UTC(anio, mes, 0)).getUTCDate()
    return `${anio}-${String(mes).padStart(2, "0")}-${String(
      Math.min(tarjeta.diaCierre, diasEnMes),
    ).padStart(2, "0")}`
  }
  function defaultVto(): string {
    if (tarjeta.diaVencimiento == null) {
      const last = new Date(Date.UTC(anio, mes, 0))
      return last.toISOString().slice(0, 10)
    }
    const diasEnMes = new Date(Date.UTC(anio, mes, 0)).getUTCDate()
    return `${anio}-${String(mes).padStart(2, "0")}-${String(
      Math.min(tarjeta.diaVencimiento, diasEnMes),
    ).padStart(2, "0")}`
  }

  const [form, setForm] = useState({
    periodoDesde: defaultDesde(),
    periodoHasta: defaultHasta(),
    fechaVtoPago: defaultVto(),
    totalARS: "0",
    totalUSD: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/tarjetas/${tarjeta.id}/resumenes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          periodo,
          periodoDesde: new Date(`${form.periodoDesde}T00:00:00Z`).toISOString(),
          periodoHasta: new Date(`${form.periodoHasta}T00:00:00Z`).toISOString(),
          fechaVtoPago: new Date(`${form.fechaVtoPago}T00:00:00Z`).toISOString(),
          totalARS: parseFloat(form.totalARS) || 0,
          totalUSD: form.totalUSD ? parseFloat(form.totalUSD) : null,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(body.error ?? "Error al crear el resumen")
        return
      }
      onSuccess()
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Período desde</Label>
          <Input
            type="date"
            value={form.periodoDesde}
            onChange={(e) => setForm((f) => ({ ...f, periodoDesde: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label>Período hasta</Label>
          <Input
            type="date"
            value={form.periodoHasta}
            onChange={(e) => setForm((f) => ({ ...f, periodoHasta: e.target.value }))}
            required
          />
        </div>
      </div>
      <div>
        <Label>Fecha vto. pago</Label>
        <Input
          type="date"
          value={form.fechaVtoPago}
          onChange={(e) => setForm((f) => ({ ...f, fechaVtoPago: e.target.value }))}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Total ARS</Label>
          <Input
            type="number"
            value={form.totalARS}
            onChange={(e) => setForm((f) => ({ ...f, totalARS: e.target.value }))}
          />
        </div>
        <div>
          <Label>Total USD (opcional)</Label>
          <Input
            type="number"
            value={form.totalUSD}
            onChange={(e) => setForm((f) => ({ ...f, totalUSD: e.target.value }))}
          />
        </div>
      </div>
      {error && <FormError message={error} />}
      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Creando…" : "Crear resumen"}
        </Button>
      </div>
    </form>
  )
}
