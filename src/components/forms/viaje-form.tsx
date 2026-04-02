"use client"

/**
 * Formulario para crear un viaje standalone.
 * El operador carga el viaje; luego se asocia a una liquidación y/o factura de forma independiente.
 */

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { FormError } from "@/components/ui/form-error"
import { SearchCombobox } from "@/components/ui/search-combobox"

interface Fletero { id: string; razonSocial: string; cuit: string }
interface Camion { id: string; patenteChasis: string; fleteroId: string }
interface Chofer { id: string; nombre: string; apellido: string; fleteroId: string | null }
interface Empresa { id: string; razonSocial: string; cuit: string }

interface ViajeFormProps {
  fleteros: Fletero[]
  camiones: Camion[]
  choferes: Chofer[]
  empresas: Empresa[]
  onSuccess?: () => void
}

const PROVINCIAS_AR = [
  "Buenos Aires", "CABA", "Catamarca", "Chaco", "Chubut", "Córdoba",
  "Corrientes", "Entre Ríos", "Formosa", "Jujuy", "La Pampa", "La Rioja",
  "Mendoza", "Misiones", "Neuquén", "Río Negro", "Salta", "San Juan",
  "San Luis", "Santa Cruz", "Santa Fe", "Santiago del Estero",
  "Tierra del Fuego", "Tucumán",
]

/**
 * ViajeForm: ViajeFormProps -> JSX.Element
 *
 * Dados los listados de fleteros (con cuit), camiones, choferes y empresas (con cuit) junto con onSuccess,
 * renderiza un formulario para cargar un viaje standalone con todos sus datos operativos.
 * Usa SearchCombobox buscable por razón social o CUIT para Fletero y Empresa.
 * Filtra los camiones disponibles según el fletero seleccionado.
 * Envía POST /api/viajes y llama onSuccess al completarse exitosamente.
 * Existe para que los operadores internos carguen viajes independientes que luego
 * se asociarán a liquidaciones y facturas de forma separada.
 *
 * Ejemplos:
 * <ViajeForm fleteros={[{ id: "f1", razonSocial: "JP SRL", cuit: "20123456789" }]} camiones={[{ id: "c1", patenteChasis: "ABC123", fleteroId: "f1" }]} choferes={[...]} empresas={[...]} onSuccess={() => setOpen(false)} />
 * // => formulario con combobox buscable y camiones filtrados al seleccionar fletero "f1"
 * <ViajeForm fleteros={[]} camiones={[]} choferes={[]} empresas={[]} onSuccess={() => {}} />
 * // => formulario con listas vacías (submit fallará con 404 si no hay datos)
 * // => submit exitoso → llama onSuccess y refresca la página
 */
