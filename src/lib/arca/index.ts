/**
 * Propósito: Re-export central de la capa ARCA.
 * Importar desde "@/lib/arca" para acceder a servicios, tipos y utilidades.
 */

// Servicios de autorización
export { autorizarLiquidacionArca, autorizarFacturaArca, autorizarNotaCDArca } from "./service"

// Configuración
export { cargarConfigArca, resolverUrls, arcaConfigurada } from "./config"

// Errores tipados
export {
  ArcaError,
  ArcaNoConfiguradaError,
  ArcaConfigIncompletaError,
  WsaaError,
  Wsfev1Error,
  ArcaRechazoError,
  DocumentoYaAutorizadoError,
  DocumentoEnProcesoError,
  ArcaValidacionError,
  DocumentoNoEncontradoError,
} from "./errors"

// Tipos
export type {
  TicketAcceso,
  ArcaConfig,
  ArcaUrls,
  AutorizarComprobanteResult,
  AutorizarComprobanteRechazo,
  TipoDocumentoArca,
  QRFiscalData,
} from "./types"

// QR fiscal
export { generarQRFiscal, obtenerUrlQRFiscal } from "./qr"

// Mappers
export {
  formatearFechaArca,
  parsearFechaArca,
  redondearArca,
  determinarTipoCbteLiquidacion,
  determinarTipoCbteFactura,
  mapearComprobanteArca,
} from "./mappers"

// Validadores
export { validarPreAutorizacion, validarDocumentoNoAutorizado } from "./validators"
