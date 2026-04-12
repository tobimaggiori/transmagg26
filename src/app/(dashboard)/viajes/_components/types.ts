export type Fletero = { id: string; razonSocial: string; cuit: string; comisionDefault?: number }
export type Empresa = { id: string; razonSocial: string; cuit: string }
export type Camion = { id: string; patenteChasis: string; fleteroId: string | null; esPropio?: boolean; polizaVigente?: boolean; choferActualId?: string | null }
export type Chofer = { id: string; nombre: string; apellido: string; fleteroId: string | null }

export type ViajeAPI = {
  id: string
  fechaViaje: string
  fleteroId: string | null
  esCamionPropio: boolean
  empresaId: string
  remito: string | null
  remitoS3Key?: string | null
  tieneCupo: boolean | null
  cupo: string | null
  mercaderia: string | null
  procedencia: string | null
  provinciaOrigen: string | null
  destino: string | null
  provinciaDestino: string | null
  kilos: number | null
  tarifa?: number | null
  tarifaEmpresa?: number | null
  estadoLiquidacion: string
  estadoFactura: string
  nroCartaPorte?: string | null
  cartaPorteS3Key?: string | null
  enLiquidaciones?: Array<{
    liquidacion: { estado: string }
  }>
  toneladas?: number | null
  total?: number | null
  fletero: { razonSocial: string } | null
  empresa: { razonSocial: string }
  camion: { patenteChasis: string }
  chofer: { nombre: string; apellido: string }
  camionId: string
  choferId: string
  historialCambios?: string | null
}
