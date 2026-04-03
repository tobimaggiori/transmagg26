"use client"

/**
 * Componente ABM para gestión de cuentas bancarias y financieras.
 * Incluye búsqueda, creación y edición de cuentas (solo sub-cuentas),
 * eliminación (solo cuentas sin movimientos), y creación de bancos/sub-cuentas.
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
import { Plus, Pencil, Search, Trash2, Building2 } from "lucide-react"

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
  tieneIibbSircrebTucuman: boolean
  alicuotaIibbSircrebTucuman: number
  cuentaPadreId: string | null
  _count?: { movimientosSinFactura: number }
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

/**
 * esCuentaPadreBanco: CuentaAbm -> boolean
 *
 * Devuelve true si la cuenta es un banco padre (tipo BANCO y sin cuentaPadreId).
 */
function esCuentaPadreBanco(cuenta: CuentaAbm): boolean {
  return cuenta.tipo === "BANCO" && !cuenta.cuentaPadreId
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
    tieneIibbSircrebTucuman: cuenta?.tieneIibbSircrebTucuman ?? false,
    alicuotaIibbSircrebTucuman: String(cuenta?.alicuotaIibbSircrebTucuman ?? "0.06"),
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
        ? { nombre: form.nombre, tipo: form.tipo, bancoOEntidad: form.bancoOEntidad, moneda: form.moneda, activa: form.activa, tieneImpuestoDebcred: form.tieneImpuestoDebcred, alicuotaImpuesto: parseFloat(form.alicuotaImpuesto), tieneChequera: form.tieneChequera, tienePlanillaEmisionMasiva: form.tienePlanillaEmisionMasiva, tieneCuentaRemunerada: form.tieneCuentaRemunerada, tieneTarjetasPrepagasChoferes: form.tieneTarjetasPrepagasChoferes, tieneIibbSircrebTucuman: form.tieneIibbSircrebTucuman, alicuotaIibbSircrebTucuman: parseFloat(form.alicuotaIibbSircrebTucuman) }
        : { ...form, saldoInicial: parseFloat(form.saldoInicial), alicuotaImpuesto: parseFloat(form.alicuotaImpuesto), alicuotaIibbSircrebTucuman: parseFloat(form.alicuotaIibbSircrebTucuman) }
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
          { key: "tieneImpuestoDebcred", label: "Impuesto deb/cred" },
          { key: "tieneIibbSircrebTucuman", label: "IIBB SIRCREB Tucuman" },
        ].map(({ key, label }) => (
          <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={form[key as keyof typeof form] as boolean} onChange={(e) => setForm(f => ({ ...f, [key]: e.target.checked }))} />
            {label}
          </label>
        ))}
      </div>
      {form.tieneImpuestoDebcred && <div><Label>Alicuota impuesto deb/cred</Label><Input type="number" step="0.001" value={form.alicuotaImpuesto} onChange={(e) => setForm(f => ({ ...f, alicuotaImpuesto: e.target.value }))} /></div>}
      {form.tieneIibbSircrebTucuman && <div><Label>Alicuota IIBB SIRCREB Tucuman</Label><Input type="number" step="0.001" value={form.alicuotaIibbSircrebTucuman} onChange={(e) => setForm(f => ({ ...f, alicuotaIibbSircrebTucuman: e.target.value }))} /></div>}
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

function NuevoBancoModal({ onSuccess }: { onSuccess: () => void }) {
  const router = useRouter()
  const [nombre, setNombre] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nombre.trim()) { setError("El nombre es obligatorio"); return }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/cuentas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nombre.trim(),
          tipo: "BANCO",
          bancoOEntidad: nombre.trim(),
          moneda: "PESOS",
          saldoInicial: 0,
          activa: true,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error ?? "Error al crear el banco")
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
      <div>
        <Label>Nombre del banco</Label>
        <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Banco Galicia" required />
      </div>
      {error && <FormError message={error} />}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" disabled={loading}>{loading ? "Guardando..." : "Crear banco"}</Button>
      </div>
    </form>
  )
}

