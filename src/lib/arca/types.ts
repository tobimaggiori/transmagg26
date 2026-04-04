/**
 * Propósito: Tipos TypeScript para la integración ARCA (AFIP).
 * Define interfaces para WSAA, WSFEv1, payloads, respuestas y el servicio de autorización.
 * Ninguna lógica de negocio — solo contratos de datos.
 */

// ─── WSAA ────────────────────────────────────────────────────────────────────

/** Ticket de acceso devuelto por WSAA. Token + Sign válidos por ~12 horas. */
export interface TicketAcceso {
  token: string
  sign: string
  expiresAt: Date
}

// ─── WSFEv1 — Tipos de request ──────────────────────────────────────────────

/** Credenciales de autenticación para cada llamada a WSFEv1. */
export interface AuthWsfev1 {
  Token: string
  Sign: string
  Cuit: string
}

/** Detalle de IVA por alícuota en un comprobante. */
export interface AlicuotaIva {
  /** ID alícuota ARCA: 5 = 21%, 4 = 10.5%, 3 = 0%, 6 = 27% */
  Id: number
  BaseImp: number
  Importe: number
}

/** Comprobante asociado (requerido para NC/ND). */
export interface ComprobanteAsociado {
  Tipo: number
  PtoVta: number
  Nro: number
  Cuit: string
  CbteFch: string
}

/** Request body para FECAESolicitar. */
export interface FECAERequest {
  FeCabReq: {
    CantReg: number
    PtoVta: number
    CbteTipo: number
  }
  FeDetReq: {
    FECAEDetRequest: FECAEDetRequest[]
  }
}

/** Detalle de un comprobante dentro de FECAESolicitar. */
export interface FECAEDetRequest {
  Concepto: number
  DocTipo: number
  DocNro: number
  CbteDesde: number
  CbteHasta: number
  CbteFch: string
  ImpTotal: number
  ImpTotConc: number
  ImpNeto: number
  ImpOpEx: number
  ImpTrib: number
  ImpIVA: number
  MonId: string
  MonCotiz: number
  FchServDesde?: string
  FchServHasta?: string
  FchVtoPago?: string
  Iva?: { AlicIva: AlicuotaIva[] }
  CbtesAsoc?: { CbteAsoc: ComprobanteAsociado[] }
  /** CBU para FCE MiPyME (tipoCbte 201) */
  Opcionales?: { Opcional: { Id: string; Valor: string }[] }
}

// ─── WSFEv1 — Tipos de response ─────────────────────────────────────────────

/** Observación de ARCA (warning o error). */
export interface ObservacionArca {
  Code: number
  Msg: string
}

/** Detalle de respuesta por comprobante autorizado. */
export interface FECAEDetResponse {
  Concepto: number
  DocTipo: number
  DocNro: number
  CbteDesde: number
  CbteHasta: number
  CbteFch: string
  Resultado: "A" | "R"
  CAE: string
  CAEFchVto: string
  Observaciones?: { Obs: ObservacionArca[] }
}

/** Respuesta completa de FECAESolicitar. */
export interface FECAEResponse {
  FeCabResp: {
    Cuit: number
    PtoVta: number
    CbteTipo: number
    FchProceso: string
    CantReg: number
    Resultado: "A" | "R" | "P"
  }
  FeDetResp: {
    FECAEDetResponse: FECAEDetResponse[]
  }
  Errors?: { Err: ObservacionArca[] }
  Events?: { Evt: ObservacionArca[] }
}

/** Respuesta de FECompUltimoAutorizado. */
export interface UltimoAutorizadoResponse {
  PtoVta: number
  CbteTipo: number
  CbteNro: number
}

// ─── QR Fiscal ───────────────────────────────────────────────────────────────

/** Datos del QR fiscal según RG 4291 (AFIP). */
export interface QRFiscalData {
  ver: 1
  fecha: string
  cuit: number
  ptoVta: number
  tipoCmp: number
  nroCmp: number
  importe: number
  moneda: string
  ctz: number
  tipoDocRec: number
  nroDocRec: number
  tipoCodAut: "E"
  codAut: number
}

// ─── Servicio de autorización ────────────────────────────────────────────────

/** Tipo de documento a autorizar. */
export type TipoDocumentoArca = "FACTURA" | "LIQUIDACION" | "NOTA_CREDITO" | "NOTA_DEBITO"

/** Input para el servicio central de autorización. */
export interface AutorizarComprobanteInput {
  tipoDocumento: TipoDocumentoArca
  documentoId: string
  /** UUID de idempotencia generado por el frontend o la route. */
  idempotencyKey: string
}

/** Resultado de una autorización exitosa. */
export interface AutorizarComprobanteResult {
  ok: true
  cae: string
  caeVto: Date
  nroComprobante: number
  ptoVenta: number
  tipoCbte: number
  qrData: string
}

/** Resultado de un rechazo por ARCA. */
export interface AutorizarComprobanteRechazo {
  ok: false
  rechazado: true
  observaciones: string
}

// ─── Configuración ───────────────────────────────────────────────────────────

/** Configuración ARCA cargada desde DB, lista para usar. */
export interface ArcaConfig {
  cuit: string
  razonSocial: string
  certificadoB64: string
  certificadoPass: string
  modo: "homologacion" | "produccion"
  puntosVenta: Record<string, number>
  cbuMiPymes: string | null
  activa: boolean
}

/** URLs de los web services según el modo. */
export interface ArcaUrls {
  wsaaUrl: string
  wsfev1Url: string
}
