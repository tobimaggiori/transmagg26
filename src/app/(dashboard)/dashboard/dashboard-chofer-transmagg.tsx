"use client"

/**
 * Propósito: Panel personal del chofer empleado de Transmagg.
 * Solo lectura — no expone montos de tarifas ni saldos reales.
 * Muestra: camión asignado, póliza de seguro, tarjeta, viajes y gastos.
 */

import { useState } from "react"
import {
  Truck,
  Shield,
  ShieldAlert,
  ShieldX,
  CreditCard,
  User,
  AlertTriangle,
} from "lucide-react"

// ── Tipos ─────────────────────────────────────────────────────────────────────

type Poliza = {
  id: string
  aseguradora: string
  nroPoliza: string
  cobertura: string | null
  vigenciaDesde: string
  vigenciaHasta: string
  estadoPoliza: "VIGENTE" | "POR_VENCER" | "VENCIDA"
  diasParaVencer: number
}

type CamionData = {
  id: string
  patenteChasis: string
  patenteAcoplado: string | null
  polizaActual: Poliza | null
} | null

type GastoTarjeta = {
  id: string
  tipoGasto: string
  monto: number
  fecha: string
  descripcion: string | null
}

type TarjetaData = {
  id: string
  nombre: string
  tipo: string
  banco: string
  ultimos4: string
  gastos: GastoTarjeta[]
} | null

type ViajeData = {
  id: string
  fechaViaje: string
  mercaderia: string | null
  provinciaOrigen: string | null
  provinciaDestino: string | null
  procedencia: string | null
  destino: string | null
  estadoFactura: string
  empresa: { razonSocial: string }
}

type EmpleadoData = {
  id: string
  nombre: string
  apellido: string
  cuit: string
  cargo: string | null
  fechaIngreso: string
}

type Props = {
  usuario: { nombre: string; apellido: string; email: string | null }
  empleado: EmpleadoData
  camion: CamionData
  tarjeta: TarjetaData
  viajes: ViajeData[]
}

type Tab = "viajes" | "gastos" | "adelantos"

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

function fmtMoneda(n: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(n)
}

function saludo() {
  const h = new Date().getHours()
  if (h < 12) return "Buenos días"
  if (h < 19) return "Buenas tardes"
  return "Buenas noches"
}

const TIPO_GASTO_LABELS: Record<string, string> = {
  COMBUSTIBLE: "Combustible",
  PEAJE: "Peaje",
  COMIDA: "Comida",
  ALOJAMIENTO: "Alojamiento",
  REPUESTO: "Repuesto",
  LAVADO: "Lavado",
  PAGO_PROVEEDOR: "Pago proveedor",
  OTRO: "Otro",
}

const ESTADO_FACTURA_LABELS: Record<string, string> = {
  PENDIENTE_FACTURAR: "Pendiente",
  EN_FACTURA: "Facturado",
  COMPLETO: "Facturado",
}

// ── Badges ────────────────────────────────────────────────────────────────────

function BadgePoliza({ estado }: { estado: Poliza["estadoPoliza"] }) {
  const map = {
    VIGENTE: { cls: "bg-green-50 text-green-700 border-green-200", label: "Vigente" },
    POR_VENCER: { cls: "bg-amber-50 text-amber-700 border-amber-200", label: "Por vencer" },
    VENCIDA: { cls: "bg-red-50 text-red-700 border-red-200", label: "Vencida" },
  }
  const { cls, label } = map[estado]
  return (
    <span className={`inline-block text-xs font-medium border rounded px-1.5 py-0.5 ${cls}`}>
      {label}
    </span>
  )
}

function BadgeFactura({ estado }: { estado: string }) {
  const isFacturado = estado !== "PENDIENTE_FACTURAR"
  return (
    <span
      className={`inline-block text-xs font-medium border rounded px-1.5 py-0.5 ${
        isFacturado
          ? "bg-green-50 text-green-700 border-green-200"
          : "bg-slate-50 text-slate-600 border-slate-200"
      }`}
    >
      {ESTADO_FACTURA_LABELS[estado] ?? estado}
    </span>
  )
}

function BadgeTarjeta({ tipo }: { tipo: string }) {
  const map: Record<string, string> = {
    PREPAGA: "bg-purple-50 text-purple-700 border-purple-200",
    CREDITO: "bg-blue-50 text-blue-700 border-blue-200",
    DEBITO: "bg-slate-50 text-slate-600 border-slate-200",
  }
  return (
    <span
      className={`inline-block text-xs font-medium border rounded px-1.5 py-0.5 ${
        map[tipo] ?? "bg-slate-50 text-slate-600 border-slate-200"
      }`}
    >
      {tipo}
    </span>
  )
}

