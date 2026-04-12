import type { Rol } from "@/types"
import type { ProvinciaArgentina } from "@/lib/provincias"

export type Fletero = { id: string; razonSocial: string; comisionDefault?: number }

export type FleteroInfo = {
  razonSocial: string
  cuit: string
  condicionIva: string
  direccion?: string | null
  nroProximoComprobante: number
}
export type Camion = { id: string; patenteChasis: string; fleteroId: string }
export type Chofer = { id: string; nombre: string; apellido: string }

export type ViajeParaLiquidar = {
  id: string
  fechaViaje: string
  empresaId: string
  empresa: { razonSocial: string }
  camionId: string
  camion: { patenteChasis: string }
  choferId: string
  chofer: { nombre: string; apellido: string }
  remito: string | null
  tieneCupo: boolean | null
  cupo: string | null
  mercaderia: string | null
  procedencia: string | null
  provinciaOrigen: string | null
  destino: string | null
  provinciaDestino: string | null
  kilos: number | null
  tarifaFletero: number
  tarifaEmpresa: number
  estadoFactura: string
  nroCartaPorte?: string | null
  // editados localmente
  kilosEdit?: number
  tarifaEdit?: number
  tarifaEmpresaEdit?: number
  fechaEdit?: string
  remitoEdit?: string
  tieneCupoEdit?: boolean
  cupoEdit?: string
  mercaderiaEdit?: string
  procedenciaEdit?: string
  origenEdit?: ProvinciaArgentina
  destinoEdit?: string
  provinciaDestinoEdit?: ProvinciaArgentina
  camionIdEdit?: string
  choferIdEdit?: string
}

export type ViajeEnLiquidacion = {
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
  tarifaFletero: number
  subtotal: number
}

export type Liquidacion = {
  id: string
  grabadaEn: string
  comisionPct: number
  ivaPct: number
  subtotalBruto: number
  comisionMonto: number
  neto: number
  ivaMonto: number
  total: number
  estado: string
  nroComprobante: number | null
  ptoVenta: number | null
  fleteroId: string
  fletero: { razonSocial: string }
  viajes: ViajeEnLiquidacion[]
  pagos: { id: string; monto: number; tipoPago: string; fechaPago: string; anulado: boolean; ordenPago?: { id: string; nro: number; anio: number; fecha: string; pdfS3Key?: string | null } | null }[]
  gastoDescuentos?: {
    id: string
    montoDescontado: number
    gasto: {
      tipo: string
      facturaProveedor: {
        tipoCbte: string
        nroComprobante: string | null
        proveedor: { razonSocial: string }
      }
    }
  }[]
}

// ─── Props ────────────────────────────────────────────────────────────────────

export type LiquidacionesClientProps = {
  rol: Rol
  fleteros: Fletero[]
  camiones: Camion[]
  choferes: Chofer[]
  fleteroIdPropio: string | null
  comprobantesHabilitados?: number[]
  titulo?: string
}

export type ImpactoItem = {
  tipo: string
  descripcion: string
  detalle: string
  estadoActual: string
  nuevoEstado: string
}

export type EntradaHistorial = {
  id: string
  tipoEvento: string
  justificacion: string
  estadoAnterior: string | null
  creadoEn: string
  operador: { nombre: string; apellido: string }
}

export type CuentaBancaria = { id: string; nombre: string; bancoOEntidad: string }