export function ViajeForm({ fleteros, camiones, choferes, empresas, onSuccess }: ViajeFormProps) {
  const router = useRouter()
  const [fleteroId, setFleteroId] = useState("")
  const [camionId, setCamionId] = useState("")
  const [choferId, setChoferId] = useState("")
  const [empresaId, setEmpresaId] = useState("")
  const [fechaViaje, setFechaViaje] = useState(new Date().toISOString().slice(0, 10))
  const [remito, setRemito] = useState("")
  const [cupo, setCupo] = useState("")
  const [mercaderia, setMercaderia] = useState("")
  const [procedencia, setProcedencia] = useState("")
  const [provinciaOrigen, setProvinciaOrigen] = useState("")
  const [destino, setDestino] = useState("")
  const [provinciaDestino, setProvinciaDestino] = useState("")
  const [kilos, setKilos] = useState("")
  const [tarifa, setTarifaBase] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const camionesDelFletero = camiones.filter((c) => c.fleteroId === fleteroId)
  const choferesDelFletero = fleteroId
    ? choferes.filter((c) => c.fleteroId === fleteroId)
    : choferes

  const fleteroItems = fleteros.map((f) => ({
    id: f.id,
    label: f.razonSocial,
    sublabel: f.cuit,
  }))

  const empresaItems = empresas.map((e) => ({
    id: e.id,
    label: e.razonSocial,
    sublabel: e.cuit,
  }))

  function handleFleteroChange(id: string) {
    setFleteroId(id)
    setCamionId("")
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/viajes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fleteroId,
          camionId,
          choferId,
          empresaId,
          fechaViaje,
          remito: remito || undefined,
          cupo: cupo || undefined,
          mercaderia: mercaderia || undefined,
          procedencia: procedencia || undefined,
          provinciaOrigen: provinciaOrigen || undefined,
          destino: destino || undefined,
          provinciaDestino: provinciaDestino || undefined,
          kilos: kilos ? parseFloat(kilos) : undefined,
          tarifa: parseFloat(tarifa),
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Error al crear el viaje")
        return
      }

      router.refresh()
      onSuccess?.()
    } catch {
      setError("Error de conexión. Intentá nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Fila 1: Fletero, Empresa */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Fletero *</Label>
          <SearchCombobox
            items={fleteroItems}
            value={fleteroId}
            onChange={handleFleteroChange}
            placeholder="Buscar por nombre o CUIT..."
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label>Empresa *</Label>
          <SearchCombobox
            items={empresaItems}
            value={empresaId}
            onChange={setEmpresaId}
            placeholder="Buscar por nombre o CUIT..."
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="camionId">Camión *</Label>
          <Select id="camionId" value={camionId} onChange={(e) => setCamionId(e.target.value)} required>
            <option value="">Seleccionar...</option>
            {camionesDelFletero.map((c) => (
              <option key={c.id} value={c.id}>{c.patenteChasis}</option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="choferId">Chofer *</Label>
          <Select id="choferId" value={choferId} onChange={(e) => setChoferId(e.target.value)} required>
            <option value="">Seleccionar...</option>
            {choferesDelFletero.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre} {c.apellido}</option>
            ))}
          </Select>
        </div>
      </div>

      {/* Fila 2: Fecha, Remito, Cupo */}
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="fechaViaje">Fecha viaje *</Label>
          <Input id="fechaViaje" type="date" value={fechaViaje} onChange={(e) => setFechaViaje(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="remito">Remito</Label>
          <Input id="remito" value={remito} onChange={(e) => setRemito(e.target.value)} placeholder="R-00001" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cupo">Cupo</Label>
          <Input id="cupo" value={cupo} onChange={(e) => setCupo(e.target.value)} />
        </div>
      </div>

      {/* Fila 3: Mercadería, Procedencia, Kilos */}
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="mercaderia">Mercadería</Label>
          <Input id="mercaderia" value={mercaderia} onChange={(e) => setMercaderia(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="procedencia">Procedencia</Label>
          <Input id="procedencia" value={procedencia} onChange={(e) => setProcedencia(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="kilos">Kilos</Label>
          <Input id="kilos" type="number" min="0" step="0.01" value={kilos} onChange={(e) => setKilos(e.target.value)} />
        </div>
      </div>

      {/* Fila 4: Origen → Destino */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Provincia origen</Label>
          <SearchCombobox
            items={PROVINCIAS_AR.map((p) => ({ id: p, label: p }))}
            value={provinciaOrigen}
            onChange={(v) => setProvinciaOrigen(v)}
            placeholder="Buscar provincia..."
          />
        </div>
        <div className="space-y-1.5">
          <Label>Provincia destino</Label>
          <SearchCombobox
            items={PROVINCIAS_AR.map((p) => ({ id: p, label: p }))}
            value={provinciaDestino}
            onChange={(v) => setProvinciaDestino(v)}
            placeholder="Buscar provincia..."
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="destino">Destino</Label>
          <Input id="destino" value={destino} onChange={(e) => setDestino(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tarifa" className="text-primary font-medium">Tarifa base ($) *</Label>
          <Input
            id="tarifa"
            type="number"
            min="0"
            step="0.01"
            value={tarifa}
            onChange={(e) => setTarifaBase(e.target.value)}
            required
            className="border-primary/40 focus:border-primary"
          />
        </div>
      </div>

      <FormError message={error} />

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={() => onSuccess?.()} disabled={loading}>
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={loading || !fleteroId || !camionId || !choferId || !empresaId || !tarifa}
        >
          {loading ? "Guardando..." : "Crear viaje"}
        </Button>
      </div>
    </form>
  )
}