function NuevaSubcuentaModal({ bancosPadre, onSuccess }: { bancosPadre: CuentaAbm[]; onSuccess: () => void }) {
  const router = useRouter()
  const [bancoId, setBancoId] = useState(bancosPadre[0]?.id ?? "")
  const [moneda, setMoneda] = useState("PESOS")
  const [nroCuenta, setNroCuenta] = useState("")
  const [cbu, setCbu] = useState("")
  const [alias, setAlias] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const bancoPadre = bancosPadre.find((b) => b.id === bancoId)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!bancoId) { setError("Selecciona un banco padre"); return }
    if (!nroCuenta.trim()) { setError("El numero de cuenta es obligatorio"); return }
    setLoading(true)
    setError(null)
    try {
      const monedaLabel = moneda === "PESOS" ? "ARS" : "USD"
      const nombre = `${bancoPadre?.nombre ?? "Banco"} — CC ${monedaLabel}`
      const res = await fetch("/api/cuentas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre,
          tipo: "BANCO",
          bancoOEntidad: bancoPadre?.nombre ?? "",
          moneda,
          saldoInicial: 0,
          activa: true,
          cuentaPadreId: bancoId,
          nroCuenta: nroCuenta.trim(),
          cbu: cbu.trim() || null,
          alias: alias.trim() || null,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error ?? "Error al crear la sub-cuenta")
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
      <div>
        <Label>Banco padre</Label>
        <Select value={bancoId} onChange={(e) => setBancoId(e.target.value)}>
          {bancosPadre.map((b) => (
            <option key={b.id} value={b.id}>{b.nombre}</option>
          ))}
        </Select>
      </div>
      <div>
        <Label>Moneda</Label>
        <Select value={moneda} onChange={(e) => setMoneda(e.target.value)}>
          <option value="PESOS">ARS (Pesos)</option>
          <option value="DOLARES">USD (Dolares)</option>
        </Select>
      </div>
      <div>
        <Label>Numero de cuenta</Label>
        <Input value={nroCuenta} onChange={(e) => setNroCuenta(e.target.value)} placeholder="Ej: 123456789" required />
      </div>
      <div>
        <Label>CBU (22 digitos)</Label>
        <Input value={cbu} onChange={(e) => setCbu(e.target.value)} placeholder="Opcional" maxLength={22} />
      </div>
      <div>
        <Label>Alias</Label>
        <Input value={alias} onChange={(e) => setAlias(e.target.value)} placeholder="Opcional" />
      </div>
      {error && <FormError message={error} />}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" disabled={loading}>{loading ? "Guardando..." : "Crear sub-cuenta"}</Button>
      </div>
    </form>
  )
}

/**
 * CuentasAbm: CuentasAbmProps -> JSX.Element
 *
 * Dado la lista inicial de cuentas, renderiza la tabla ABM con busqueda, alta, edicion y eliminacion.
 * Los bancos padre (tipo BANCO sin cuentaPadreId) no se pueden editar.
 * Las cuentas sin movimientos se pueden eliminar (desactivar).
 * Existe para centralizar la gestion de cuentas bancarias en el ABM del administrador.
 *
 * Ejemplos:
 * <CuentasAbm cuentas={[]} /> // tabla vacia con boton alta
 * <CuentasAbm cuentas={[{ id, nombre: "Galicia" }]} /> // una fila con boton editar
 * <CuentasAbm cuentas={cuentas} /> // busqueda filtra resultados
 */
