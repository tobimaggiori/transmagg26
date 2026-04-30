"use client"

/**
 * UI para configurar permisos de operadores (modelo blacklist).
 *
 * Selector de operador → tabla de secciones agrupadas por padre con toggles.
 * Por defecto todos los toggles están en true; el admin destilda los que no
 * quiere que el operador acceda. Guardar dispara POST /api/usuarios/[id]/permisos
 * con la lista de secciones aún habilitadas.
 */

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"

interface OperadorData {
  id: string
  nombre: string
  apellido: string
  email: string | null
  permisos: string[]
}

interface Props {
  operadores: OperadorData[]
  secciones: string[]
}

// Etiquetas amigables por sección. Si una sección no figura acá, se usa
// el código tal cual.
const ETIQUETAS: Record<string, string> = {
  dashboard: "Dashboard",
  "dashboard.deuda_empresas": "Tarjeta deuda empresas",
  "dashboard.deuda_fleteros": "Tarjeta deuda fleteros",
  "dashboard.pendiente_facturar": "Tarjeta pendiente facturar",
  "dashboard.pendiente_liquidar": "Tarjeta pendiente liquidar",
  "dashboard.cheques_cartera": "Tarjeta cheques cartera",
  "dashboard.cheques_emitidos": "Tarjeta cheques emitidos",
  "dashboard.efectivo_caja": "Tarjeta efectivo en caja",
  "dashboard.cuentas_bancos": "Tarjeta cuentas bancarias",
  "dashboard.cuentas_brokers": "Tarjeta cuentas broker",
  "dashboard.cuentas_billeteras": "Tarjeta billeteras virtuales",
  fleteros: "Fleteros (módulo)",
  "fleteros.viajes": "Viajes",
  "fleteros.liquidos_productos": "Líquidos productos (LP)",
  "fleteros.ordenes_pago": "Órdenes de pago",
  "fleteros.gastos_adelantos": "Gastos y adelantos",
  "fleteros.cuentas_corrientes": "Cuentas corrientes fleteros",
  empresas: "Empresas (módulo)",
  "empresas.facturas": "Facturas",
  "empresas.recibos": "Recibos de cobranza",
  "empresas.cuentas_corrientes": "Cuentas corrientes empresas",
  proveedores: "Proveedores (módulo)",
  "proveedores.facturas": "Facturas de proveedor",
  "proveedores.pagos": "Pagos a proveedor",
  "proveedores.cuentas_corrientes": "Cuentas corrientes proveedor",
  contabilidad: "Contabilidad (módulo)",
  "contabilidad.reportes": "Reportes contables",
  "contabilidad.polizas": "Pólizas",
  "contabilidad.impuestos": "Impuestos",
  "contabilidad.comprobantes": "Comprobantes (consulta y export)",
  "contabilidad.comprobantes_eliminar": "Comprobantes (eliminar)",
  "contabilidad.fci": "FCI (conciliación y movimientos)",
  cuentas: "Cuentas y Tarjetas (módulo)",
  aseguradoras: "Aseguradoras",
  mi_flota: "Mi flota",
  abm: "ABM (módulo)",
  "abm.empresas": "ABM Empresas",
  "abm.fleteros": "ABM Fleteros",
  "abm.usuarios": "ABM Usuarios",
  "abm.proveedores": "ABM Proveedores",
  "abm.cuentas": "ABM Cuentas (bancos/brokers/billeteras)",
  "abm.fci": "ABM FCI",
  "abm.empleados": "ABM Empleados",
}

function etiqueta(seccion: string): string {
  return ETIQUETAS[seccion] ?? seccion
}

// Overrides para secciones que, por su jerarquía visual, deben agruparse
// bajo un módulo distinto al que indica su código interno.
const GRUPO_OVERRIDE: Record<string, string> = {
  aseguradoras: "proveedores",
}

function grupo(seccion: string): string {
  if (GRUPO_OVERRIDE[seccion]) return GRUPO_OVERRIDE[seccion]
  const idx = seccion.indexOf(".")
  return idx === -1 ? seccion : seccion.slice(0, idx)
}

