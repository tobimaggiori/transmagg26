"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { FormError } from "@/components/ui/form-error"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { formatearMoneda } from "@/lib/utils"
import { Plus, RefreshCw } from "lucide-react"

// --- Tipos ---

interface Cuenta {
  id: string
  nombre: string
  tipo: string
  bancoOEntidad: string
  moneda: string
  activa: boolean
  saldoContable: number
  saldoDisponible: number
}

interface FciItem {
  id: string
  nombre: string
  cuentaId: string
  moneda: string
  activo: boolean
  diasHabilesAlerta: number
  saldoActual: number
  saldoActualizadoEn: string | null
}

interface BrokerModel {
  id: string
  nombre: string
  cuit: string
  cuentaId: string
  activo: boolean
}

interface ChequeCartera {
  id: string
  nroCheque: string
  bancoEmisor: string
  monto: number
  fechaCobro: string
  empresa: { id: string; razonSocial: string } | null
  endosadoABrokerId: string | null
  fechaDepositoBroker: string | null
}

// --- Componente principal ---

export function BrokersClient() {
  const [brokers, setBrokers] = useState<Cuenta[]>([])
  const [fcis, setFcis] = useState<Record<string, FciItem[]>>({})
  const [brokerModels, setBrokerModels] = useState<BrokerModel[]>([])
  const [chequesCartera, setChequesCartera] = useState<ChequeCartera[]>([])
  const [chequesEndosados, setChequesEndosados] = useState<ChequeCartera[]>([])
  const [cuentasBanco, setCuentasBanco] = useState<Cuenta[]>([])
  const [loading, setLoading] = useState(true)

  // Modal nuevo broker
  const [modalBroker, setModalBroker] = useState(false)
  const [formBroker, setFormBroker] = useState({ nombre: "" })
  const [guardandoBroker, setGuardandoBroker] = useState(false)
  const [errorBroker, setErrorBroker] = useState("")

  // Modal nuevo FCI
  const [modalFci, setModalFci] = useState(false)
  const [brokerParaFci, setBrokerParaFci] = useState<Cuenta | null>(null)
  const [formFci, setFormFci] = useState({ nombre: "", moneda: "PESOS", saldoInicial: "" })
  const [guardandoFci, setGuardandoFci] = useState(false)
  const [errorFci, setErrorFci] = useState("")

  // Modal actualizar saldo FCI
  const [modalSaldo, setModalSaldo] = useState(false)
  const [fciParaSaldo, setFciParaSaldo] = useState<FciItem | null>(null)
  const [formSaldo, setFormSaldo] = useState({ saldoNuevo: "", fechaConsulta: new Date().toISOString().slice(0, 10) })
  const [guardandoSaldo, setGuardandoSaldo] = useState(false)
  const [errorSaldo, setErrorSaldo] = useState("")

  // Modal endosar cheque
  const [modalEndosar, setModalEndosar] = useState(false)
  const [brokerParaEndosar, setBrokerParaEndosar] = useState<Cuenta | null>(null)
  const [chequeSeleccionado, setChequeSeleccionado] = useState("")
  const [guardandoEndoso, setGuardandoEndoso] = useState(false)
  const [errorEndoso, setErrorEndoso] = useState("")

  // Modal confirmar depósito
  const [modalConfirmarDeposito, setModalConfirmarDeposito] = useState(false)
  const [chequeParaConfirmar, setChequeParaConfirmar] = useState<ChequeCartera | null>(null)
  const [fechaDeposito, setFechaDeposito] = useState(new Date().toISOString().slice(0, 10))
  const [guardandoDeposito, setGuardandoDeposito] = useState(false)
  const [errorDeposito, setErrorDeposito] = useState("")

  // Modal rescate (Forma A — transferencia)
  const [modalRescate, setModalRescate] = useState(false)
  const [brokerParaRescate, setBrokerParaRescate] = useState<Cuenta | null>(null)
  const [formRescate, setFormRescate] = useState({ cuentaDestinoId: "", monto: "", fecha: new Date().toISOString().slice(0, 10), referencia: "" })
  const [guardandoRescate, setGuardandoRescate] = useState(false)
  const [errorRescate, setErrorRescate] = useState("")

  // Modal cheque de broker (Forma B)
  const [modalChequeBroker, setModalChequeBroker] = useState(false)
  const [brokerParaChequeBroker, setBrokerParaChequeBroker] = useState<Cuenta | null>(null)
  const [formChequeBroker, setFormChequeBroker] = useState({ nroCheque: "", bancoEmisor: "", monto: "", fechaEmision: new Date().toISOString().slice(0, 10), fechaCobro: "" })
  const [guardandoChequeBroker, setGuardandoChequeBroker] = useState(false)
  const [errorChequeBroker, setErrorChequeBroker] = useState("")

  // Modal suscripción FCI
  const [modalSuscripcion, setModalSuscripcion] = useState(false)
  const [fciParaSuscripcion, setFciParaSuscripcion] = useState<FciItem | null>(null)
  const [formSuscripcion, setFormSuscripcion] = useState({ cuentaId: "", monto: "", fecha: new Date().toISOString().slice(0, 10) })
  const [guardandoSuscripcion, setGuardandoSuscripcion] = useState(false)
  const [errorSuscripcion, setErrorSuscripcion] = useState("")

  // Modal rescate FCI
  const [modalRescateFci, setModalRescateFci] = useState(false)
  const [fciParaRescate, setFciParaRescate] = useState<FciItem | null>(null)
  const [formRescateFci, setFormRescateFci] = useState({ cuentaId: "", monto: "", fecha: new Date().toISOString().slice(0, 10) })
  const [guardandoRescateFci, setGuardandoRescateFci] = useState(false)
  const [errorRescateFci, setErrorRescateFci] = useState("")

  const cargarDatos = useCallback(async () => {
    setLoading(true)
    try {
      const [cuentasRes, fciRes, brokersRes, chequesCarteraRes, chequesEndosadosRes] = await Promise.all([
        fetch("/api/cuentas"),
        fetch("/api/fci"),
        fetch("/api/brokers"),
        fetch("/api/cheques-recibidos/en-cartera"),
        fetch("/api/cheques-recibidos?estado=ENDOSADO_BROKER&limit=200"),
      ])
      const cuentasData: Cuenta[] = await cuentasRes.json()
      const fciData: FciItem[] = await fciRes.json()
      const brokersData: BrokerModel[] = await brokersRes.json()
      const chequesCarteraData: ChequeCartera[] = await chequesCarteraRes.json()
      const chequesEndosadosData: { cheques: ChequeCartera[] } = await chequesEndosadosRes.json()

      const brokersCargados = cuentasData.filter((c) => c.tipo === "BROKER")
      const bancosCargados = cuentasData.filter((c) => c.tipo === "BANCO" && c.activa)

      setBrokers(brokersCargados)
      setCuentasBanco(bancosCargados)
      setBrokerModels(brokersData)
      setChequesCartera(chequesCarteraData)
      setChequesEndosados(chequesEndosadosData.cheques ?? [])

      const fciPorBroker: Record<string, FciItem[]> = {}
      for (const broker of brokersCargados) {
        fciPorBroker[broker.id] = fciData.filter((f) => f.cuentaId === broker.id)
      }
      setFcis(fciPorBroker)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { cargarDatos() }, [cargarDatos])

  function getBrokerId(cuentaId: string): string | undefined {
    return brokerModels.find((b) => b.cuentaId === cuentaId)?.id
  }

  const totalSaldoBrokers = brokers.reduce((sum, b) => {
    const saldoFcis = (fcis[b.id] ?? []).reduce((s, f) => s + f.saldoActual, 0)
    return sum + b.saldoDisponible + saldoFcis
  }, 0)

  // --- Guardar broker ---
  async function guardarBroker() {
    setErrorBroker("")
    if (!formBroker.nombre.trim()) { setErrorBroker("El nombre es obligatorio"); return }
    setGuardandoBroker(true)
    try {
      const res = await fetch("/api/cuentas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: formBroker.nombre.trim(),
          tipo: "BROKER",
          bancoOEntidad: formBroker.nombre.trim(),
          moneda: "PESOS",
          saldoInicial: 0,
          activa: true,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        setErrorBroker(d.error ?? "Error al crear el broker")
        return
      }
      setModalBroker(false)
      setFormBroker({ nombre: "" })
      cargarDatos()
    } finally {
      setGuardandoBroker(false)
    }
  }

  // --- Nuevo FCI ---
  function abrirModalFci(broker: Cuenta) {
    setBrokerParaFci(broker)
    setFormFci({ nombre: "", moneda: "PESOS", saldoInicial: "" })
    setErrorFci("")
    setModalFci(true)
  }

  async function guardarFci() {
    setErrorFci("")
    if (!brokerParaFci) return
    if (!formFci.nombre.trim()) { setErrorFci("El nombre es obligatorio"); return }
    setGuardandoFci(true)
    try {
      const fciRes = await fetch("/api/fci", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: formFci.nombre.trim(),
          cuentaId: brokerParaFci.id,
          moneda: formFci.moneda,
          activo: true,
          diasHabilesAlerta: 1,
        }),
      })
      if (!fciRes.ok) {
        const d = await fciRes.json()
        setErrorFci(d.error ?? "Error al crear el FCI")
        return
      }
      const fciCreado: FciItem = await fciRes.json()
      const saldoInicial = parseFloat(formFci.saldoInicial)
      if (!isNaN(saldoInicial) && saldoInicial > 0) {
        await fetch(`/api/fci/${fciCreado.id}/actualizar-saldo`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            saldoNuevo: saldoInicial,
            fechaConsulta: new Date().toISOString().slice(0, 10),
          }),
        })
      }
      setModalFci(false)
      cargarDatos()
    } finally {
      setGuardandoFci(false)
    }
  }

  // --- Actualizar saldo FCI ---
  function abrirModalSaldo(fci: FciItem) {
    setFciParaSaldo(fci)
    setFormSaldo({ saldoNuevo: "", fechaConsulta: new Date().toISOString().slice(0, 10) })
    setErrorSaldo("")
    setModalSaldo(true)
  }

  async function actualizarSaldo() {
    setErrorSaldo("")
    if (!fciParaSaldo) return
    const saldo = parseFloat(formSaldo.saldoNuevo)
    if (isNaN(saldo)) { setErrorSaldo("El saldo debe ser un número"); return }
    if (!formSaldo.fechaConsulta) { setErrorSaldo("La fecha es obligatoria"); return }
    setGuardandoSaldo(true)
    try {
      const res = await fetch(`/api/fci/${fciParaSaldo.id}/actualizar-saldo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ saldoNuevo: saldo, fechaConsulta: formSaldo.fechaConsulta }),
      })
      if (!res.ok) {
        const d = await res.json()
        setErrorSaldo(d.error ?? "Error al actualizar saldo")
        return
      }
      setModalSaldo(false)
      cargarDatos()
    } finally {
      setGuardandoSaldo(false)
    }
  }

  // --- Endosar cheque ---
  function abrirModalEndosar(broker: Cuenta) {
    setBrokerParaEndosar(broker)
    setChequeSeleccionado("")
    setErrorEndoso("")
    setModalEndosar(true)
  }

  async function guardarEndoso() {
    setErrorEndoso("")
    if (!brokerParaEndosar) return
    if (!chequeSeleccionado) { setErrorEndoso("Seleccioná un cheque"); return }
    const brokerId = getBrokerId(brokerParaEndosar.id)
    if (!brokerId) { setErrorEndoso("Broker no encontrado"); return }
    setGuardandoEndoso(true)
    try {
      const res = await fetch(`/api/cheques-recibidos/${chequeSeleccionado}/endosar-broker`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brokerId }),
      })
      if (!res.ok) {
        const d = await res.json()
        setErrorEndoso(d.error ?? "Error al endosar el cheque")
        return
      }
      setModalEndosar(false)
      cargarDatos()
    } finally {
      setGuardandoEndoso(false)
    }
  }

  // --- Confirmar depósito ---
  function abrirModalConfirmarDeposito(cheque: ChequeCartera) {
    setChequeParaConfirmar(cheque)
    setFechaDeposito(new Date().toISOString().slice(0, 10))
    setErrorDeposito("")
    setModalConfirmarDeposito(true)
  }

  async function guardarConfirmarDeposito() {
    setErrorDeposito("")
    if (!chequeParaConfirmar) return
    if (!fechaDeposito) { setErrorDeposito("La fecha es obligatoria"); return }
    setGuardandoDeposito(true)
    try {
      const res = await fetch(`/api/cheques-recibidos/${chequeParaConfirmar.id}/confirmar-deposito-broker`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fechaDepositoBroker: fechaDeposito }),
      })
      if (!res.ok) {
        const d = await res.json()
        setErrorDeposito(d.error ?? "Error al confirmar depósito")
        return
      }
      setModalConfirmarDeposito(false)
      cargarDatos()
    } finally {
      setGuardandoDeposito(false)
    }
  }

  // --- Rescate por transferencia (Forma A) ---
  function abrirModalRescate(broker: Cuenta) {
    setBrokerParaRescate(broker)
    setFormRescate({ cuentaDestinoId: cuentasBanco[0]?.id ?? "", monto: "", fecha: new Date().toISOString().slice(0, 10), referencia: "" })
    setErrorRescate("")
    setModalRescate(true)
  }

  async function guardarRescate() {
    setErrorRescate("")
    if (!brokerParaRescate) return
    const monto = parseFloat(formRescate.monto)
    if (isNaN(monto) || monto <= 0) { setErrorRescate("El monto debe ser mayor a 0"); return }
    if (!formRescate.cuentaDestinoId) { setErrorRescate("Seleccioná una cuenta destino"); return }
    if (!formRescate.fecha) { setErrorRescate("La fecha es obligatoria"); return }
    setGuardandoRescate(true)
    try {
      const res = await fetch(`/api/cuentas/${brokerParaRescate.id}/rescate-broker`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cuentaDestinoId: formRescate.cuentaDestinoId,
          monto,
          fecha: formRescate.fecha,
          referencia: formRescate.referencia || null,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        setErrorRescate(d.error ?? "Error al registrar la transferencia")
        return
      }
      setModalRescate(false)
      cargarDatos()
    } finally {
      setGuardandoRescate(false)
    }
  }

  // --- Cheque emitido por broker (Forma B) ---
  function abrirModalChequeBroker(broker: Cuenta) {
    setBrokerParaChequeBroker(broker)
    setFormChequeBroker({ nroCheque: "", bancoEmisor: "", monto: "", fechaEmision: new Date().toISOString().slice(0, 10), fechaCobro: "" })
    setErrorChequeBroker("")
    setModalChequeBroker(true)
  }

  async function guardarChequeBroker() {
    setErrorChequeBroker("")
    if (!brokerParaChequeBroker) return
    if (!formChequeBroker.nroCheque.trim()) { setErrorChequeBroker("El número de cheque es obligatorio"); return }
    if (!formChequeBroker.bancoEmisor.trim()) { setErrorChequeBroker("El banco emisor es obligatorio"); return }
    const monto = parseFloat(formChequeBroker.monto)
    if (isNaN(monto) || monto <= 0) { setErrorChequeBroker("El monto debe ser mayor a 0"); return }
    if (!formChequeBroker.fechaCobro) { setErrorChequeBroker("La fecha de cobro es obligatoria"); return }
    setGuardandoChequeBroker(true)
    try {
      const res = await fetch(`/api/cuentas/${brokerParaChequeBroker.id}/cheque-de-broker`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nroCheque: formChequeBroker.nroCheque.trim(),
          bancoEmisor: formChequeBroker.bancoEmisor.trim(),
          monto,
          fechaEmision: formChequeBroker.fechaEmision,
          fechaCobro: formChequeBroker.fechaCobro,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        setErrorChequeBroker(d.error ?? "Error al registrar el cheque")
        return
      }
      setModalChequeBroker(false)
      cargarDatos()
    } finally {
      setGuardandoChequeBroker(false)
    }
  }

  // --- Suscripción FCI ---
  function abrirModalSuscripcion(fci: FciItem) {
    setFciParaSuscripcion(fci)
    setFormSuscripcion({ cuentaId: cuentasBanco[0]?.id ?? "", monto: "", fecha: new Date().toISOString().slice(0, 10) })
    setErrorSuscripcion("")
    setModalSuscripcion(true)
  }

  async function guardarSuscripcion() {
    setErrorSuscripcion("")
    if (!fciParaSuscripcion) return
    const monto = parseFloat(formSuscripcion.monto)
    if (isNaN(monto) || monto <= 0) { setErrorSuscripcion("El monto debe ser mayor a 0"); return }
    if (!formSuscripcion.cuentaId) { setErrorSuscripcion("Seleccioná una cuenta bancaria"); return }
    if (!formSuscripcion.fecha) { setErrorSuscripcion("La fecha es obligatoria"); return }
    setGuardandoSuscripcion(true)
    try {
      const res = await fetch(`/api/fci/${fciParaSuscripcion.id}/suscribir`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cuentaId: formSuscripcion.cuentaId, monto, fecha: formSuscripcion.fecha }),
      })
      if (!res.ok) {
        const d = await res.json()
        setErrorSuscripcion(d.error ?? "Error al suscribir al FCI")
        return
      }
      setModalSuscripcion(false)
      cargarDatos()
    } finally {
      setGuardandoSuscripcion(false)
    }
  }

  // --- Rescate FCI ---
  function abrirModalRescateFci(fci: FciItem) {
    setFciParaRescate(fci)
    setFormRescateFci({ cuentaId: cuentasBanco[0]?.id ?? "", monto: "", fecha: new Date().toISOString().slice(0, 10) })
    setErrorRescateFci("")
    setModalRescateFci(true)
  }

  async function guardarRescateFci() {
    setErrorRescateFci("")
    if (!fciParaRescate) return
    const monto = parseFloat(formRescateFci.monto)
    if (isNaN(monto) || monto <= 0) { setErrorRescateFci("El monto debe ser mayor a 0"); return }
    if (!formRescateFci.cuentaId) { setErrorRescateFci("Seleccioná una cuenta bancaria"); return }
    if (!formRescateFci.fecha) { setErrorRescateFci("La fecha es obligatoria"); return }
    setGuardandoRescateFci(true)
    try {
      const res = await fetch(`/api/fci/${fciParaRescate.id}/rescatar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cuentaId: formRescateFci.cuentaId, monto, fecha: formRescateFci.fecha }),
      })
      if (!res.ok) {
        const d = await res.json()
        setErrorRescateFci(d.error ?? "Error al rescatar del FCI")
        return
      }
      setModalRescateFci(false)
      cargarDatos()
    } finally {
      setGuardandoRescateFci(false)
    }
  }

  return (
    <div className="flex flex-col gap-0">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <h2 className="text-xl font-semibold">Cuentas Broker</h2>
        <Button onClick={() => { setFormBroker({ nombre: "" }); setErrorBroker(""); setModalBroker(true) }}>
          <Plus className="h-4 w-4 mr-1" />
          Agregar broker
        </Button>
      </div>

      <div className="p-6 space-y-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">Cargando...</p>
        ) : brokers.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin brokers registrados.</p>
        ) : (
          <>
            {brokers.map((broker) => {
              const fcisBroker = fcis[broker.id] ?? []
              const saldoTotalBroker = broker.saldoDisponible + fcisBroker.reduce((s, f) => s + f.saldoActual, 0)
              const chequesEndosadosBroker = chequesEndosados.filter(
                (c) => c.endosadoABrokerId === broker.id && !c.fechaDepositoBroker
              )
              return (
                <div key={broker.id} className="border rounded overflow-hidden">
                  {/* Header del broker */}
                  <div className="flex items-center justify-between px-4 py-3 bg-muted/20 border-b">
                    <div>
                      <h3 className="font-semibold">{broker.nombre}</h3>
                      <p className="text-sm text-muted-foreground">
                        Disponible en cuenta: {formatearMoneda(broker.saldoDisponible)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Total en broker</p>
                        <p className="font-bold">{formatearMoneda(saldoTotalBroker)}</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => abrirModalFci(broker)}>
                        <Plus className="h-3 w-3 mr-1" />
                        FCI
                      </Button>
                    </div>
                  </div>

                  {/* Acciones del broker */}
                  <div className="flex flex-wrap gap-2 px-4 py-3 border-b bg-muted/5">
                    <Button variant="outline" size="sm" onClick={() => abrirModalEndosar(broker)}>
                      Endosar cheque a broker
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => abrirModalRescate(broker)}>
                      Registrar transferencia recibida
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => abrirModalChequeBroker(broker)}>
                      Registrar cheque emitido por broker
                    </Button>
                  </div>

                  {/* Cheques pendientes de confirmación */}
                  {chequesEndosadosBroker.length > 0 && (
                    <div className="px-4 py-3 border-b">
                      <p className="text-sm font-medium mb-2 text-muted-foreground">Cheques pendientes de confirmación de depósito</p>
                      <div className="space-y-1">
                        {chequesEndosadosBroker.map((c) => (
                          <div key={c.id} className="flex items-center justify-between text-sm">
                            <span>
                              Nro {c.nroCheque} — {c.bancoEmisor} — {formatearMoneda(c.monto)}
                              {c.empresa && <span className="text-muted-foreground ml-1">({c.empresa.razonSocial})</span>}
                            </span>
                            <Button variant="outline" size="sm" onClick={() => abrirModalConfirmarDeposito(c)}>
                              Confirmar depósito
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* FCIs */}
                  {fcisBroker.length === 0 ? (
                    <p className="px-4 py-3 text-sm text-muted-foreground">Sin FCI registrados.</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-muted-foreground bg-muted/10">
                          <th className="px-4 py-2 font-medium">FCI</th>
                          <th className="px-4 py-2 font-medium">Moneda</th>
                          <th className="px-4 py-2 font-medium text-right">Saldo actual</th>
                          <th className="px-4 py-2 font-medium">Actualizado</th>
                          <th className="px-4 py-2"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {fcisBroker.map((fci) => (
                          <tr key={fci.id} className="border-b last:border-0 hover:bg-muted/20">
                            <td className="px-4 py-2 font-medium">{fci.nombre}</td>
                            <td className="px-4 py-2 text-muted-foreground">
                              {fci.moneda === "PESOS" ? "ARS" : fci.moneda === "DOLARES" ? "USD" : fci.moneda}
                            </td>
                            <td className="px-4 py-2 text-right font-mono">{formatearMoneda(fci.saldoActual)}</td>
                            <td className="px-4 py-2 text-xs text-muted-foreground">
                              {fci.saldoActualizadoEn ? fci.saldoActualizadoEn.slice(0, 10) : "—"}
                            </td>
                            <td className="px-4 py-2 text-right">
                              <div className="flex justify-end gap-1">
                                <Button variant="outline" size="sm" onClick={() => abrirModalSuscripcion(fci)}>
                                  Suscribir
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => abrirModalRescateFci(fci)}>
                                  Rescatar
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => abrirModalSaldo(fci)}>
                                  <RefreshCw className="h-3 w-3 mr-1" />
                                  Saldo
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )
            })}

            {/* Fila total */}
            <div className="flex items-center justify-between border rounded px-4 py-3 bg-muted/10">
              <span className="font-semibold">Total en brokers</span>
              <span className="text-lg font-bold">{formatearMoneda(totalSaldoBrokers)}</span>
            </div>
          </>
        )}
      </div>

      {/* Modal nuevo broker */}
      <Dialog open={modalBroker} onOpenChange={setModalBroker}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar broker</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Nombre</Label>
              <Input
                value={formBroker.nombre}
                onChange={(e) => setFormBroker({ nombre: e.target.value })}
                placeholder="Ej: Balanz Capital"
              />
            </div>
            {errorBroker && <FormError message={errorBroker} />}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setModalBroker(false)}>Cancelar</Button>
            <Button onClick={guardarBroker} disabled={guardandoBroker}>
              {guardandoBroker ? "Guardando..." : "Crear"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal nuevo FCI */}
      <Dialog open={modalFci} onOpenChange={setModalFci}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar FCI — {brokerParaFci?.nombre}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Nombre del FCI</Label>
              <Input
                value={formFci.nombre}
                onChange={(e) => setFormFci((f) => ({ ...f, nombre: e.target.value }))}
                placeholder="Ej: Fondo Renta Variable"
              />
            </div>
            <div>
              <Label>Moneda</Label>
              <Select value={formFci.moneda} onChange={(e) => setFormFci((f) => ({ ...f, moneda: e.target.value }))}>
                <option value="PESOS">ARS (Pesos)</option>
                <option value="DOLARES">USD (Dólares)</option>
              </Select>
            </div>
            <div>
              <Label>Saldo inicial</Label>
              <Input
                type="number"
                min="0"
                value={formFci.saldoInicial}
                onChange={(e) => setFormFci((f) => ({ ...f, saldoInicial: e.target.value }))}
                placeholder="0"
              />
            </div>
            {errorFci && <FormError message={errorFci} />}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setModalFci(false)}>Cancelar</Button>
            <Button onClick={guardarFci} disabled={guardandoFci}>
              {guardandoFci ? "Guardando..." : "Crear"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal actualizar saldo FCI */}
      <Dialog open={modalSaldo} onOpenChange={setModalSaldo}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Actualizar saldo — {fciParaSaldo?.nombre}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded bg-muted/20 px-3 py-2 text-sm">
              <span className="text-muted-foreground">Saldo en sistema: </span>
              <span className="font-semibold">{fciParaSaldo ? formatearMoneda(fciParaSaldo.saldoActual) : "—"}</span>
            </div>
            <div>
              <Label>Nuevo saldo</Label>
              <Input
                type="number"
                min="0"
                value={formSaldo.saldoNuevo}
                onChange={(e) => setFormSaldo((f) => ({ ...f, saldoNuevo: e.target.value }))}
                placeholder="0"
              />
            </div>
            <div>
              <Label>Fecha de consulta</Label>
              <Input
                type="date"
                value={formSaldo.fechaConsulta}
                onChange={(e) => setFormSaldo((f) => ({ ...f, fechaConsulta: e.target.value }))}
              />
            </div>
            {errorSaldo && <FormError message={errorSaldo} />}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setModalSaldo(false)}>Cancelar</Button>
            <Button onClick={actualizarSaldo} disabled={guardandoSaldo}>
              {guardandoSaldo ? "Actualizando..." : "Actualizar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal endosar cheque a broker */}
      <Dialog open={modalEndosar} onOpenChange={setModalEndosar}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Endosar cheque a {brokerParaEndosar?.nombre}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {chequesCartera.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay cheques en cartera disponibles.</p>
            ) : (
              <div>
                <Label>Cheque en cartera</Label>
                <Select value={chequeSeleccionado} onChange={(e) => setChequeSeleccionado(e.target.value)}>
                  <option value="">Seleccioná un cheque...</option>
                  {chequesCartera.map((c) => (
                    <option key={c.id} value={c.id}>
                      Nro {c.nroCheque} — {c.bancoEmisor} — {formatearMoneda(c.monto)}
                      {c.empresa ? ` (${c.empresa.razonSocial})` : ""}
                      {" — vence "}{c.fechaCobro.slice(0, 10)}
                    </option>
                  ))}
                </Select>
              </div>
            )}
            {errorEndoso && <FormError message={errorEndoso} />}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setModalEndosar(false)}>Cancelar</Button>
            <Button onClick={guardarEndoso} disabled={guardandoEndoso || chequesCartera.length === 0}>
              {guardandoEndoso ? "Endosando..." : "Endosar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal confirmar depósito */}
      <Dialog open={modalConfirmarDeposito} onOpenChange={setModalConfirmarDeposito}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar depósito</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {chequeParaConfirmar && (
              <div className="rounded bg-muted/20 px-3 py-2 text-sm space-y-1">
                <p><span className="text-muted-foreground">Cheque Nro: </span>{chequeParaConfirmar.nroCheque}</p>
                <p><span className="text-muted-foreground">Banco: </span>{chequeParaConfirmar.bancoEmisor}</p>
                <p><span className="text-muted-foreground">Monto: </span><span className="font-semibold">{formatearMoneda(chequeParaConfirmar.monto)}</span></p>
              </div>
            )}
            <div>
              <Label>Fecha de depósito</Label>
              <Input
                type="date"
                value={fechaDeposito}
                onChange={(e) => setFechaDeposito(e.target.value)}
              />
            </div>
            {errorDeposito && <FormError message={errorDeposito} />}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setModalConfirmarDeposito(false)}>Cancelar</Button>
            <Button onClick={guardarConfirmarDeposito} disabled={guardandoDeposito}>
              {guardandoDeposito ? "Confirmando..." : "Confirmar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal rescate por transferencia (Forma A) */}
      <Dialog open={modalRescate} onOpenChange={setModalRescate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar transferencia recibida — {brokerParaRescate?.nombre}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Cuenta destino</Label>
              <Select
                value={formRescate.cuentaDestinoId}
                onChange={(e) => setFormRescate((f) => ({ ...f, cuentaDestinoId: e.target.value }))}
              >
                <option value="">Seleccioná una cuenta...</option>
                {cuentasBanco.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre} — {c.bancoOEntidad}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Monto neto recibido</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formRescate.monto}
                onChange={(e) => setFormRescate((f) => ({ ...f, monto: e.target.value }))}
                placeholder="0.00"
              />
              <p className="text-xs text-muted-foreground mt-1">Ingresá el monto neto que llegó a la cuenta (ya descontado el impuesto débito/crédito del 0,6% si aplica).</p>
            </div>
            <div>
              <Label>Fecha</Label>
              <Input
                type="date"
                value={formRescate.fecha}
                onChange={(e) => setFormRescate((f) => ({ ...f, fecha: e.target.value }))}
              />
            </div>
            <div>
              <Label>Referencia (opcional)</Label>
              <Input
                value={formRescate.referencia}
                onChange={(e) => setFormRescate((f) => ({ ...f, referencia: e.target.value }))}
                placeholder="Ej: CBU/CVU, comprobante..."
              />
            </div>
            {errorRescate && <FormError message={errorRescate} />}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setModalRescate(false)}>Cancelar</Button>
            <Button onClick={guardarRescate} disabled={guardandoRescate}>
              {guardandoRescate ? "Guardando..." : "Registrar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal cheque emitido por broker (Forma B) */}
      <Dialog open={modalChequeBroker} onOpenChange={setModalChequeBroker}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar cheque emitido por {brokerParaChequeBroker?.nombre}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Nro. cheque</Label>
              <Input
                value={formChequeBroker.nroCheque}
                onChange={(e) => setFormChequeBroker((f) => ({ ...f, nroCheque: e.target.value }))}
                placeholder="Ej: 00012345"
              />
            </div>
            <div>
              <Label>Banco emisor</Label>
              <Input
                value={formChequeBroker.bancoEmisor}
                onChange={(e) => setFormChequeBroker((f) => ({ ...f, bancoEmisor: e.target.value }))}
                placeholder="Ej: Balanz Capital"
              />
            </div>
            <div>
              <Label>Monto</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formChequeBroker.monto}
                onChange={(e) => setFormChequeBroker((f) => ({ ...f, monto: e.target.value }))}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label>Fecha de emisión</Label>
              <Input
                type="date"
                value={formChequeBroker.fechaEmision}
                onChange={(e) => setFormChequeBroker((f) => ({ ...f, fechaEmision: e.target.value }))}
              />
            </div>
            <div>
              <Label>Fecha de cobro</Label>
              <Input
                type="date"
                value={formChequeBroker.fechaCobro}
                onChange={(e) => setFormChequeBroker((f) => ({ ...f, fechaCobro: e.target.value }))}
              />
            </div>
            {errorChequeBroker && <FormError message={errorChequeBroker} />}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setModalChequeBroker(false)}>Cancelar</Button>
            <Button onClick={guardarChequeBroker} disabled={guardandoChequeBroker}>
              {guardandoChequeBroker ? "Guardando..." : "Registrar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal suscripción FCI */}
      <Dialog open={modalSuscripcion} onOpenChange={setModalSuscripcion}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suscribir a {fciParaSuscripcion?.nombre}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Cuenta bancaria origen</Label>
              <Select
                value={formSuscripcion.cuentaId}
                onChange={(e) => setFormSuscripcion((f) => ({ ...f, cuentaId: e.target.value }))}
              >
                <option value="">Seleccioná una cuenta...</option>
                {cuentasBanco.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre} — {c.bancoOEntidad}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Monto</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formSuscripcion.monto}
                onChange={(e) => setFormSuscripcion((f) => ({ ...f, monto: e.target.value }))}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label>Fecha</Label>
              <Input
                type="date"
                value={formSuscripcion.fecha}
                onChange={(e) => setFormSuscripcion((f) => ({ ...f, fecha: e.target.value }))}
              />
            </div>
            {errorSuscripcion && <FormError message={errorSuscripcion} />}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setModalSuscripcion(false)}>Cancelar</Button>
            <Button onClick={guardarSuscripcion} disabled={guardandoSuscripcion}>
              {guardandoSuscripcion ? "Suscribiendo..." : "Suscribir"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal rescate FCI */}
      <Dialog open={modalRescateFci} onOpenChange={setModalRescateFci}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rescatar de {fciParaRescate?.nombre}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {fciParaRescate && (
              <div className="rounded bg-muted/20 px-3 py-2 text-sm">
                <span className="text-muted-foreground">Saldo disponible: </span>
                <span className="font-semibold">{formatearMoneda(fciParaRescate.saldoActual)}</span>
              </div>
            )}
            <div>
              <Label>Cuenta bancaria destino</Label>
              <Select
                value={formRescateFci.cuentaId}
                onChange={(e) => setFormRescateFci((f) => ({ ...f, cuentaId: e.target.value }))}
              >
                <option value="">Seleccioná una cuenta...</option>
                {cuentasBanco.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre} — {c.bancoOEntidad}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Monto</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formRescateFci.monto}
                onChange={(e) => setFormRescateFci((f) => ({ ...f, monto: e.target.value }))}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label>Fecha</Label>
              <Input
                type="date"
                value={formRescateFci.fecha}
                onChange={(e) => setFormRescateFci((f) => ({ ...f, fecha: e.target.value }))}
              />
            </div>
            {errorRescateFci && <FormError message={errorRescateFci} />}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setModalRescateFci(false)}>Cancelar</Button>
            <Button onClick={guardarRescateFci} disabled={guardandoRescateFci}>
              {guardandoRescateFci ? "Rescatando..." : "Rescatar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
