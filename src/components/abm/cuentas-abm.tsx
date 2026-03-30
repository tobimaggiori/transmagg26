"use client"

/**
 * Componente ABM para gestión de cuentas bancarias y financieras.
 * Incluye búsqueda, creación y edición de cuentas.
 */

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { FormError } from "@/components/ui/form-error"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Plus, Pencil, Search } from "lucide-react"

export interface CuentaAbm {
  id: string
  nombre: string
  tipo: string
  bancoOEntidad: string
  moneda: string
  activa: boolean
  tieneChequera: boolean
  tienePlanillaEmisionMasiva: boolean
  tieneCuentaRemunerada: boolean
  tieneTarjetasPrepagasChoferes: boolean
  tieneImpuestoDebcred: boolean
  alicuotaImpuesto: number
}

interface CuentasAbmProps {
  cuentas: CuentaAbm[]
}

/**
 * calcularFiltroCuenta: CuentaAbm string -> boolean
 *
 * Dado una cuenta y un texto de búsqueda, devuelve true si el nombre o entidad
 * contienen el texto (insensible a mayúsculas).
 * Existe para filtrar la lista de cuentas en el ABM sin roundtrips al servidor.
 *
 * Ejemplos:
 * calcularFiltroCuenta({ nombre: "Galicia Pesos", bancoOEntidad: "Banco Galicia" }, "gali") === true
 * calcularFiltroCuenta({ nombre: "Galicia Pesos", bancoOEntidad: "Banco Galicia" }, "pesos") === true
 * calcularFiltroCuenta({ nombre: "Galicia Pesos", bancoOEntidad: "Banco Galicia" }, "bna") === false
 */
export function calcularFiltroCuenta(cuenta: CuentaAbm, busqueda: string): boolean {
  const q = busqueda.toLowerCase()
  return cuenta.nombre.toLowerCase().includes(q) || cuenta.bancoOEntidad.toLowerCase().includes(q)
}

function CuentaFormModal({ cuenta, onSuccess }: { cuenta?: CuentaAbm; onSuccess: () => void }) {
  const router = useRouter()
  const isEdit = !!cuenta
  const [form, setForm] = useState({
    nombre: cuenta?.nombre ?? "",
    tipo: cuenta?.tipo ?? "BANCO",
    bancoOEntidad: cuenta?.bancoOEntidad ?? "",
    moneda: cuenta?.moneda ?? "PESOS",
    saldoInicial: "0",
    activa: cuenta?.activa ?? true,
    tieneImpuestoDebcred: cuenta?.tieneImpuestoDebcred ?? false,
    alicuotaImpuesto: String(cuenta?.alicuotaImpuesto ?? "0.006"),
    tieneChequera: cuenta?.tieneChequera ?? false,
    tienePlanillaEmisionMasiva: cuenta?.tienePlanillaEmisionMasiva ?? false,
    tieneCuentaRemunerada: cuenta?.tieneCuentaRemunerada ?? false,
    tieneTarjetasPrepagasChoferes: cuenta?.tieneTarjetasPrepagasChoferes ?? false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const url = isEdit ? `/api/cuentas/${cuenta.id}` : "/api/cuentas"
      const method = isEdit ? "PATCH" : "POST"
      const body = isEdit
        ? { nombre: form.nombre, tipo: form.tipo, bancoOEntidad: form.bancoOEntidad, moneda: form.moneda, activa: form.activa, tieneImpuestoDebcred: form.tieneImpuestoDebcred, alicuotaImpuesto: parseFloat(form.alicuotaImpuesto), tieneChequera: form.tieneChequera, tienePlanillaEmisionMasiva: form.tienePlanillaEmisionMasiva, tieneCuentaRemunerada: form.tieneCuentaRemunerada, tieneTarjetasPrepagasChoferes: form.tieneTarjetasPrepagasChoferes }
        : { ...form, saldoInicial: parseFloat(form.saldoInicial), alicuotaImpuesto: parseFloat(form.alicuotaImpuesto) }
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error ?? "Error al guardar")
      } else {
        onSuccess()
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div><Label htmlFor="nombre">Nombre</Label><Input id="nombre" name="nombre" value={form.nombre} onChange={(e) => setForm(f => ({ ...f, nombre: e.target.value }))} required /></div>
        <div><Label htmlFor="tipo">Tipo</Label>
          <Select id="tipo" name="tipo" value={form.tipo} onChange={(e) => setForm(f => ({ ...f, tipo: e.target.value }))}>
            <option value="BANCO">BANCO</option>
            <option value="BILLETERA_VIRTUAL">BILLETERA_VIRTUAL</option>
            <option value="BROKER">BROKER</option>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label htmlFor="bancoOEntidad">Entidad</Label><Input id="bancoOEntidad" name="bancoOEntidad" value={form.bancoOEntidad} onChange={(e) => setForm(f => ({ ...f, bancoOEntidad: e.target.value }))} required /></div>
        <div><Label htmlFor="moneda">Moneda</Label>
          <Select id="moneda" name="moneda" value={form.moneda} onChange={(e) => setForm(f => ({ ...f, moneda: e.target.value }))}>
            <option value="PESOS">PESOS</option>
            <option value="DOLARES">DOLARES</option>
            <option value="OTRO">OTRO</option>
          </Select>
        </div>
      </div>
      {!isEdit && <div><Label htmlFor="saldoInicial">Saldo inicial</Label><Input id="saldoInicial" type="number" value={form.saldoInicial} onChange={(e) => setForm(f => ({ ...f, saldoInicial: e.target.value }))} /></div>}
      <div className="grid grid-cols-2 gap-3">
        {[
          { key: "tieneChequera", label: "Chequera" },
          { key: "tienePlanillaEmisionMasiva", label: "Planilla masiva" },
          { key: "tieneCuentaRemunerada", label: "Cuenta remunerada" },
          { key: "tieneTarjetasPrepagasChoferes", label: "Tarjetas prepagas" },
          { key: "tieneImpuestoDebcred", label: "Impuesto déb/créd" },
        ].map(({ key, label }) => (
          <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={form[key as keyof typeof form] as boolean} onChange={(e) => setForm(f => ({ ...f, [key]: e.target.checked }))} />
            {label}
          </label>
        ))}
      </div>
      {form.tieneImpuestoDebcred && <div><Label>Alícuota impuesto</Label><Input type="number" step="0.001" value={form.alicuotaImpuesto} onChange={(e) => setForm(f => ({ ...f, alicuotaImpuesto: e.target.value }))} /></div>}
      {isEdit && (
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={form.activa} onChange={(e) => setForm(f => ({ ...f, activa: e.target.checked }))} />
          Activa
        </label>
      )}
      {error && <FormError message={error} />}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" disabled={loading}>{loading ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear cuenta"}</Button>
      </div>
    </form>
  )
}

