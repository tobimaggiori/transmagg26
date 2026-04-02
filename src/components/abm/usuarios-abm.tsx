"use client"

/**
 * Componente ABM para gestión de usuarios del sistema.
 * Filtro por Tipo: Transmagg / Empresas / Fleteros.
 * El tipo determina los roles disponibles al crear un usuario y
 * si se requiere seleccionar una empresa o un fletero como contexto.
 */

import { useState, useEffect, useRef } from "react"
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
import { Plus, Pencil, Trash2, Search, Mail, Settings, Building2, Truck, Users } from "lucide-react"
import { SearchCombobox } from "@/components/ui/search-combobox"
import type { Rol } from "@/types"

export interface UsuarioAbm {
  id: string
  nombre: string
  apellido: string
  email: string
  telefono: string | null
  rol: string
  activo: boolean
  fleteroId: string | null
  fleteroPropio: { id: string } | null
  smtpHost: string | null
  smtpPuerto: number | null
  smtpUsuario: string | null
  smtpSsl: boolean
  smtpActivo: boolean
  smtpTienePassword: boolean
  empresaUsuarios: { empresaId: string; empresa: { razonSocial: string }; nivelAcceso: string }[]
}

export interface EmpresaSimple {
  id: string
  razonSocial: string
  cuit: string
}

export interface FleteroSimple {
  id: string
  razonSocial: string
  cuit: string
}

type Tipo = "transmagg" | "empresas" | "fleteros"

interface UsuariosAbmProps {
  usuarios: UsuarioAbm[]
  empresas: EmpresaSimple[]
  fleteros: FleteroSimple[]
  rolActual: string
}

const ROLES_DISPLAY: Record<string, string> = {
  ADMIN_TRANSMAGG: "Admin Transmagg",
  OPERADOR_TRANSMAGG: "Operador Transmagg",
  FLETERO: "Fletero",
  CHOFER: "Chofer",
  ADMIN_EMPRESA: "Admin Empresa",
  OPERADOR_EMPRESA: "Operador Empresa",
}

const COLORES_ROL: Record<string, string> = {
  ADMIN_TRANSMAGG: "bg-purple-100 text-purple-800",
  OPERADOR_TRANSMAGG: "bg-blue-100 text-blue-800",
  FLETERO: "bg-orange-100 text-orange-800",
  CHOFER: "bg-yellow-100 text-yellow-800",
  ADMIN_EMPRESA: "bg-green-100 text-green-800",
  OPERADOR_EMPRESA: "bg-teal-100 text-teal-800",
}

const ROLES_POR_TIPO: Record<Tipo, string[]> = {
  transmagg: ["ADMIN_TRANSMAGG", "OPERADOR_TRANSMAGG"],
  empresas: ["ADMIN_EMPRESA", "OPERADOR_EMPRESA"],
  fleteros: ["FLETERO", "CHOFER"],
}

export function calcularFiltroUsuario(usuario: UsuarioAbm, busqueda: string): boolean {
  const q = busqueda.toLowerCase()
  return (
    usuario.nombre.toLowerCase().includes(q) ||
    usuario.apellido.toLowerCase().includes(q) ||
    usuario.email.toLowerCase().includes(q) ||
    usuario.rol.toLowerCase().includes(q)
  )
}

// ─── Modal SMTP ───────────────────────────────────────────────────────────────