export function PermisosOperadoresClient({ operadores, secciones }: Props) {
  const [seleccionado, setSeleccionado] = useState<string | null>(operadores[0]?.id ?? null)
  const [habilitados, setHabilitados] = useState<Set<string>>(
    () => new Set(operadores[0]?.permisos ?? []),
  )
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null)

  // Agrupar secciones por padre para una UI más limpia.
  const grupos = useMemo(() => {
    const map = new Map<string, string[]>()
    for (const s of secciones) {
      const g = grupo(s)
      const arr = map.get(g) ?? []
      arr.push(s)
      map.set(g, arr)
    }
    return Array.from(map.entries())
  }, [secciones])

  function elegirOperador(id: string) {
    const op = operadores.find((o) => o.id === id)
    if (!op) return
    setSeleccionado(id)
    setHabilitados(new Set(op.permisos))
    setMensaje(null)
  }

  function toggle(seccion: string) {
    setHabilitados((prev) => {
      const next = new Set(prev)
      if (next.has(seccion)) next.delete(seccion)
      else next.add(seccion)
      return next
    })
  }

  function toggleGrupo(grupoSecciones: string[], todos: boolean) {
    setHabilitados((prev) => {
      const next = new Set(prev)
      for (const s of grupoSecciones) {
        if (todos) next.delete(s)
        else next.add(s)
      }
      return next
    })
  }

  async function guardar() {
    if (!seleccionado) return
    setGuardando(true)
    setMensaje(null)
    try {
      const res = await fetch(`/api/usuarios/${seleccionado}/permisos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permisos: Array.from(habilitados) }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setMensaje({ tipo: "error", texto: data.error ?? "Error al guardar" })
        return
      }
      setMensaje({ tipo: "ok", texto: "Permisos guardados correctamente." })
    } catch {
      setMensaje({ tipo: "error", texto: "Error de red al guardar." })
    } finally {
      setGuardando(false)
    }
  }

  if (operadores.length === 0) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold">Permisos de operadores</h2>
          <p className="text-muted-foreground">No hay operadores activos para configurar.</p>
        </div>
      </div>
    )
  }

  const opActual = operadores.find((o) => o.id === seleccionado)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Permisos de operadores</h2>
        <p className="text-muted-foreground">
          Por defecto los operadores acceden a todas las secciones. Destildá las que no querés que
          este operador pueda usar.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <label className="text-sm font-medium">Operador:</label>
        <select
          value={seleccionado ?? ""}
          onChange={(e) => elegirOperador(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          {operadores.map((op) => (
            <option key={op.id} value={op.id}>
              {op.apellido}, {op.nombre} — {op.email}
            </option>
          ))}
        </select>
      </div>

      {opActual && (
        <div className="rounded-lg border border-border bg-card p-4 space-y-4">
          {grupos.map(([nombreGrupo, items]) => {
            const todosOn = items.every((s) => habilitados.has(s))
            const algunoOn = items.some((s) => habilitados.has(s))
            return (
              <div key={nombreGrupo} className="space-y-2">
                <div className="flex items-center justify-between border-b border-border pb-1">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    {etiqueta(nombreGrupo)}
                  </h3>
                  <button
                    type="button"
                    onClick={() => toggleGrupo(items, todosOn)}
                    className="text-xs text-primary hover:underline"
                  >
                    {todosOn ? "Quitar todos" : algunoOn ? "Activar todos" : "Activar todos"}
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {items.map((s) => {
                    const activo = habilitados.has(s)
                    return (
                      <label
                        key={s}
                        className="flex items-center gap-2 text-sm cursor-pointer rounded px-2 py-1 hover:bg-muted/40"
                      >
                        <input
                          type="checkbox"
                          checked={activo}
                          onChange={() => toggle(s)}
                          className="h-4 w-4 cursor-pointer"
                        />
                        <span className={activo ? "" : "text-muted-foreground line-through"}>
                          {etiqueta(s)}
                        </span>
                      </label>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button onClick={guardar} disabled={guardando || !seleccionado}>
          {guardando ? "Guardando..." : "Guardar permisos"}
        </Button>
        {mensaje && (
          <span
            className={`text-sm ${mensaje.tipo === "ok" ? "text-green-600" : "text-destructive"}`}
          >
            {mensaje.texto}
          </span>
        )}
      </div>
    </div>
  )
}