/**
 * CuentasAbm: CuentasAbmProps -> JSX.Element
 *
 * Dado la lista inicial de cuentas, renderiza la tabla ABM con búsqueda, alta y edición.
 * Existe para centralizar la gestión de cuentas bancarias en el ABM del administrador.
 *
 * Ejemplos:
 * <CuentasAbm cuentas={[]} /> // tabla vacía con botón alta
 * <CuentasAbm cuentas={[{ id, nombre: "Galicia" }]} /> // una fila con botón editar
 * <CuentasAbm cuentas={cuentas} /> // búsqueda filtra resultados
 */
export function CuentasAbm({ cuentas: cuentasIniciales }: CuentasAbmProps) {
  const [cuentas, setCuentas] = useState(cuentasIniciales)
  const [busqueda, setBusqueda] = useState("")
  const [modalAlta, setModalAlta] = useState(false)
  const [cuentaEdicion, setCuentaEdicion] = useState<CuentaAbm | null>(null)

  const filtradas = cuentas.filter((c) => !busqueda || calcularFiltroCuenta(c, busqueda))

  function onSuccess() {
    setModalAlta(false)
    setCuentaEdicion(null)
    fetch("/api/cuentas").then(r => r.json()).then(d => setCuentas(Array.isArray(d) ? d : []))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar cuenta..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
        </div>
        <Button onClick={() => setModalAlta(true)}><Plus className="h-4 w-4 mr-1" /> Nueva cuenta</Button>
      </div>

      <div className="border rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3">Nombre</th>
              <th className="text-left px-4 py-3">Tipo</th>
              <th className="text-left px-4 py-3">Entidad</th>
              <th className="text-left px-4 py-3">Moneda</th>
              <th className="text-left px-4 py-3">Estado</th>
              <th className="text-right px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtradas.map((c) => (
              <tr key={c.id} className="border-t hover:bg-muted/20">
                <td className="px-4 py-3 font-medium">{c.nombre}</td>
                <td className="px-4 py-3"><span className="text-xs bg-muted px-2 py-0.5 rounded">{c.tipo}</span></td>
                <td className="px-4 py-3">{c.bancoOEntidad}</td>
                <td className="px-4 py-3">{c.moneda}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${c.activa ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>
                    {c.activa ? "Activa" : "Inactiva"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Button variant="outline" size="sm" onClick={() => setCuentaEdicion(c)}>
                    <Pencil className="h-3 w-3 mr-1" /> Editar
                  </Button>
                </td>
              </tr>
            ))}
            {filtradas.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Sin cuentas{busqueda ? " que coincidan con la búsqueda" : ""}.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={modalAlta} onOpenChange={setModalAlta}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nueva cuenta</DialogTitle><DialogDescription>Crear una nueva cuenta bancaria o financiera</DialogDescription></DialogHeader>
          <CuentaFormModal onSuccess={onSuccess} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!cuentaEdicion} onOpenChange={() => setCuentaEdicion(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar cuenta</DialogTitle><DialogDescription>{cuentaEdicion?.nombre}</DialogDescription></DialogHeader>
          {cuentaEdicion && <CuentaFormModal cuenta={cuentaEdicion} onSuccess={onSuccess} />}
        </DialogContent>
      </Dialog>
    </div>
  )
}