function SmtpModal({
  usuario,
  onClose,
}: {
  usuario: UsuarioAbm
  onClose: () => void
}) {
  const router = useRouter()
  const [form, setForm] = useState({
    smtpHost: usuario.smtpHost ?? "",
    smtpPuerto: usuario.smtpPuerto ? String(usuario.smtpPuerto) : "587",
    smtpUsuario: usuario.smtpUsuario ?? usuario.email,
    smtpPassword: "",
    smtpSsl: usuario.smtpSsl,
    smtpActivo: usuario.smtpActivo,
  })
  const [loading, setLoading] = useState(false)
  const [probando, setProbando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }))
    setTestResult(null)
  }

  async function handleProbar() {
    setProbando(true)
    setTestResult(null)
    setError(null)
    try {
      const res = await fetch(`/api/abm/usuarios/${usuario.id}/probar-smtp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          smtpHost: form.smtpHost,
          smtpPuerto: parseInt(form.smtpPuerto, 10),
          smtpUsuario: form.smtpUsuario,
          smtpPassword: form.smtpPassword || undefined,
          smtpSsl: form.smtpSsl,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setTestResult({ ok: true, msg: "Conexión exitosa" })
      } else {
        setTestResult({ ok: false, msg: (data as { error?: string }).error ?? "Conexión fallida" })
      }
    } catch {
      setTestResult({ ok: false, msg: "Error de red" })
    } finally {
      setProbando(false)
    }
  }

  async function handleGuardar(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/abm/usuarios/${usuario.id}/smtp`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          smtpHost: form.smtpHost,
          smtpPuerto: parseInt(form.smtpPuerto, 10),
          smtpUsuario: form.smtpUsuario,
          smtpPassword: form.smtpPassword || undefined,
          smtpSsl: form.smtpSsl,
          smtpActivo: form.smtpActivo,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setError((data as { error?: string }).error ?? `Error ${res.status} al guardar`); return }
      router.refresh()
      onClose()
    } catch {
      setError("Error de red al guardar.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleGuardar} className="space-y-4">
      <div className="bg-muted/40 rounded-md px-3 py-2 text-sm">
        <span className="text-muted-foreground">Remitente: </span>
        <span className="font-medium">{usuario.email}</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1 col-span-2 sm:col-span-1">
          <Label htmlFor="smtpHost">Servidor SMTP *</Label>
          <Input id="smtpHost" name="smtpHost" value={form.smtpHost} onChange={handleChange} placeholder="smtp.gmail.com" required disabled={loading} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="smtpPuerto">Puerto *</Label>
          <Input id="smtpPuerto" name="smtpPuerto" type="number" value={form.smtpPuerto} onChange={handleChange} placeholder="587" required disabled={loading} />
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="smtpUsuario">Usuario SMTP *</Label>
        <Input id="smtpUsuario" name="smtpUsuario" value={form.smtpUsuario} onChange={handleChange} placeholder="usuario@empresa.com" required disabled={loading} />
      </div>

      <div className="space-y-1">
        <Label htmlFor="smtpPassword">
          Contraseña SMTP {usuario.smtpTienePassword && <span className="text-xs text-muted-foreground">(ya configurada — dejar vacío para no cambiar)</span>}
        </Label>
        <Input id="smtpPassword" name="smtpPassword" type="password" value={form.smtpPassword} onChange={handleChange} placeholder={usuario.smtpTienePassword ? "••••••••" : "Contraseña"} disabled={loading} autoComplete="new-password" />
      </div>

      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" name="smtpSsl" checked={form.smtpSsl} onChange={handleChange} className="h-4 w-4 rounded border-input" disabled={loading} />
          Usar SSL/TLS
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" name="smtpActivo" checked={form.smtpActivo} onChange={handleChange} className="h-4 w-4 rounded border-input" disabled={loading} />
          SMTP activo (habilitar envío de emails)
        </label>
      </div>

      {testResult && (
        <p className={`text-sm font-medium ${testResult.ok ? "text-green-600" : "text-destructive"}`}>
          {testResult.ok ? "✓ " : "✗ "}{testResult.msg}
        </p>
      )}

      <FormError message={error} />

      <div className="flex justify-between gap-2 pt-2">
        <Button type="button" variant="outline" onClick={handleProbar} disabled={loading || probando || !form.smtpHost || (!form.smtpPassword && !usuario.smtpTienePassword)}>
          {probando ? "Probando..." : "Probar conexión"}
        </Button>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancelar</Button>
          <Button type="submit" disabled={loading}>{loading ? "Guardando..." : "Guardar"}</Button>
        </div>
      </div>
    </form>
  )
}

// ─── Árbol de permisos y PermisosPanel ───────────────────────────────────────

const ARBOL_PERMISOS = [
  {
    label: "Dashboard", seccion: "dashboard",
    sub: [
      { label: "Deuda de Empresas", seccion: "dashboard.deuda_empresas" },
      { label: "Deuda a Fleteros", seccion: "dashboard.deuda_fleteros" },
      { label: "Pendiente de Facturar", seccion: "dashboard.pendiente_facturar" },
      { label: "Pendiente de Liquidar", seccion: "dashboard.pendiente_liquidar" },
      { label: "Cheques en Cartera", seccion: "dashboard.cheques_cartera" },
      { label: "Cheques Emitidos", seccion: "dashboard.cheques_emitidos" },
      { label: "Efectivo en Caja", seccion: "dashboard.efectivo_caja" },
      { label: "Cuentas — Bancos", seccion: "dashboard.cuentas_bancos" },
      { label: "Cuentas — Brokers", seccion: "dashboard.cuentas_brokers" },
      { label: "Cuentas — Billeteras", seccion: "dashboard.cuentas_billeteras" },
    ]
  },
  {
    label: "Fleteros", seccion: "fleteros",
    sub: [
      { label: "Viajes", seccion: "fleteros.viajes" },
      { label: "Líquidos Productos", seccion: "fleteros.liquidos_productos" },
      { label: "Órdenes de Pago", seccion: "fleteros.ordenes_pago" },
      { label: "Gastos y Adelantos", seccion: "fleteros.gastos_adelantos" },
      { label: "Cuentas Corrientes", seccion: "fleteros.cuentas_corrientes" },
    ]
  },
  {
    label: "Empresas", seccion: "empresas",
    sub: [
      { label: "Facturas", seccion: "empresas.facturas" },
      { label: "Recibos", seccion: "empresas.recibos" },
      { label: "Cuentas Corrientes", seccion: "empresas.cuentas_corrientes" },
    ]
  },
  {
    label: "Proveedores", seccion: "proveedores",
    sub: [
      { label: "Facturas", seccion: "proveedores.facturas" },
      { label: "Registrar Pago", seccion: "proveedores.pagos" },
      { label: "Cuentas Corrientes", seccion: "proveedores.cuentas_corrientes" },
    ]
  },
  {
    label: "Contabilidad", seccion: "contabilidad",
    sub: [
      { label: "Reportes", seccion: "contabilidad.reportes" },
      { label: "Pólizas de Seguro", seccion: "contabilidad.polizas" },
    ]
  },
  {
    label: "Cuentas", seccion: "cuentas",
    sub: [
      { label: "Bancos", seccion: "cuentas.bancos" },
      { label: "Brokers", seccion: "cuentas.brokers" },
      { label: "Billeteras", seccion: "cuentas.billeteras" },
    ]
  },
  {
    label: "Aseguradoras", seccion: "aseguradoras",
    sub: []
  },
]

/**
 * PermisosPanel: { usuarioId } -> JSX.Element
 *
 * Dado el id de un OPERADOR_TRANSMAGG, carga y permite editar sus permisos
 * granulares por sección. Muestra un árbol de checkboxes con estado indeterminate
 * en los padres cuando solo algunos hijos están habilitados.
 * Existe para que el ADMIN_TRANSMAGG configure qué secciones puede ver cada operador.
 */
function PermisosPanel({ usuarioId }: { usuarioId: string }) {
  const [permisos, setPermisos] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [resultado, setResultado] = useState<{ ok: boolean; msg: string } | null>(null)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/usuarios/${usuarioId}/permisos`)
      .then(r => r.json())
      .then((data: { permisos: string[] }) => {
        setPermisos(new Set(data.permisos ?? []))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [usuarioId])

  function toggleSeccion(seccion: string) {
    setPermisos(prev => {
      const next = new Set(prev)
      if (next.has(seccion)) next.delete(seccion)
      else next.add(seccion)
      return next
    })
    setResultado(null)
  }

  function toggleGrupo(grupo: typeof ARBOL_PERMISOS[number]) {
    const secciones = grupo.sub.length > 0
      ? grupo.sub.map(s => s.seccion)
      : [grupo.seccion]
    const todasChecked = secciones.every(s => permisos.has(s))
    setPermisos(prev => {
      const next = new Set(prev)
      if (todasChecked) {
        secciones.forEach(s => next.delete(s))
        next.delete(grupo.seccion)
      } else {
        secciones.forEach(s => next.add(s))
        if (grupo.sub.length === 0) next.add(grupo.seccion)
      }
      return next
    })
    setResultado(null)
  }

  async function handleGuardar() {
    setGuardando(true)
    setResultado(null)
    try {
      const res = await fetch(`/api/usuarios/${usuarioId}/permisos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permisos: Array.from(permisos) }),
      })
      const data = await res.json()
      if (res.ok) {
        setResultado({ ok: true, msg: "Permisos guardados correctamente" })
      } else {
        setResultado({ ok: false, msg: (data as { error?: string }).error ?? "Error al guardar" })
      }
    } catch {
      setResultado({ ok: false, msg: "Error de red" })
    } finally {
      setGuardando(false)
    }
  }

  if (loading) return <p className="text-sm text-muted-foreground">Cargando permisos...</p>

  return (
    <div className="space-y-3">
      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {ARBOL_PERMISOS.map((grupo) => {
          const secciones = grupo.sub.length > 0 ? grupo.sub.map(s => s.seccion) : [grupo.seccion]
          const checkedCount = secciones.filter(s => permisos.has(s)).length
          const allChecked = checkedCount === secciones.length
          const someChecked = checkedCount > 0 && !allChecked

          return (
            <div key={grupo.seccion} className="space-y-1">
              <GrupoCheckbox
                label={grupo.label}
                allChecked={allChecked}
                someChecked={someChecked}
                onChange={() => toggleGrupo(grupo)}
              />
              {grupo.sub.length > 0 && (
                <div className="ml-5 space-y-0.5">
                  {grupo.sub.map((item) => (
                    <label key={item.seccion} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={permisos.has(item.seccion)}
                        onChange={() => toggleSeccion(item.seccion)}
                        className="h-3.5 w-3.5 rounded border-input"
                      />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {resultado && (
        <p className={`text-sm font-medium ${resultado.ok ? "text-green-600" : "text-destructive"}`}>
          {resultado.ok ? "✓ " : "✗ "}{resultado.msg}
        </p>
      )}

      <div className="flex justify-end pt-1">
        <Button type="button" size="sm" onClick={handleGuardar} disabled={guardando}>
          {guardando ? "Guardando..." : "Guardar permisos"}
        </Button>
      </div>
    </div>
  )
}

/**
 * GrupoCheckbox: checkbox padre con soporte de estado indeterminate.
 * Usa ref para setear la propiedad nativa `indeterminate` en el DOM.
 */
function GrupoCheckbox({
  label,
  allChecked,
  someChecked,
  onChange,
}: {
  label: string
  allChecked: boolean
  someChecked: boolean
  onChange: () => void
}) {
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = someChecked
    }
  }, [someChecked])

  return (
    <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
      <input
        ref={ref}
        type="checkbox"
        checked={allChecked}
        onChange={onChange}
        className="h-3.5 w-3.5 rounded border-input"
      />
      <span>{label}</span>
    </label>
  )
}

// ─── Modal crear/editar usuario ───────────────────────────────────────────────

function UsuarioFormModal({
  usuario,
  empresas,
  fleteros,
  tipo,
  contextoId,
  onSuccess,
}: {
  usuario?: UsuarioAbm
  empresas: EmpresaSimple[]
  fleteros: FleteroSimple[]
  tipo: Tipo
  contextoId?: string
  onSuccess: () => void
}) {
  const router = useRouter()
  const rolesDisponibles = ROLES_POR_TIPO[tipo]
  const defaultRol = rolesDisponibles[rolesDisponibles.length - 1] // more restrictive by default
  const isEdit = !!usuario

  const [form, setForm] = useState({
    nombre: usuario?.nombre ?? "",
    apellido: usuario?.apellido ?? "",
    email: usuario?.email ?? "",
    telefono: usuario?.telefono ?? "",
    rol: (usuario?.rol ?? defaultRol) as Rol,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const url = isEdit ? `/api/usuarios/${usuario.id}` : "/api/usuarios"
      const body = isEdit
        ? { nombre: form.nombre, apellido: form.apellido, telefono: form.telefono || undefined, rol: form.rol }
        : {
            nombre: form.nombre,
            apellido: form.apellido,
            email: form.email,
            telefono: form.telefono || undefined,
            rol: form.rol,
            ...(tipo === "empresas" && contextoId ? { empresaId: contextoId } : {}),
            ...(tipo === "fleteros" && contextoId && form.rol === "CHOFER" ? { fleteroId: contextoId } : {}),
          }
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) { setError((data as { error?: string }).error ?? "Error al guardar"); return }
      router.refresh()
      onSuccess()
    } catch {
      setError("Error de conexión.")
    } finally {
      setLoading(false)
    }
  }

  // Context label for the create form
  const contextoLabel = tipo === "empresas" && contextoId
    ? empresas.find((e) => e.id === contextoId)?.razonSocial
    : tipo === "fleteros" && contextoId
    ? fleteros.find((f) => f.id === contextoId)?.razonSocial
    : null

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {!isEdit && contextoLabel && (
        <div className="bg-muted/40 rounded-md px-3 py-2 text-sm">
          <span className="text-muted-foreground">{tipo === "empresas" ? "Empresa:" : "Fletero:"} </span>
          <span className="font-medium">{contextoLabel}</span>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="nombre">Nombre *</Label>
          <Input id="nombre" name="nombre" value={form.nombre} onChange={handleChange} required disabled={loading} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="apellido">Apellido *</Label>
          <Input id="apellido" name="apellido" value={form.apellido} onChange={handleChange} required disabled={loading} />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="email">Email *</Label>
        <Input id="email" name="email" type="email" value={form.email} onChange={handleChange} required disabled={loading || isEdit} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="telefono">Teléfono</Label>
        <Input id="telefono" name="telefono" value={form.telefono} onChange={handleChange} disabled={loading} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="rol">Rol *</Label>
        <Select id="rol" name="rol" value={form.rol} onChange={handleChange} disabled={loading}>
          {rolesDisponibles.map((k) => (
            <option key={k} value={k}>{ROLES_DISPLAY[k] ?? k}</option>
          ))}
        </Select>
      </div>
      <FormError message={error} />
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onSuccess} disabled={loading}>Cancelar</Button>
        <Button type="submit" disabled={loading}>{loading ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear usuario"}</Button>
      </div>
    </form>
  )
}

// ─── Fila de usuario ──────────────────────────────────────────────────────────

function FilaUsuario({
  u,
  rolActual,
  mostrarSmtp,
  onEditar,
  onEliminar,
  onSmtp,
}: {
  u: UsuarioAbm
  rolActual: string
  mostrarSmtp: boolean
  onEditar: (u: UsuarioAbm) => void
  onEliminar: (u: UsuarioAbm) => void
  onSmtp: (u: UsuarioAbm) => void
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-medium">{u.apellido}, {u.nombre}</p>
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${COLORES_ROL[u.rol] ?? "bg-gray-100 text-gray-800"}`}>
            {ROLES_DISPLAY[u.rol] ?? u.rol}
          </span>
          {!u.activo && <span className="text-xs text-destructive">(inactivo)</span>}
          {mostrarSmtp && (
            u.smtpActivo
              ? <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-800">
                  <Mail className="h-3 w-3" /> SMTP activo
                </span>
              : <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-500">
                  <Mail className="h-3 w-3" /> Sin SMTP
                </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {u.email}
          {u.empresaUsuarios.length > 0 && ` · ${u.empresaUsuarios[0].empresa.razonSocial}`}
        </p>
      </div>
      <div className="flex gap-2 ml-3">
        {mostrarSmtp && rolActual === "ADMIN_TRANSMAGG" && (
          <Button variant="outline" size="sm" onClick={() => onSmtp(u)}>
            <Settings className="h-3.5 w-3.5 mr-1" /> SMTP
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={() => onEditar(u)}>
          <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
        </Button>
        <Button variant="destructive" size="sm" onClick={() => onEliminar(u)} disabled={!u.activo}>
          <Trash2 className="h-3.5 w-3.5 mr-1" /> Desactivar
        </Button>
      </div>
    </div>
  )
}

// ─── Lista de usuarios con dialogs de crear/editar/eliminar ──────────────────

function ListaUsuarios({
  usuarios,
  rolActual,
  mostrarSmtp,
  empresas,
  fleteros,
  tipo,
  contextoId,
  onSmtp,
}: {
  usuarios: UsuarioAbm[]
  rolActual: string
  mostrarSmtp: boolean
  empresas: EmpresaSimple[]
  fleteros: FleteroSimple[]
  tipo: Tipo
  contextoId?: string
  onSmtp: (u: UsuarioAbm) => void
}) {
  const router = useRouter()
  const [dialogCrear, setDialogCrear] = useState(false)
  const [dialogEditar, setDialogEditar] = useState<UsuarioAbm | null>(null)
  const [dialogEliminar, setDialogEliminar] = useState<UsuarioAbm | null>(null)
  const [loadingElim, setLoadingElim] = useState(false)
  const [errorElim, setErrorElim] = useState<string | null>(null)

  async function handleEliminar() {
    if (!dialogEliminar) return
    setLoadingElim(true)
    setErrorElim(null)
    try {
      const res = await fetch(`/api/usuarios/${dialogEliminar.id}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) { setErrorElim((data as { error?: string }).error ?? "Error al desactivar"); return }
      router.refresh()
      setDialogEliminar(null)
    } catch {
      setErrorElim("Error de conexión.")
    } finally {
      setLoadingElim(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setDialogCrear(true)}>
          <Plus className="h-4 w-4 mr-1" /> Nuevo usuario
        </Button>
      </div>

      {usuarios.length === 0 ? (
        <p className="text-sm text-center py-8 text-muted-foreground border rounded-lg">Sin usuarios en esta sección.</p>
      ) : (
        <div className="border rounded-lg divide-y">
          {usuarios.map((u) => (
            <FilaUsuario
              key={u.id}
              u={u}
              rolActual={rolActual}
              mostrarSmtp={mostrarSmtp}
              onEditar={(u) => setDialogEditar(u)}
              onEliminar={(u) => setDialogEliminar(u)}
              onSmtp={onSmtp}
            />
          ))}
        </div>
      )}

      <Dialog open={dialogCrear} onOpenChange={setDialogCrear}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo usuario</DialogTitle>
            <DialogDescription>Registrá un nuevo usuario y asigná su rol.</DialogDescription>
          </DialogHeader>
          <UsuarioFormModal
            empresas={empresas}
            fleteros={fleteros}
            tipo={tipo}
            contextoId={contextoId}
            onSuccess={() => setDialogCrear(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!dialogEditar} onOpenChange={(o) => { if (!o) setDialogEditar(null) }}>
        <DialogContent className={dialogEditar?.rol === "OPERADOR_TRANSMAGG" ? "max-w-2xl" : undefined}>
          <DialogHeader>
            <DialogTitle>Editar usuario</DialogTitle>
            <DialogDescription>Modificá los datos del usuario.</DialogDescription>
          </DialogHeader>
          {dialogEditar && (
            <>
              <UsuarioFormModal
                usuario={dialogEditar}
                empresas={empresas}
                fleteros={fleteros}
                tipo={tipo}
                onSuccess={() => setDialogEditar(null)}
              />
              {dialogEditar.rol === "OPERADOR_TRANSMAGG" && (
                <div className="border-t pt-4 mt-2">
                  <h3 className="text-sm font-semibold mb-3">Permisos</h3>
                  <PermisosPanel usuarioId={dialogEditar.id} />
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!dialogEliminar} onOpenChange={(o) => { if (!o) { setDialogEliminar(null); setErrorElim(null) } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Desactivar usuario</DialogTitle>
            <DialogDescription>
              ¿Desactivar a <strong>{dialogEliminar?.nombre} {dialogEliminar?.apellido}</strong>?
            </DialogDescription>
          </DialogHeader>
          <FormError message={errorElim} />
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDialogEliminar(null)} disabled={loadingElim}>Cancelar</Button>
            <Button variant="destructive" onClick={handleEliminar} disabled={loadingElim}>
              {loadingElim ? "Desactivando..." : "Desactivar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function UsuariosAbm({ usuarios, empresas, fleteros, rolActual }: UsuariosAbmProps) {
  const [tipo, setTipo] = useState<Tipo>("transmagg")
  const [empresaSelId, setEmpresaSelId] = useState("")
  const [fleteroSelId, setFleteroSelId] = useState("")
  const [busqueda, setBusqueda] = useState("")
  const [dialogSmtp, setDialogSmtp] = useState<UsuarioAbm | null>(null)

  // Filter by tipo
  const usuariosPorTipo = usuarios.filter((u) => {
    if (tipo === "transmagg") return u.rol === "ADMIN_TRANSMAGG" || u.rol === "OPERADOR_TRANSMAGG" || (u.rol === "CHOFER" && !u.fleteroId)
    if (tipo === "empresas") return u.rol === "ADMIN_EMPRESA" || u.rol === "OPERADOR_EMPRESA"
    if (tipo === "fleteros") return u.rol === "FLETERO" || (u.rol === "CHOFER" && u.fleteroId)
    return false
  })

  // Filter by selected empresa or fletero
  const contextoId = tipo === "empresas" ? empresaSelId : tipo === "fleteros" ? fleteroSelId : undefined
  const necesitaContexto = tipo === "empresas" || tipo === "fleteros"
  const tieneContexto = !!contextoId

  const usuariosConContexto = tipo === "empresas" && empresaSelId
    ? usuariosPorTipo.filter((u) => u.empresaUsuarios.some((eu) => eu.empresaId === empresaSelId))
    : tipo === "fleteros" && fleteroSelId
    ? usuariosPorTipo.filter((u) => u.fleteroId === fleteroSelId || u.fleteroPropio?.id === fleteroSelId)
    : usuariosPorTipo

  // Apply search
  const filtrados = busqueda
    ? usuariosConContexto.filter((u) => calcularFiltroUsuario(u, busqueda))
    : usuariosConContexto

  const TIPO_BUTTONS: { id: Tipo; label: string; icon: React.ReactNode }[] = [
    { id: "transmagg", label: "Transmagg", icon: <Users className="h-3.5 w-3.5" /> },
    { id: "empresas", label: "Empresas", icon: <Building2 className="h-3.5 w-3.5" /> },
    { id: "fleteros", label: "Fleteros", icon: <Truck className="h-3.5 w-3.5" /> },
  ]

  function handleTipo(t: Tipo) {
    setTipo(t)
    setBusqueda("")
  }

  return (
    <div className="space-y-5">
      {/* Tipo filter */}
      <div className="flex gap-2 flex-wrap">
        {TIPO_BUTTONS.map((b) => (
          <button
            key={b.id}
            onClick={() => handleTipo(b.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
              tipo === b.id
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border hover:bg-muted"
            }`}
          >
            {b.icon}
            {b.label}
          </button>
        ))}
      </div>

      {/* Empresa / Fletero selector */}
      {tipo === "empresas" && (
        <div className="space-y-1 max-w-sm">
          <Label className="text-xs">Empresa</Label>
          <SearchCombobox
            items={empresas.map((e) => ({ id: e.id, label: e.razonSocial, sublabel: e.cuit }))}
            value={empresaSelId}
            onChange={setEmpresaSelId}
            placeholder="Buscar por razón social o CUIT..."
          />
          {empresaSelId && (() => {
            const sel = empresas.find((e) => e.id === empresaSelId)
            return sel ? (
              <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2 text-sm">
                <span className="text-green-600">✓</span>
                <span className="font-medium">{sel.razonSocial}</span>
                <span className="text-muted-foreground">— CUIT: {sel.cuit}</span>
              </div>
            ) : null
          })()}
        </div>
      )}

      {tipo === "fleteros" && (
        <div className="space-y-1 max-w-sm">
          <Label className="text-xs">Fletero</Label>
          <SearchCombobox
            items={fleteros.map((f) => ({ id: f.id, label: f.razonSocial, sublabel: f.cuit }))}
            value={fleteroSelId}
            onChange={setFleteroSelId}
            placeholder="Buscar por razón social o CUIT..."
          />
          {fleteroSelId && (() => {
            const sel = fleteros.find((f) => f.id === fleteroSelId)
            return sel ? (
              <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2 text-sm">
                <span className="text-green-600">✓</span>
                <span className="font-medium">{sel.razonSocial}</span>
                <span className="text-muted-foreground">— CUIT: {sel.cuit}</span>
              </div>
            ) : null
          })()}
        </div>
      )}

      {/* Placeholder when context required but not selected */}
      {necesitaContexto && !tieneContexto ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <p className="text-sm text-muted-foreground">
            {tipo === "empresas"
              ? "Seleccioná una empresa para ver sus usuarios."
              : "Seleccioná un fletero para ver sus usuarios."}
          </p>
        </div>
      ) : (
        <>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, apellido, email o rol..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-9"
            />
          </div>

          <ListaUsuarios
            usuarios={filtrados}
            rolActual={rolActual}
            mostrarSmtp={tipo === "transmagg"}
            empresas={empresas}
            fleteros={fleteros}
            tipo={tipo}
            contextoId={contextoId}
            onSmtp={(u) => setDialogSmtp(u)}
          />
        </>
      )}

      <Dialog open={!!dialogSmtp} onOpenChange={(o) => { if (!o) setDialogSmtp(null) }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Configurar SMTP — {dialogSmtp?.nombre} {dialogSmtp?.apellido}</DialogTitle>
            <DialogDescription>
              Configurá la cuenta de email desde la que este usuario enviará documentos.
            </DialogDescription>
          </DialogHeader>
          {dialogSmtp && <SmtpModal usuario={dialogSmtp} onClose={() => setDialogSmtp(null)} />}
        </DialogContent>
      </Dialog>
    </div>
  )
}