export function CuentasAbm({ cuentas: cuentasIniciales }: CuentasAbmProps) {
  const [cuentas, setCuentas] = useState(cuentasIniciales)
  const [busqueda, setBusqueda] = useState("")
  const [modalAlta, setModalAlta] = useState(false)
  const [cuentaEdicion, setCuentaEdicion] = useState<CuentaAbm | null>(null)
  const [modalBanco, setModalBanco] = useState(false)
  const [modalSubcuenta, setModalSubcuenta] = useState(false)
  const [eliminando, setEliminando] = useState<string | null>(null)

  const filtradas = cuentas.filter((c) => !busqueda || calcularFiltroCuenta(c, busqueda))
  const bancosPadre = cuentas.filter((c) => esCuentaPadreBanco(c))

  function recargar() {
    setModalAlta(false)
    setCuentaEdicion(null)
    setModalBanco(false)
    setModalSubcuenta(false)
    fetch("/api/cuentas").then(r => r.json()).then(d => setCuentas(Array.isArray(d) ? d : []))
  }

  async function eliminarCuenta(cuenta: CuentaAbm) {
    if (!confirm(`Desactivar la cuenta "${cuenta.nombre}"? Esta accion la marca como inactiva.`)) return
    setEliminando(cuenta.id)
    try {
      const res = await fetch(`/api/cuentas/${cuenta.id}`, { method: "DELETE" })
      if (res.ok) {
        recargar()
      } else {
        const d = await res.json()
        alert(d.error ?? "Error al eliminar")
      }
    } finally {
      setEliminando(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar cuenta..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
        </div>
        <Button variant="outline" onClick={() => setModalBanco(true)}>
          <Building2 className="h-4 w-4 mr-1" /> Agregar banco
        </Button>
        {bancosPadre.length > 0 && (
          <Button variant="outline" onClick={() => setModalSubcuenta(true)}>
            <Plus className="h-4 w-4 mr-1" /> Agregar sub-cuenta
          </Button>
        )}
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
            {filtradas.map((c) => {
              const esPadre = esCuentaPadreBanco(c)
              const tieneMovimientos = (c._count?.movimientosSinFactura ?? 0) > 0
              return (
                <tr key={c.id} className={`border-t hover:bg-muted/20 ${esPadre ? "bg-muted/10" : ""}`}>
                  <td className="px-4 py-3 font-medium">
                    {esPadre ? c.nombre : <span className="pl-4">{c.nombre}</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-muted px-2 py-0.5 rounded">
                      {esPadre ? "BANCO (padre)" : c.tipo}
                    </span>
                  </td>
                  <td className="px-4 py-3">{c.bancoOEntidad}</td>
                  <td className="px-4 py-3">{c.moneda}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${c.activa ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>
                      {c.activa ? "Activa" : "Inactiva"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-1">
                    {!esPadre && (
                      <Button variant="outline" size="sm" onClick={() => setCuentaEdicion(c)}>
                        <Pencil className="h-3 w-3 mr-1" /> Editar
                      </Button>
                    )}
                    {!tieneMovimientos && c.activa && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => eliminarCuenta(c)}
                        disabled={eliminando === c.id}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3 mr-1" /> {eliminando === c.id ? "..." : "Eliminar"}
                      </Button>
                    )}
                  </td>
                </tr>
              )
            })}
            {filtradas.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Sin cuentas{busqueda ? " que coincidan con la busqueda" : ""}.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={modalAlta} onOpenChange={setModalAlta}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nueva cuenta</DialogTitle><DialogDescription>Crear una nueva cuenta bancaria o financiera</DialogDescription></DialogHeader>
          <CuentaFormModal onSuccess={recargar} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!cuentaEdicion} onOpenChange={() => setCuentaEdicion(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar cuenta</DialogTitle><DialogDescription>{cuentaEdicion?.nombre}</DialogDescription></DialogHeader>
          {cuentaEdicion && <CuentaFormModal cuenta={cuentaEdicion} onSuccess={recargar} />}
        </DialogContent>
      </Dialog>

      <Dialog open={modalBanco} onOpenChange={setModalBanco}>
        <DialogContent>
          <DialogHeader><DialogTitle>Agregar banco</DialogTitle><DialogDescription>Crear un nuevo banco padre</DialogDescription></DialogHeader>
          <NuevoBancoModal onSuccess={recargar} />
        </DialogContent>
      </Dialog>

      <Dialog open={modalSubcuenta} onOpenChange={setModalSubcuenta}>
        <DialogContent>
          <DialogHeader><DialogTitle>Agregar sub-cuenta</DialogTitle><DialogDescription>Crear una sub-cuenta bajo un banco existente</DialogDescription></DialogHeader>
          <NuevaSubcuentaModal bancosPadre={bancosPadre} onSuccess={recargar} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
