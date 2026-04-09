"use client"

/**
 * Propósito: Página de consulta de Órdenes de Pago emitidas.
 * Muestra un listado con filtros por fletero (combobox), número y rango de fechas.
 */

import { useState, useEffect, useCallback, useMemo } from "react"
import { formatearMoneda, formatearFecha, cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { PDFViewer } from "@/components/ui/pdf-viewer"
import { usePDFViewer } from "@/hooks/use-pdf-viewer"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Check, ChevronsUpDown } from "lucide-react"

interface Fletero {
  id: string
  razonSocial: string
  cuit: string
}

interface OrdenPago {
  id: string
  nro: number
  anio: number
  display: string
  fecha: string
  fletero: { id: string; razonSocial: string }
  total: number
  pdfS3Key: string | null
}

function ComboboxFletero({
  fleteros,
  value,
  onChange,
}: {
  fleteros: Fletero[]
  value: string
  onChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [busqueda, setBusqueda] = useState("")

  const filtrados = useMemo(() => {
    if (!busqueda) return fleteros
    const q = busqueda.toLowerCase()
    const qDigits = busqueda.replace(/\D/g, "")
    return fleteros.filter(
      (f) => f.razonSocial.toLowerCase().includes(q) || (qDigits && f.cuit.replace(/\D/g, "").includes(qDigits))
    )
  }, [fleteros, busqueda])

  const seleccionado = fleteros.find((f) => f.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className="flex h-8 w-52 items-center justify-between rounded-md border bg-background px-2 text-sm">
        <span className="truncate">{seleccionado ? seleccionado.razonSocial : "Todos"}</span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Buscar por razón social o CUIT..." value={busqueda} onValueChange={setBusqueda} />
          <CommandList>
            <CommandEmpty>No se encontraron fleteros.</CommandEmpty>
            <CommandGroup>
              <CommandItem onSelect={() => { onChange(""); setOpen(false); setBusqueda("") }}>
                <Check className={cn("mr-2 h-4 w-4", value === "" ? "opacity-100" : "opacity-0")} />
                Todos los fleteros
              </CommandItem>
              {filtrados.map((f) => (
                <CommandItem
                  key={f.id}
                  value={f.id}
                  onSelect={() => { onChange(f.id); setOpen(false); setBusqueda("") }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === f.id ? "opacity-100" : "opacity-0")} />
                  <div>
                    <p className="font-medium">{f.razonSocial}</p>
                    <p className="text-xs text-muted-foreground">CUIT: {f.cuit}</p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export default function ConsultarOrdenesDePagoPage() {
  const { estado: estadoPDF, abrirPDF, cerrarPDF } = usePDFViewer()
  const [ordenes, setOrdenes] = useState<OrdenPago[]>([])
  const [fleteros, setFleteros] = useState<Fletero[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [filtroFleteroId, setFiltroFleteroId] = useState("")
  const [filtroNro, setFiltroNro] = useState("")
  const [filtroDesde, setFiltroDesde] = useState("")
  const [filtroHasta, setFiltroHasta] = useState("")

  // Cargar fleteros al montar
  useEffect(() => {
    fetch("/api/fleteros?activo=true")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setFleteros(data)
      })
      .catch(() => {})
  }, [])

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (filtroFleteroId) params.set("fleteroId", filtroFleteroId)
      if (filtroNro) params.set("nro", filtroNro)
      if (filtroDesde) params.set("desde", filtroDesde)
      if (filtroHasta) params.set("hasta", filtroHasta)
      const res = await fetch(`/api/ordenes-pago?${params}`)
      if (!res.ok) throw new Error("Error al cargar órdenes de pago")
      setOrdenes(await res.json())
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido")
    } finally {
      setCargando(false)
    }
  }, [filtroFleteroId, filtroNro, filtroDesde, filtroHasta])

  useEffect(() => { cargar() }, [cargar])

  const ordenesFiltradas = ordenes

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Consultar Órdenes de Pago</h1>
        <p className="text-sm text-muted-foreground mt-1">Historial de órdenes de pago emitidas a fleteros.</p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <div>
          <label className="text-xs font-medium block mb-1">Fletero</label>
          <ComboboxFletero
            fleteros={fleteros}
            value={filtroFleteroId}
            onChange={setFiltroFleteroId}
          />
        </div>
        <div>
          <label className="text-xs font-medium block mb-1">Nro OP</label>
          <Input
            value={filtroNro}
            onChange={(e) => setFiltroNro(e.target.value)}
            placeholder="Ej: 42"
            className="h-8 text-sm w-24"
            type="number"
          />
        </div>
        <div>
          <label className="text-xs font-medium block mb-1">Desde</label>
          <Input
            type="date"
            value={filtroDesde}
            onChange={(e) => setFiltroDesde(e.target.value)}
            className="h-8 text-sm w-36"
          />
        </div>
        <div>
          <label className="text-xs font-medium block mb-1">Hasta</label>
          <Input
            type="date"
            value={filtroHasta}
            onChange={(e) => setFiltroHasta(e.target.value)}
            className="h-8 text-sm w-36"
          />
        </div>
      </div>

      {/* Tabla */}
      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : cargando ? (
        <p className="text-sm text-muted-foreground">Cargando...</p>
      ) : ordenesFiltradas.length === 0 ? (
        <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
          No hay órdenes de pago que coincidan con los filtros.
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium">Nro OP</th>
                <th className="px-4 py-2.5 text-left font-medium">Fecha</th>
                <th className="px-4 py-2.5 text-left font-medium">Fletero</th>
                <th className="px-4 py-2.5 text-right font-medium">Total</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {ordenesFiltradas.map((op) => (
                <tr key={op.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3 font-mono font-semibold">
                    {op.display}
                  </td>
                  <td className="px-4 py-3">{formatearFecha(new Date(op.fecha))}</td>
                  <td className="px-4 py-3">{op.fletero.razonSocial}</td>
                  <td className="px-4 py-3 text-right font-medium">{formatearMoneda(op.total)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => abrirPDF({
                        url: `/api/ordenes-pago/${op.id}/pdf`,
                        titulo: `Orden de Pago Nro ${op.display} — ${op.fletero.razonSocial}`,
                      })}
                      className="h-7 px-3 rounded-md border text-xs font-medium hover:bg-accent"
                    >
                      Ver PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-2 bg-muted/30 text-xs text-muted-foreground border-t">
            {ordenesFiltradas.length} orden{ordenesFiltradas.length !== 1 ? "es" : ""}
          </div>
        </div>
      )}

      <PDFViewer {...estadoPDF} onClose={cerrarPDF} />
    </div>
  )
}