// ── Cards ──────────────────────────────────────────────────────────────────────

function CardCamion({ camion }: { camion: CamionData }) {
  return (
    <div className="border rounded-xl p-5 space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        <Truck className="h-4 w-4" />
        Mi Camión
      </div>
      {!camion ? (
        <p className="text-sm text-muted-foreground">Sin camión asignado actualmente.</p>
      ) : (
        <div className="space-y-1.5 text-sm">
          <div className="flex gap-2">
            <span className="w-24 text-muted-foreground shrink-0">Patente</span>
            <span className="font-semibold">{camion.patenteChasis}</span>
          </div>
          {camion.patenteAcoplado && (
            <div className="flex gap-2">
              <span className="w-24 text-muted-foreground shrink-0">Acoplado</span>
              <span>{camion.patenteAcoplado}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function CardPoliza({ poliza }: { poliza: Poliza | null }) {
  return (
    <div className="border rounded-xl p-5 space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        <Shield className="h-4 w-4" />
        Seguro del Camión
      </div>
      {!poliza ? (
        <p className="text-sm text-muted-foreground">Sin información de seguro.</p>
      ) : (
        <>
          <div className="space-y-1.5 text-sm">
            <div className="flex gap-2">
              <span className="w-24 text-muted-foreground shrink-0">Compañía</span>
              <span className="font-medium">{poliza.aseguradora}</span>
            </div>
            <div className="flex gap-2">
              <span className="w-24 text-muted-foreground shrink-0">Nro.</span>
              <span>{poliza.nroPoliza}</span>
            </div>
            <div className="flex gap-2">
              <span className="w-24 text-muted-foreground shrink-0">Vence</span>
              <span>{fmt(poliza.vigenciaHasta)}</span>
            </div>
            {poliza.cobertura && (
              <div className="flex gap-2">
                <span className="w-24 text-muted-foreground shrink-0">Cobertura</span>
                <span>{poliza.cobertura}</span>
              </div>
            )}
            <div className="flex items-center gap-2 pt-1">
              <BadgePoliza estado={poliza.estadoPoliza} />
            </div>
          </div>
          {poliza.estadoPoliza === "POR_VENCER" && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
              <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
              <span>La póliza vence en {poliza.diasParaVencer} días. Contactá a Transmagg para renovarla.</span>
            </div>
          )}
          {poliza.estadoPoliza === "VENCIDA" && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
              <ShieldX className="h-4 w-4 shrink-0 mt-0.5" />
              <span>La póliza está vencida. Contactá a Transmagg de inmediato.</span>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function CardTarjeta({ tarjeta }: { tarjeta: TarjetaData }) {
  return (
    <div className="border rounded-xl p-5 space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        <CreditCard className="h-4 w-4" />
        Mi Tarjeta
      </div>
      {!tarjeta ? (
        <p className="text-sm text-muted-foreground">Sin tarjeta asignada.</p>
      ) : (
        <div className="space-y-1.5 text-sm">
          <div className="flex items-center gap-2">
            <BadgeTarjeta tipo={tarjeta.tipo} />
            <span className="font-medium">{tarjeta.nombre}</span>
          </div>
          <div className="flex gap-2">
            <span className="w-24 text-muted-foreground shrink-0">Banco</span>
            <span>{tarjeta.banco}</span>
          </div>
          <div className="flex gap-2">
            <span className="w-24 text-muted-foreground shrink-0">Últimos 4</span>
            <span className="font-mono">****{tarjeta.ultimos4}</span>
          </div>
        </div>
      )}
    </div>
  )
}

function CardMisDatos({ usuario, empleado }: { usuario: Props["usuario"]; empleado: EmpleadoData }) {
  function fmtCuit(cuit: string) {
    if (cuit.length === 11) {
      return `${cuit.slice(0, 2)}-${cuit.slice(2, 10)}-${cuit.slice(10)}`
    }
    return cuit
  }

  return (
    <div className="border rounded-xl p-5 space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        <User className="h-4 w-4" />
        Mis Datos
      </div>
      <div className="space-y-1.5 text-sm">
        <div className="flex gap-2">
          <span className="w-24 text-muted-foreground shrink-0">Nombre</span>
          <span className="font-medium">{empleado.nombre} {empleado.apellido}</span>
        </div>
        <div className="flex gap-2">
          <span className="w-24 text-muted-foreground shrink-0">CUIT</span>
          <span className="font-mono">{fmtCuit(empleado.cuit)}</span>
        </div>
        <div className="flex gap-2">
          <span className="w-24 text-muted-foreground shrink-0">Email</span>
          <span>{usuario.email}</span>
        </div>
        {empleado.cargo && (
          <div className="flex gap-2">
            <span className="w-24 text-muted-foreground shrink-0">Cargo</span>
            <span>{empleado.cargo}</span>
          </div>
        )}
        <div className="flex gap-2">
          <span className="w-24 text-muted-foreground shrink-0">Ingreso</span>
          <span>{fmt(empleado.fechaIngreso)}</span>
        </div>
      </div>
    </div>
  )
}

// ── Tabs ──────────────────────────────────────────────────────────────────────

function TabViajes({ viajes }: { viajes: ViajeData[] }) {
  if (viajes.length === 0) {
    return <p className="text-sm text-muted-foreground py-6 text-center">No hay viajes registrados.</p>
  }
  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-3 py-2 text-left font-medium">Fecha</th>
            <th className="px-3 py-2 text-left font-medium">Empresa</th>
            <th className="px-3 py-2 text-left font-medium">Origen</th>
            <th className="px-3 py-2 text-left font-medium">Destino</th>
            <th className="px-3 py-2 text-left font-medium">Mercadería</th>
            <th className="px-3 py-2 text-left font-medium">Estado</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {viajes.map((v) => (
            <tr key={v.id} className="hover:bg-muted/30">
              <td className="px-3 py-2 whitespace-nowrap">{fmt(v.fechaViaje)}</td>
              <td className="px-3 py-2">{v.empresa.razonSocial}</td>
              <td className="px-3 py-2 text-sm text-muted-foreground">
                {v.provinciaOrigen ?? v.procedencia ?? "-"}
              </td>
              <td className="px-3 py-2 text-sm text-muted-foreground">
                {v.provinciaDestino ?? v.destino ?? "-"}
              </td>
              <td className="px-3 py-2">{v.mercaderia ?? "-"}</td>
              <td className="px-3 py-2">
                <BadgeFactura estado={v.estadoFactura} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TabGastosTarjeta({ tarjeta }: { tarjeta: TarjetaData }) {
  if (!tarjeta) {
    return (
      <p className="text-sm text-muted-foreground py-6 text-center">No tenés tarjeta asignada.</p>
    )
  }
  if (tarjeta.gastos.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-6 text-center">No hay gastos registrados.</p>
    )
  }
  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-3 py-2 text-left font-medium">Fecha</th>
            <th className="px-3 py-2 text-left font-medium">Descripción</th>
            <th className="px-3 py-2 text-left font-medium">Tipo</th>
            <th className="px-3 py-2 text-right font-medium">Monto</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {tarjeta.gastos.map((g) => (
            <tr key={g.id} className="hover:bg-muted/30">
              <td className="px-3 py-2 whitespace-nowrap">{fmt(g.fecha)}</td>
              <td className="px-3 py-2">{g.descripcion ?? "-"}</td>
              <td className="px-3 py-2">{TIPO_GASTO_LABELS[g.tipoGasto] ?? g.tipoGasto}</td>
              <td className="px-3 py-2 text-right font-medium">{fmtMoneda(g.monto)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TabAdelantos() {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground gap-2">
      <AlertTriangle className="h-8 w-8 opacity-30" />
      <p className="text-sm">Los adelantos se gestionan a través de Transmagg.</p>
      <p className="text-xs">No hay adelantos registrados en este panel.</p>
    </div>
  )
}

// ── Componente principal ───────────────────────────────────────────────────────

export function DashboardChoferTransmagg({ usuario, empleado, camion, tarjeta, viajes }: Props) {
  const [tab, setTab] = useState<Tab>("viajes")

  const TABS: { id: Tab; label: string }[] = [
    { id: "viajes", label: "Mis Viajes" },
    { id: "gastos", label: "Gastos de Tarjeta" },
    { id: "adelantos", label: "Adelantos" },
  ]

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          {saludo()}, {usuario.nombre}
        </h2>
        <p className="text-muted-foreground">Chofer — Transmagg</p>
      </div>

      {/* Cards — grid 2 columnas en desktop */}
      <div className="grid gap-4 md:grid-cols-2">
        <CardCamion camion={camion} />
        <CardPoliza poliza={camion?.polizaActual ?? null} />
        <CardTarjeta tarjeta={tarjeta} />
        <CardMisDatos usuario={usuario} empleado={empleado} />
      </div>

      {/* Tabs */}
      <div>
        <div className="border-b">
          <nav className="flex gap-0 -mb-px">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  tab === t.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="pt-4">
          {tab === "viajes" && <TabViajes viajes={viajes} />}
          {tab === "gastos" && <TabGastosTarjeta tarjeta={tarjeta} />}
          {tab === "adelantos" && <TabAdelantos />}
        </div>
      </div>
    </div>
  )
}
