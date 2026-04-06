import type { Rol } from "@/types"

export type Empresa = { id: string; razonSocial: string }
export type Camion = { id: string; patenteChasis: string; fleteroId: string }
export type Chofer = { id: string; nombre: string; apellido: string }

export type ViajeParaFacturar = {
  id: string
  fechaViaje: string
  fleteroId: string
  empresaId: string
  empresa: { razonSocial: string }
  fletero: { razonSocial: string }
  camionId: string
  camion: { patenteChasis: string }
  choferId: string
  chofer: { nombre: string; apellido: string }
  remito: string | null
  cupo: string | null
  mercaderia: string | null
  procedencia: string | null
  provinciaOrigen: string | null
  destino: string | null
  provinciaDestino: string | null
  kilos: number | null
  tarifaEmpresa: number
  estadoLiquidacion: string
  // editados localmente
  kilosEdit?: number
  tarifaEmpresaEdit?: number
  fechaEdit?: string
  remitoEdit?: string
  cupoEdit?: string
  mercaderiaEdit?: string
  procedenciaEdit?: string
  origenEdit?: string
  destinoEdit?: string
  provinciaDestinoEdit?: string
  camionIdEdit?: string
  choferIdEdit?: string
}

export type ViajeEnFactura = {
  id: string
  fechaViaje: string
  remito: string | null
  cupo: string | null
  mercaderia: string | null
  procedencia: string | null
  provinciaOrigen: string | null
  destino: string | null
  provinciaDestino: string | null
  kilos: number | null
  tarifaEmpresa: number
  subtotal: number
}

export type Factura = {
  id: string
  emitidaEn: string
  tipoCbte: number
  ivaPct: number
  nroComprobante: string | null
  neto: number
  ivaMonto: number
  total: number
  estado: string
  estadoArca: string
  empresaId: string
  empresa: { razonSocial: string }
  viajes: ViajeEnFactura[]
  pagos: { monto: number }[]
}

export type CuentaBancaria = { id: string; nombre: string; bancoOEntidad: string }

export type FacturasClientProps = {
  rol: Rol
  empresas: Empresa[]
  camiones: Camion[]
  choferes: Chofer[]
  empresaIdPropia: string | null
  cuentasBancarias: CuentaBancaria[]
  comprobantesHabilitados?: number[]
}

export type NotaCDResumen = {
  id: string
  tipo: string
  subtipo: string | null
  montoTotal: number
  estado: string
  creadoEn: string
}
